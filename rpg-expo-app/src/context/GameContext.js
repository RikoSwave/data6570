

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    const [currentStamina, setCurrentStamina] = useState(10); // Current HP
    const [unlockedCreatures, setUnlockedCreatures] = useState([]); // Array of IDs
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
    const level = useMemo(() => getLevelFromXP(xp), [xp]);

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

        // Apply Potion Buffs (Stacking)
        activePotions.forEach(potion => {
            if (potion.effectType === 'Accuracy') stats.accuracy = Math.floor(stats.accuracy * potion.multiplier);
            if (potion.effectType === 'Strength') stats.maxHit = Math.floor(stats.maxHit * potion.multiplier);
            if (potion.effectType === 'Defence') stats.defence = Math.floor(stats.defence * potion.multiplier);
            if (potion.effectType === 'Stamina') stats.stamina = Math.floor(stats.stamina * potion.multiplier);
        });

        return stats;
    }, [combatLevel, gearStats, activePotions]);

    // Ensure current stamina doesn't exceed max
    useEffect(() => {
        if (currentStamina > playerStats.stamina) {
            setCurrentStamina(playerStats.stamina);
        }
    }, [playerStats.stamina]);

    // Persistence
    const saveGame = async () => {
        try {
            const gameState = {
                xp,
                bossesDefeated,
                inventory,
                equipped,
                coins,
                currentStamina,
                unlockedCreatures,
                townLevel,
                townXP,
                activeQuest,
                shopStock,
                timestamp: Date.now()
            };
            await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
            return true;
        } catch (e) {
            console.error('Failed to save game', e);
            return false;
        }
    };

    const loadGame = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(SAVE_KEY);
            if (jsonValue != null) {
                const gameState = JSON.parse(jsonValue);
                setXp(gameState.xp || 0);
                setBossesDefeated(gameState.bossesDefeated || 0);
                setInventory(gameState.inventory || []);
                setEquipped(gameState.equipped || {});
                setCoins(gameState.coins || 0);
                setCurrentStamina(gameState.currentStamina || 10);
                setUnlockedCreatures(gameState.unlockedCreatures || []);
                setTownLevel(gameState.townLevel || 1);
                setTownXP(gameState.townXP || 0);
                setActiveQuest(gameState.activeQuest || null);
                setShopStock(gameState.shopStock || { blacksmith: [], potion: [], lastRefreshBlacksmith: 0, lastRefreshPotion: 0 });
                // Clears potions on load (intended)
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to load game', e);
            return false;
        }
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
                // Defer HP gain to avoid dependency cycle or we just setState
                setCurrentStamina(s => s + (10 * levelDiff));
            }
            return nextXp;
        });

        // "Train Combat" (now Combat Dummy) should probably heal the player or just be safe?
        // Let's make it safe + heal slowly? Or just safe. 
        // User says "will be known as the 'Combat Dummy' training method, and should remain the same other than a name change."
        // So just XP.
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

    const sellItemToShop = (item) => {
        let value = item.value || 0;
        if (item.name.includes('Lucky')) {
            value = Math.floor(value * 1.5); // Extra for Lucky
        }
        setCoins(prev => prev + value);
        setInventory(prev => prev.filter(i => i.id !== item.id));
    };

    const restAtInn = async () => {
        const cost = 10;
        if (coins < cost) return false;

        setCoins(prev => prev - cost);
        // Wait is handled by caller usually for UI feedback, but we can return true to signal start
        return true;
    };

    const completeInnRest = () => {
        setCurrentStamina(playerStats.stamina);
    };

    const startQuest = () => {
        if (activeQuest && !activeQuest.isCompleted) return;
        const newQuest = generateQuest(townLevel);
        setActiveQuest(newQuest);
    };

    const updateQuestProgress = (creatureId) => {
        if (!activeQuest || activeQuest.isCompleted) return;
        if (activeQuest.targetId === creatureId) {
            setActiveQuest(prev => {
                const newProgress = prev.progress + 1;
                const isCompleted = newProgress >= prev.count;
                return { ...prev, progress: newProgress, isCompleted };
            });
        }
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

    const donateItem = (item) => {
        let sellValue = item.value || 0;
        if (item.name.includes('Lucky')) {
            sellValue = Math.floor(sellValue * 1.5);
        }
        const xpValue = Math.ceil(sellValue * 1.1);

        setInventory(prev => prev.filter(i => i.id !== item.id));
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
    const runBossFight = () => {
        const fightLogic = challengeBoss(playerStats);
        const success = fightLogic(bossesDefeated);
        if (success) {
            setBossesDefeated(prev => prev + 1);
        }
        // Consume potions
        if (activePotions.length > 0) {
            setActivePotions([]);
        }
        return success;
    };

    const exploreDungeon = (dungeonType = 'GEAR') => {
        // Handle Logic based on dungeonType
        if (dungeonType === 'GEAR') {
            const newItem = generateRandomGear(combatLevel);
            setInventory(prev => [...prev, newItem]);
            return newItem;
        } else {
            // Potion Dungeon
            // generatePotion is imported from utils
            const newPotion = generatePotion(dungeonType);
            setInventory(prev => [...prev, newPotion]);
            return newPotion;
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
        setInventory(prev => prev.filter(i => i.id !== item.id));
    };

    const consumePotion = (potion) => {
        setActivePotions(prev => [...prev, potion]);
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
            equipGear,
            unequipGear,
            sellItem,
            consumePotion,
            payCoins,
            currentStamina,
            healPlayer,
            takeDamage,
            gainXp,
            unlockedCreatures,
            unlockCreature,
            xpToNextLevel: nextLevelXP - xp,
            levelProgress,
            currentLevelXP,
            nextLevelXP,
            saveGame,
            loadGame,
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
            calculateTownXPForLevel
        }}>
            {children}
        </GameContext.Provider>
    );
};
