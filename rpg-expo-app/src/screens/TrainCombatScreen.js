import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';

import { CREATURES } from '../utils/gameLogic';

const TrainCombatScreen = () => {
    const { xp, level, trainCombat, xpToNextLevel, levelProgress, playerStats, currentStamina, healPlayer, takeDamage, gainXp, lootMonsterDrop, unlockCreature, unlockedCreatures, updateQuestProgress, inventory, consumePotion, activePotions } = useGame();
    const [lastGain, setLastGain] = useState(0);

    const availablePotions = useMemo(() => {
        return inventory.filter(p => p.type === 'Potion');
    }, [inventory]);

    // Stat tracking for level up differences
    const [levelUpDiff, setLevelUpDiff] = useState(null);
    const prevStatsRef = useRef(playerStats);
    const prevLevelRef = useRef(level);

    useEffect(() => {
        if (level > prevLevelRef.current) {
            // Player leveled up, calculate diffs
            const diff = {
                accuracy: playerStats.accuracy - prevStatsRef.current.accuracy,
                maxHit: playerStats.maxHit - prevStatsRef.current.maxHit,
                defence: playerStats.defence - prevStatsRef.current.defence,
                stamina: playerStats.stamina - prevStatsRef.current.stamina,
            };
            setLevelUpDiff(diff);

            // Clear diff after 3 seconds
            const timer = setTimeout(() => {
                setLevelUpDiff(null);
            }, 3000);

            prevLevelRef.current = level;
            prevStatsRef.current = playerStats;

            return () => clearTimeout(timer);
        } else {
            // Just update refs if stats changed without level up (e.g. gear change or potions)
            prevStatsRef.current = playerStats;
        }
    }, [level, playerStats]);

    const renderStatValue = (label, currentVal, diffKey) => {
        const diffVal = levelUpDiff ? levelUpDiff[diffKey] : 0;
        return (
            <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>{label}</Text>
                {diffVal > 0 ? (
                    <Text style={styles.statBoxValue}>
                        {currentVal - diffVal} <Text style={styles.diffText}>+{diffVal}</Text>
                    </Text>
                ) : (
                    <Text style={styles.statBoxValue}>{currentVal}</Text>
                )}
            </View>
        );
    };

    // Active Combat State
    const [selectedCreature, setSelectedCreature] = useState(null);
    const [combatActive, setCombatActive] = useState(false);
    const [combatFinished, setCombatFinished] = useState(false); // New state
    const [enemyHP, setEnemyHP] = useState(0);
    const [combatLog, setCombatLog] = useState([]);

    const combatInterval = useRef(null);
    const enemyHPRef = useRef(0); // Ref to track HP inside interval

    const handleDummyTrain = () => {
        if (combatActive) return; // Cannot train dummy while fighting
        const gain = trainCombat();
        setLastGain(gain);
        // healPlayer(1); // Dummy combat heals slowly? Or maybe just safe. Let's add slight healing for "resting"
    };

    const selectCreature = (creature) => {
        if (combatActive) return;
        setSelectedCreature(creature);
        setEnemyHP(creature.stamina);
        setCombatLog([`Selected ${creature.name}`]);
        setCombatFinished(false);
    };

    const startCombat = () => {
        if (!selectedCreature) return;
        if (currentStamina <= 0) {
            Alert.alert("Too weak!", "You need stamina to fight.");
            return;
        }
        setCombatActive(true);
        setCombatFinished(false);
        setEnemyHP(selectedCreature.stamina);
        enemyHPRef.current = selectedCreature.stamina; // Sync Ref
        setCombatLog(prev => [`Started fighting ${selectedCreature.name}!`, ...prev].slice(0, 15)); // Increased log size
    };

    const stopCombat = () => {
        setCombatActive(false);
        if (combatInterval.current) {
            clearInterval(combatInterval.current);
            combatInterval.current = null;
        }
    };

    const resetSelection = () => {
        setSelectedCreature(null);
        setCombatFinished(false);
        setCombatActive(false);
    };

    useEffect(() => {
        if (combatActive && selectedCreature) {
            combatInterval.current = setInterval(() => {
                // Combat Tick

                // 1. Player attacks Enemy
                // Calculate Hit Chance
                // Simple Formula: Accuracy / (Accuracy + EnemyDef)
                // If EnemyDef is 0, Chance is 1.
                let hitChance = 1;
                if (selectedCreature.defence > 0) {
                    hitChance = playerStats.accuracy / (playerStats.accuracy + selectedCreature.defence);
                }

                // Roll for hit
                let damageDealt = 0;
                if (Math.random() < hitChance) {
                    damageDealt = Math.max(1, Math.floor(playerStats.maxHit)); // Simple Max Hit? Or variance?
                    // Let's add slight variance?
                    damageDealt = Math.floor(Math.random() * (playerStats.maxHit + 1));

                    // Update Ref and State
                    enemyHPRef.current -= damageDealt;
                    setEnemyHP(enemyHPRef.current);

                    setCombatLog(prev => [`You hit ${selectedCreature.name} for ${damageDealt}`, ...prev].slice(0, 15));
                } else {
                    // Player Missed
                    setCombatLog(prev => [`You missed ${selectedCreature.name}!`, ...prev].slice(0, 15));
                }

                // 2. Enemy attacks Player (only if alive)
                if (enemyHPRef.current > 0) {
                    // Evasion Logic:
                    // Base enemy accuracy. Let's say it scales with creature difficulty or is flat.
                    // Chicken acc ~ 5, Cow ~ 10, Goblin ~ 20? 
                    // Let's use maxHit * 2 as approximation for accuracy.
                    const enemyAcc = selectedCreature.maxHit * 3 + 5;
                    const enemyHitChance = enemyAcc / (enemyAcc + playerStats.defence);

                    if (Math.random() < enemyHitChance) {
                        // Hit
                        let enemyDmg = Math.max(1, selectedCreature.maxHit - Math.floor(playerStats.defence / 10));
                        takeDamage(enemyDmg);
                        setCombatLog(prev => [`${selectedCreature.name} hit you for ${enemyDmg}`, ...prev].slice(0, 15));
                    } else {
                        // Miss
                        setCombatLog(prev => [`${selectedCreature.name} missed you!`, ...prev].slice(0, 15));
                    }
                }

            }, 1000); // 1 Second ticks
        }

        return () => {
            if (combatInterval.current) clearInterval(combatInterval.current);
        };
    }, [combatActive, selectedCreature, playerStats /* stats might change due to potion, so include it */]);

    // Check Combat Conditions
    useEffect(() => {
        if (!combatActive) return;

        if (currentStamina <= 0) {
            stopCombat();
            setCombatFinished(true);
            setCombatLog(prev => [`DEFEAT! You ran out of stamina.`, ...prev].slice(0, 15));
            Alert.alert("Defeated", "You have run out of stamina!");
        }

        if (enemyHP <= 0 && combatActive) {
            // Check combatActive to avoid double firing if cleanup runs?
            // Actually enemyHP logic handles it.

            // Enemy Defeated
            // XP Gain
            const xpGainAmount = selectedCreature.xp;
            gainXp(xpGainAmount);
            unlockCreature(selectedCreature.id);
            const questCompleted = updateQuestProgress(selectedCreature.id);
            if (questCompleted) {
                Alert.alert("Quest Completed!", "You have fulfilled your quest. Visit the Town Square to claim your reward.");
            }

            stopCombat();
            setCombatFinished(true);
            setCombatLog(prev => [`VICTORY! +${xpGainAmount} XP`, `Defeated ${selectedCreature.name}!`, ...prev].slice(0, 15));
            
            lootMonsterDrop(selectedCreature.name).then(drop => {
                if (drop) {
                    setCombatLog(prev => [`Received ${drop.quantity}x ${drop.name}`, ...prev].slice(0, 15));
                }
            });
            // Removed Alert to make it smoother as requested "keep combat log open... buttons"
        }
    }, [enemyHP, currentStamina, combatActive, selectedCreature, gainXp, unlockCreature]); // unlockCreature dep




    return (
        <SafeAreaView style={styles.container}>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Add potions section */}
            {availablePotions.length > 0 && (
                <View style={styles.potionContainer}>
                    <Text style={styles.sectionTitle}>Use Potion:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.potionScroll}>
                        {availablePotions.map(potion => (
                            <TouchableOpacity 
                                key={potion.id} 
                                style={styles.potionButton}
                                onPress={() => consumePotion(potion)}
                            >
                                <Text style={styles.potionText}>{potion.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <View style={styles.creatureListContainer}>
                    <Text style={styles.levelText}>Level: {level}</Text>

                    {/* Core Stats Overview */}
                    <View style={styles.coreStatsRow}>
                        {renderStatValue("Strength", playerStats.maxHit, "maxHit")}
                        {renderStatValue("Accuracy", playerStats.accuracy, "accuracy")}
                        {renderStatValue("Defence", playerStats.defence, "defence")}
                        {renderStatValue("Max HP", playerStats.stamina, "stamina")}
                    </View>

                    {/* Stamina Bar */}
                    <Text style={styles.statLabel}>Stamina (HP)</Text>
                    <View style={styles.barBackground}>
                        <View style={[styles.barFill, { width: `${Math.min(100, (currentStamina / playerStats.stamina) * 100)}%`, backgroundColor: '#e74c3c' }]} />
                        <Text style={styles.barText}>{currentStamina} / {playerStats.stamina}</Text>
                    </View>
                    {(currentStamina <= playerStats.stamina * 0.10) && (
                        <Text style={styles.lowHealthWarning}>⚠️ Dangerously low health! Go to the Town's Inn and rest to heal.</Text>
                    )}

                    {/* XP Bar */}
                    <Text style={styles.statLabel}>Experience</Text>
                    <View style={styles.barBackground}>
                        <View style={[styles.barFill, { width: `${Math.min(100, levelProgress * 100)}%`, backgroundColor: '#2ecc71' }]} />
                        <Text style={styles.barText}>{xpToNextLevel} XP to next</Text>
                    </View>
                </View>

                {selectedCreature ? (
                    <View style={styles.arenaContainer}>
                        <Text style={styles.arenaTitle}>VS {selectedCreature.name}</Text>
                        <View style={styles.barBackground}>
                            <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, (enemyHP / selectedCreature.stamina) * 100))}%`, backgroundColor: '#e67e22' }]} />
                            <Text style={styles.barText}>{Math.max(0, enemyHP)} / {selectedCreature.stamina}</Text>
                        </View>
                        <ScrollView
                            style={styles.combatLog}
                            nestedScrollEnabled={true}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        >
                            {combatLog.map((log, index) => (
                                <Text key={index} style={styles.logText}>{log}</Text>
                            ))}
                        </ScrollView>

                        {combatActive ? (
                            <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopCombat}>
                                <Text style={styles.buttonText}>FLEE</Text>
                            </TouchableOpacity>
                        ) : combatFinished ? (
                            <View style={styles.postCombatControls}>
                                <TouchableOpacity style={[styles.button, styles.fightButton]} onPress={startCombat}>
                                    <Text style={styles.buttonText}>FIGHT AGAIN!</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.changeButton]} onPress={resetSelection}>
                                    <Text style={styles.buttonText}>CHANGE MONSTER</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.postCombatControls}>
                                <TouchableOpacity style={[styles.button, styles.fightButton]} onPress={startCombat}>
                                    <Text style={styles.buttonText}>START FIGHT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.changeButton]} onPress={resetSelection}>
                                    <Text style={styles.buttonText}>CHANGE MONSTER</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.selectionContainer}>
                        <Text style={styles.sectionHeader}>Select Target</Text>
                        <View style={styles.creatureList}>
                            {CREATURES.map(creature => {
                                const isUnlocked = unlockedCreatures.includes(creature.id);
                                return (
                                    <TouchableOpacity
                                        key={creature.id}
                                        style={[styles.creatureButton, selectedCreature?.id === creature.id && styles.selectedCreature]}
                                        onPress={() => selectCreature(creature)}
                                    >
                                        <Text style={styles.creatureName}>{creature.name}</Text>
                                        <Text style={styles.creatureStats}>
                                            {isUnlocked
                                                ? `HP: ${creature.stamina} | XP: ${creature.xp}`
                                                : `HP: ??? | XP: ???`
                                            }
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                <View style={styles.divider} />

                <View style={styles.dummyContainer}>
                    <Text style={styles.sectionHeader}>Safety Training</Text>
                    <TouchableOpacity style={[styles.button, styles.dummyButton]} onPress={handleDummyTrain} disabled={combatActive}>
                        <Text style={styles.buttonText}>HIT COMBAT DUMMY</Text>
                    </TouchableOpacity>
                    {lastGain > 0 && <Text style={styles.gainText}>+{lastGain} XP</Text>}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    scrollContent: {
        padding: 20,
    },
    statsContainer: {
        marginBottom: 20,
    },
    levelText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: 10,
    },
    coreStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: '#2c3e50',
        padding: 10,
        borderRadius: 8,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statBoxLabel: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 4,
    },
    statBoxValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    diffText: {
        color: '#2ecc71',
    },
    statLabel: {
        color: '#ccc',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    barBackground: {
        width: '100%',
        height: 20,
        backgroundColor: '#333',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 10,
        justifyContent: 'center',
    },
    barFill: {
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    barText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        zIndex: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 2,
    },
    sectionHeader: {
        color: '#888',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    selectionContainer: {
        marginBottom: 20,
    },
    creatureList: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    creatureButton: {
        width: '30%',
        backgroundColor: '#444',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCreature: {
        borderColor: '#e74c3c',
        backgroundColor: '#555',
    },
    creatureName: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 5,
        fontSize: 12,
    },
    creatureStats: {
        color: '#aaa',
        fontSize: 10,
    },
    button: {
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        elevation: 3,
    },
    fightButton: {
        backgroundColor: '#c0392b',
        borderWidth: 2,
        borderColor: '#e74c3c',
    },
    stopButton: {
        backgroundColor: '#7f8c8d',
        marginTop: 10,
    },
    changeButton: {
        backgroundColor: '#8e44ad',
        marginTop: 10,
    },
    postCombatControls: {
        width: '100%',
        marginTop: 10,
    },
    dummyButton: {
        backgroundColor: '#2980b9',
        borderWidth: 2,
        borderColor: '#3498db',
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    arenaContainer: {
        backgroundColor: '#2c3e50',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    arenaTitle: {
        color: '#e74c3c',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    combatLog: {
        maxHeight: 150,
        backgroundColor: '#000',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    logText: {
        color: '#ccc',
        fontSize: 12,
    },
    divider: {
        height: 2,
        backgroundColor: '#333',
        marginVertical: 20,
    },
    gainText: {
        color: '#00ff00',
        textAlign: 'center',
        marginTop: 5,
        fontWeight: 'bold',
    },
    lowHealthWarning: {
        color: '#ff4d4d',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
});

export default TrainCombatScreen;
