

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../utils/api';
import {
    BASE_XP_PER_CLICK,
    calculateXPForLevel,
    getLevelFromXP,
    calculateCombatStats,
    challengeBoss,
    generateRandomGear,
    calculateTownXPForLevel,
    generateShopItems,
    generateQuest,
    generatePotion
} from '../utils/gameLogic';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

const SAVE_KEY = '@rpg_expo_save_v1';

export const GameProvider = ({ children }) => {
    // Persistent State
    const [authToken, setAuthToken] = useState(null);
    const [characterName, setCharacterName] = useState(null);
    const [xp, setXp] = useState(0);
    const [bossesDefeated, setBossesDefeated] = useState(0);
    const [inventory, setInventory] = useState([]);
    const [equipped, setEquipped] = useState({
        Weapon: null,
        Armor: null,
        Helmet: null,
        Legs: null,
        Shield: null,
        Boots: null,
        Gloves: null,
        Amulet: null,
        'Magic Artifact': null
    });

    const [coins, setCoins] = useState(0);
    const [activePotions, setActivePotions] = useState([]); // Array of potions
    const [currentStamina, setCurrentStamina] = useState(15); // Current HP
    const [unlockedCreatures, setUnlockedCreatures] = useState([]); // Array of IDs
    const [freeRestAvailable, setFreeRestAvailable] = useState(false);
    const [townLevel, setTownLevel] = useState(1);
    const [townXP, setTownXP] = useState(0);
    const [activeQuest, setActiveQuest] = useState(null);
    const [shopStock, setShopStock] = useState({ blacksmith: [], potion: [], lastRefreshBlacksmith: 0, lastRefreshPotion: 0 });

    useEffect(() => {
        // Initialize shops if entirely empty on boot
        if (shopStock.blacksmith.length === 0 && shopStock.potion.length === 0) {
            // We can't call refreshShops directly if it's defined later, but due to hoisting we can if we structure it. 
            // Better to just let the first refresh happen later, or define refreshShops above.
        }
    }, [shopStock]);

    // Derived State
    const level = getLevelFromXP(xp);

    // Combat Level logic: "Higher combat level provides better accuracy..."
    // The user didn't specify a separate "Combat Level" formula vs "Level". 
    // "When the user gains enough experience, their combat level will go up."
    // This implies Level = Combat Level in this simple RPG. 
    // "Level 2 combat can be achieved at 80 experience."
    // So distinct skills aren't mentioned, just one "Experience" bar.
    const combatLevel = level;

    // Calculate Stats
    const gearStats = useMemo(() => {
        let totalStats = { accuracy: 0, maxHit: 0, defence: 0, speedBonus: 0, stamina: 0 };
        Object.values(equipped).forEach(item => {
            if (item) {
                totalStats.accuracy += item.stats.accuracy || 0;
                totalStats.maxHit += item.stats.maxHit || 0;
                totalStats.defence += item.stats.defence || 0;
                totalStats.speedBonus += item.stats.speedBonus || 0;
                totalStats.stamina += item.stats.stamina || 0;
            }
        });
        return totalStats;
    }, [equipped]);

    const playerStats = useMemo(() => {
        const stats = calculateCombatStats(combatLevel, gearStats);

        const now = Date.now();
        // Apply Potion Buffs (Stacking) filter out expired potions
        activePotions.forEach(potion => {
            if (potion.expiresAt && potion.expiresAt < now) return; // Skip expired
            if (potion.effectType === 'Accuracy') stats.accuracy = Math.floor(stats.accuracy * potion.multiplier);
            if (potion.effectType === 'Strength') stats.maxHit = Math.floor(stats.maxHit * potion.multiplier);
            if (potion.effectType === 'Defence') stats.defence = Math.floor(stats.defence * potion.multiplier);
            if (potion.effectType === 'Stamina') stats.stamina = Math.floor(stats.stamina * potion.multiplier);
        });

        return stats;
    }, [combatLevel, gearStats, activePotions]);

    // Cleanup expired potions
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setActivePotions(prev => {
                const nextPotions = prev.filter(p => !p.expiresAt || p.expiresAt >= now);
                if (nextPotions.length === prev.length) return prev; // Avoid unnecessary re-renders
                return nextPotions;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Ensure current stamina doesn't exceed max
    useEffect(() => {
        if (currentStamina > playerStats.stamina) {
            setCurrentStamina(playerStats.stamina);
        }
    }, [playerStats.stamina]);

    // Auth & API specific
    const loginOrRegister = async (username, password, isLogin) => {
        const endpoint = isLogin ? '/auth/login/' : '/auth/register/';
        const res = await apiCall(endpoint, 'POST', { username, password });
        if (res.status === 200 || res.status === 201) {
            if (isLogin) {
                const token = res.data.token;
                await AsyncStorage.setItem('@auth_token', token);
                setAuthToken(token);
                await loadGame();
            } else {
                alert("Registered successfully. You can now log in.");
            }
        } else {
            alert(JSON.stringify(res.data));
        }
    };

    const createCharacter = async (name) => {
        const res = await apiCall('/character/state/', 'POST', { name });
        if (res.status === 201) {
            setCharacterName(name);
            await loadGame();
        } else {
            alert(JSON.stringify(res.data));
        }
    };

    const checkTokenOnLoad = async () => {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
            setAuthToken(token);
            await loadGame();
        }
    };

    const logout = async () => {
        await saveGame();
        try {
            await apiCall('/auth/logout/', 'POST');
        } catch (e) {
            console.error("Logout API failed", e);
        }
        await AsyncStorage.removeItem('@auth_token');
        setAuthToken(null);
        setCharacterName(null);
    };

    useEffect(() => { checkTokenOnLoad(); }, []);

    const saveGame = async () => {
        if (!authToken || !characterName) return false;
        const payload = {
            name: characterName, xp, bossesDefeated, inventory, equipped, coins, currentStamina,
            unlockedCreatures, townLevel, townXP, activeQuest, shopStock
        };
        const res = await apiCall('/character/state/', 'POST', payload);
        return res.status === 200 || res.status === 201;
    };

    // Auto-save debounced sync
    useEffect(() => {
        if (!authToken || !characterName) return;

        const timeoutId = setTimeout(() => {
            const payload = {
                name: characterName, xp, bossesDefeated, inventory, equipped, coins, currentStamina,
                unlockedCreatures, townLevel, townXP, activeQuest, shopStock
            };
            apiCall('/character/state/', 'POST', payload);
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [authToken, characterName, xp, bossesDefeated, inventory, equipped, coins, currentStamina, unlockedCreatures, townLevel, townXP, activeQuest, shopStock]);

    // Force save on level up
    useEffect(() => {
        if (!authToken || !characterName || level <= 1) return;
        saveGame();
    }, [level]);

    const loadGame = async () => {
        const res = await apiCall('/character/state/', 'GET');
        if (res.status === 200) {
            const data = res.data;
            setCharacterName(data.name);
            setXp(data.xp || 0);
            setBossesDefeated(data.bossesDefeated || 0);
            setInventory(data.inventory || []);
            setEquipped(data.equipped && Object.keys(data.equipped).length > 0 ? data.equipped : {
                Weapon: null, Armor: null, Helmet: null, Legs: null, Shield: null, Boots: null, Gloves: null, Amulet: null, 'Magic Artifact': null
            });
            setCoins(data.coins || 0);
            setCurrentStamina(data.currentStamina || 15);
            setUnlockedCreatures(data.unlockedCreatures || []);
            setTownLevel(data.townLevel || 1);
            setTownXP(data.townXP || 0);
            setActiveQuest(data.activeQuest || null);
            setShopStock((data.shopStock && data.shopStock.blacksmith) ? data.shopStock : { blacksmith: [], potion: [], lastRefreshBlacksmith: 0, lastRefreshPotion: 0 });
            return true;
        }
        return false;
    };

    // Actions
    const trainCombat = () => {
        const xpGain = BASE_XP_PER_CLICK + bossesDefeated;
        const oldLevel = getLevelFromXP(xp);

        setXp(prev => {
            const nextXp = prev + xpGain;
            const newLevel = getLevelFromXP(nextXp);

            if (newLevel > oldLevel) {
                const levelDiff = newLevel - oldLevel;
                setCurrentStamina(s => s + (10 * levelDiff));
            }
            return nextXp;
        });

        lootMonsterDrop('Combat Dummy');

        return xpGain;
    };

    const gainXp = (amount) => {
        const oldLevel = getLevelFromXP(xp);
        setXp(prev => {
            const nextXp = prev + amount;
            const newLevel = getLevelFromXP(nextXp);
            if (newLevel > oldLevel) {
                const levelDiff = newLevel - oldLevel;
                setCurrentStamina(s => s + (10 * levelDiff));
            }
            return nextXp;
        });
    };

    const lootMonsterDrop = async (monsterName) => {
        try {
            const dropRes = await apiCall(`/combat/drop/?monster=${encodeURIComponent(monsterName)}`, 'GET');
            if (dropRes.status === 200 && dropRes.data.drop) {
                const drop = dropRes.data.drop;
                const value = drop.name === 'Wood Splinter' ? 1 : Math.max(5, Math.floor(level * 2));
                setInventory(prev => {
                    const existing = prev.find(i => i.name === drop.name);
                    if (existing) {
                        return prev.map(i => i.name === drop.name ? { ...i, quantity: (i.quantity || 1) + drop.quantity } : i);
                    } else if (prev.length < 10) {
                        return [...prev, { id: Date.now().toString(), name: drop.name, type: 'Resource', value: value, quantity: drop.quantity }];
                    }
                    return prev;
                });
                return drop;
            }
        } catch (e) {
            console.error("Loot error", e);
        }
        return null;
    };

    const unlockCreature = (creatureId) => {
        setUnlockedCreatures(prev => {
            if (prev.includes(creatureId)) return prev;
            return [...prev, creatureId];
        });
    };

    const healPlayer = (amount) => {
        setCurrentStamina(prev => Math.min(playerStats.stamina, prev + amount));
    };

    const takeDamage = (amount) => {
        setCurrentStamina(prev => Math.max(0, prev - amount));
    };

    const refreshShops = (shopType = null, force = false) => {
        const now = Date.now();

        let didRefresh = false;

        setShopStock(prev => {
            let nextStock = { ...prev };

            if (!shopType || shopType === 'Blacksmith') {
                if (force || now - prev.lastRefreshBlacksmith >= 60000) {
                    nextStock.blacksmith = generateShopItems(townLevel, 'Blacksmith');
                    nextStock.lastRefreshBlacksmith = now;
                    didRefresh = true;
                }
            }

            if (!shopType || shopType === 'Potion') {
                if (force || now - prev.lastRefreshPotion >= 60000) {
                    nextStock.potion = generateShopItems(townLevel, 'Potion');
                    nextStock.lastRefreshPotion = now;
                    didRefresh = true;
                }
            }

            return nextStock;
        });

        return didRefresh;
    };

    const buyItem = (item) => {
        if (coins < item.buyPrice) return { success: false, message: 'Not enough coins' };
        if (inventory.length >= 10) return { success: false, message: 'Inventory full (Max 10)' };

        setCoins(prev => prev - item.buyPrice);
        setInventory(prev => [...prev, item]);

        // Remove from shop stock
        setShopStock(prev => ({
            ...prev,
            blacksmith: prev.blacksmith.filter(i => i.id !== item.id),
            potion: prev.potion.filter(i => i.id !== item.id)
        }));
        return { success: true };
    };

    const sellItemToShop = (item, quantity = 1) => {
        let value = item.value || 0;
        if (item.name.includes('Lucky')) {
            value = Math.floor(value * 1.5); // Extra for Lucky
        }
        setCoins(prev => prev + (value * quantity));
        if (item.type === 'Resource' && item.quantity > quantity) {
            setInventory(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - quantity } : i));
        } else {
            setInventory(prev => prev.filter(i => i.id !== item.id));
        }
    };

    const restAtInn = async () => {
        const cost = 10;
        if (coins < cost) {
            if (currentStamina <= playerStats.stamina * 0.05 || freeRestAvailable) {
                return 'free';
            }
            return false;
        }

        if (freeRestAvailable) {
            return 'free';
        }

        setCoins(prev => prev - cost);
        // Wait is handled by caller usually for UI feedback, but we can return true to signal start
        return true;
    };

    const completeInnRest = (resultType) => {
        if (resultType === 'free') {
            healPlayer(Math.floor(playerStats.stamina * 0.5));
            setFreeRestAvailable(false);
        } else {
            setCurrentStamina(playerStats.stamina);
            setFreeRestAvailable(false);
        }
    };

    const startQuest = () => {
        if (activeQuest && !activeQuest.isCompleted) return;
        const newQuest = generateQuest(townLevel);
        setActiveQuest(newQuest);
    };

    const updateQuestProgress = (creatureId) => {
        let justCompleted = false;
        if (!activeQuest || activeQuest.isCompleted) return false;
        if (activeQuest.targetId === creatureId) {
            const newProgress = activeQuest.progress + 1;
            if (newProgress >= activeQuest.count) {
                justCompleted = true;
            }
            setActiveQuest(prev => ({ 
                ...prev, 
                progress: Math.min(newProgress, prev.count), 
                isCompleted: newProgress >= prev.count 
            }));
        }
        return justCompleted;
    };

    const claimQuestReward = () => {
        if (!activeQuest || !activeQuest.isCompleted) return;

        setCoins(prev => prev + activeQuest.rewardCoins);
        setTownXP(prev => {
            const newXP = prev + activeQuest.rewardTownXP;
            // Check Town Level Up?
            // Simple check:
            const xpForNext = calculateTownXPForLevel(townLevel + 1);
            if (newXP >= xpForNext) {
                setTownLevel(l => l + 1);
                // Reduce XP or keep generic accumulation? Usually accumulation.
            }
            return newXP;
        });
        setActiveQuest(null);
    };

    const donateItem = (item, quantity = 1) => {
        let sellValue = item.value || 0;
        if (item.name.includes('Lucky')) {
            sellValue = Math.floor(sellValue * 1.5);
        }
        const xpValue = Math.ceil(sellValue * 1.1) * quantity;

        if (item.type === 'Resource' && item.quantity > quantity) {
            setInventory(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - quantity } : i));
        } else {
            setInventory(prev => prev.filter(i => i.id !== item.id));
        }
        setTownXP(prev => {
            const newXP = prev + xpValue;
            const xpForNext = calculateTownXPForLevel(townLevel + 1);
            if (newXP >= xpForNext) {
                setTownLevel(l => l + 1);
            }
            return newXP;
        });
    };

    // Modified Logic with Inventory Limits
    const runBossFight = (pendingDungeonReward = null) => {
        const fightLogic = challengeBoss(playerStats, pendingDungeonReward?.dungeonKey);
        const success = fightLogic(bossesDefeated);
        
        let bossDrops = [];

        if (success) {
            setBossesDefeated(prev => prev + 1);
            
            // 1. Get Boss Drop
            apiCall(`/combat/drop/?monster=Boss`, 'GET').then(async dropRes => {
                if (dropRes.status === 200 && dropRes.data.drop) {
                    let drop = dropRes.data.drop;

                    // If it hits the "boss_unique" drop, roll specifically for this boss
                    if (drop.name === 'boss_unique' && pendingDungeonReward?.dungeonKey) {
                        const bossName = DUNGEON_TYPES[pendingDungeonReward.dungeonKey].bossName;
                        const uniqueRes = await apiCall(`/combat/drop/?monster=${encodeURIComponent(bossName)}`, 'GET');
                        if (uniqueRes.status === 200 && uniqueRes.data.drop) {
                            drop = uniqueRes.data.drop;
                        }
                    }

                    if (drop.name !== 'nothing' && drop.name !== 'boss_unique') {
                        const item = { 
                            id: Date.now().toString() + '_boss', 
                            name: drop.name, 
                            type: 'Resource', 
                            value: 50, 
                            quantity: drop.quantity 
                        };
                        setInventory(prev => {
                            if (prev.length < 10) return [...prev, item];
                            return prev;
                        });
                        bossDrops.push(item);
                    }
                }
            });

            // 2. Additional Dungeon Reward (if provided)
            if (pendingDungeonReward) {
                const secondReward = generateDungeonReward(pendingDungeonReward.type, pendingDungeonReward.dungeonKey);
                setInventory(prev => {
                    if (prev.length < 10) return [...prev, secondReward];
                    return prev;
                });
                setCoins(prev => prev + (pendingDungeonReward.coins || 0));
            }
        }
        
        if (activePotions.length > 0) {
            setActivePotions([]);
        }
        return { success, drops: bossDrops };
    };

    const generateDungeonReward = (rewardType, dungeonKey) => {
        const config = DUNGEON_TYPES[dungeonKey].rewardConfig;
        if (rewardType === 'Potion') {
            return generatePotion(config.potionTier);
        } else {
            const tier = rollTier(config.gearTiers);
            return generateRandomGear(combatLevel, tier);
        }
    };

    const exploreDungeon = async (dungeonKey) => {
        const dungeon = DUNGEON_TYPES[dungeonKey];
        if (!dungeon) return { success: false, reason: 'invalid_dungeon' };

        // 1. Calculate Success Rate
        const totalSuccessRate = dungeon.baseSuccessRate + (level * dungeon.plFactor) + (townLevel * dungeon.tlFactor);
        
        // 2. Roll for Traps (Simulated for the final result)
        // p^2 = 1 - S -> p = sqrt(1-S)
        const sDecimal = Math.max(0, Math.min(100, totalSuccessRate)) / 100;
        const trapChancePerEncounter = Math.sqrt(1 - sDecimal) * 100;
        
        let trapsHit = 0;
        const results = [];

        // Encounter 1
        if (Math.random() * 100 < trapChancePerEncounter) {
            trapsHit++;
            const baseDamage = Math.floor(playerStats.stamina * 0.2) + 5;
            const damage = Math.floor(baseDamage * 0.5); // "half of the amount that the player currently takes"
            takeDamage(damage);
            results.push({ type: 'trap', count: 1, damage });
            if (currentStamina - damage <= 0) {
                return { success: false, reason: 'died', trapsHit: 1, results };
            }
        }

        // Encounter 2
        if (Math.random() * 100 < trapChancePerEncounter) {
            trapsHit++;
            const damage = Math.floor(playerStats.stamina * 0.2) + 5;
            takeDamage(damage);
            results.push({ type: 'trap', count: 2, damage });
            // Failure!
            return { success: false, reason: 'trap_fail', trapsHit: 2, results };
        }

        // 3. Generate Rewards (Pending)
        const config = dungeon.rewardConfig;
        const coinsFound = Math.floor(Math.random() * (config.coins[1] - config.coins[0] + 1)) + config.coins[0];
        
        // Loot Chance Scaling: base + PL*0.5 + TL*1.0
        const totalLootChance = config.lootChance + (level * 0.5) + (townLevel * 1.0);
        let rewardItem = null;
        if (Math.random() * 100 < totalLootChance) {
            const rewardType = rollFromWeights(config.lootWeights);
            rewardItem = generateDungeonReward(rewardType === 'potion' ? 'Potion' : 'Gear', dungeonKey);
        }

        return { 
            success: true, 
            coins: coinsFound, 
            reward: rewardItem, 
            trapsHit, 
            results,
            dungeonKey 
        };
    };

    const claimDungeonRewards = (reward) => {
        if (!reward) return;
        if (reward.coins) setCoins(prev => prev + reward.coins);
        if (reward.reward) {
            setInventory(prev => {
                if (prev.length < 10) return [...prev, reward.reward];
                return prev;
            });
        }
    };

    const equipGear = (item) => {
        if (item.type === 'Potion') return; // Cannot equip potions

        const slot = item.type;
        setEquipped(prev => {
            const newEquipped = { ...prev, [slot]: item };
            return newEquipped;
        });
        setInventory(prev => prev.filter(i => i.id !== item.id));
        if (equipped[item.type]) {
            setInventory(prev => [...prev, equipped[item.type]]);
        }
    };

    const unequipGear = (slot) => {
        const item = equipped[slot];
        if (item) {
            setEquipped(prev => ({ ...prev, [slot]: null }));
            setInventory(prev => [...prev, item]);
        }
    };

    const sellItem = (item) => {
        setCoins(prev => prev + (item.value || 0));
        if (item.type === 'Resource' && item.quantity > 1) {
            setInventory(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i));
        } else {
            setInventory(prev => prev.filter(i => i.id !== item.id));
        }
    };

    const consumePotion = (potion) => {
        if (potion.effectType === 'Health') {
            healPlayer(Math.floor(playerStats.stamina * potion.healPercent));
            setInventory(prev => prev.filter(i => i.id !== potion.id));
            return;
        }

        // Apply duration based on tier if consumed during general use
        let durationMinutes = 1;
        if (potion.name.includes('Good')) durationMinutes = 2;
        if (potion.name.includes('Rare')) durationMinutes = 3;
        if (potion.name.includes('Legendary')) durationMinutes = 4;

        const expiringPotion = { ...potion, expiresAt: Date.now() + (durationMinutes * 60 * 1000) };

        setActivePotions(prev => [...prev, expiringPotion]);
        setInventory(prev => prev.filter(i => i.id !== potion.id));
    };

    const payCoins = (amount) => {
        if (coins >= amount) {
            setCoins(prev => prev - amount);
            return true;
        }
        return false;
    };

    const nextLevelXP = calculateXPForLevel(level + 1);
    const currentLevelXP = calculateXPForLevel(level);
    const xpIntoLevel = xp - currentLevelXP;
    const xpRequiredForLevel = nextLevelXP - currentLevelXP;
    const levelProgress = xpRequiredForLevel > 0 ? (xpIntoLevel / xpRequiredForLevel) : 1;

    return (
        <GameContext.Provider value={{
            xp,
            level,
            combatLevel,
            bossesDefeated,
            inventory,
            equipped,
            playerStats,
            gearStats,
            coins,
            activePotions,
            trainCombat,
            runBossFight,
            exploreDungeon,
            claimDungeonRewards,
            equipGear,
            unequipGear,
            sellItem,
            consumePotion,
            payCoins,
            currentStamina,
            healPlayer,
            takeDamage,
            gainXp,
            lootMonsterDrop,
            unlockedCreatures,
            unlockCreature,
            xpToNextLevel: nextLevelXP - xp,
            levelProgress,
            currentLevelXP,
            nextLevelXP,
            saveGame,
            loadGame,
            authToken,
            characterName,
            loginOrRegister,
            createCharacter,
            logout,
            // Town Exports
            townLevel,
            townXP,
            activeQuest,
            shopStock,
            refreshShops,
            buyItem,
            sellItemToShop,
            restAtInn,
            completeInnRest,
            startQuest,
            updateQuestProgress,
            claimQuestReward,
            donateItem,
            calculateTownXPForLevel,
            freeRestAvailable,
            setFreeRestAvailable
        }}>
            {children}
        </GameContext.Provider>
    );
};
