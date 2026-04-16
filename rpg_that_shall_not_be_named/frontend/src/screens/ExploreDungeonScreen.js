import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { DUNGEON_TYPES, getBossStats } from '../utils/gameLogic';

const ExploreDungeonScreen = () => {
    const {
        currentStamina, playerStats, exploreDungeon, claimDungeonRewards,
        inventory, gearStats, coins, payCoins, consumePotion, bossesDefeated, runBossFight
    } = useGame();

    const [isExploring, setIsExploring] = useState(false);
    const [timer, setTimer] = useState(0);
    const [log, setLog] = useState([]);
    const [maxTime, setMaxTime] = useState(15);
    const [selectedDungeonKey, setSelectedDungeonKey] = useState('GOBLINS_HIDEOUT');

    // Result States
    const [pendingResult, setPendingResult] = useState(null);
    const [showBossPrep, setShowBossPrep] = useState(false);
    const [isFightingBoss, setIsFightingBoss] = useState(false);

    const selectedDungeon = DUNGEON_TYPES[selectedDungeonKey];

    const healthPotions = useMemo(() => {
        return inventory.filter(p => p.type === 'Potion' && p.effectType === 'Health');
    }, [inventory]);

    useEffect(() => {
        if (!selectedDungeon) return;
        const baseTime = selectedDungeon.time;
        const reduction = (gearStats.speedBonus || 0) / 100;
        const newTime = Math.max(2, Math.floor(baseTime * (1 - reduction)));
        setMaxTime(newTime);
    }, [gearStats.speedBonus, selectedDungeonKey]);

    useEffect(() => {
        let interval;
        if (isExploring && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isExploring, timer]);

    // Handle Exploration Trap Ticks
    useEffect(() => {
        if (!isExploring || !pendingResult) return;

        // Trigger Log Messages at intervals
        const t1 = Math.floor(maxTime * 0.66);
        const t2 = Math.floor(maxTime * 0.33);

        if (timer === t1) {
            const trap = pendingResult.results.find(r => r.count === 1);
            if (trap) {
                setLog(prev => [`Triggered a trap! Took ${trap.damage} damage.`, ...prev]);
            } else {
                setLog(prev => ["Path seems clear so far...", ...prev]);
            }
        }

        if (timer === t2) {
            const trap = pendingResult.results.find(r => r.count === 2);
            if (trap) {
                setLog(prev => [`OH NO! A second trap! Exploration failed.`, ...prev]);
                setIsExploring(false);
                setTimer(0);
                Alert.alert("Dungeon Failure", "You hit too many traps and had to retreat, losing all gathered loot.");
                setPendingResult(null);
            } else {
                setLog(prev => ["Almost at the end...", ...prev]);
            }
        }
    }, [timer, isExploring, pendingResult]);

    useEffect(() => {
        const handleExplorationEnd = () => {
            if (pendingResult && pendingResult.success) {
                setLog(prev => ["Reached the end of the dungeon!", ...prev]);
                setIsExploring(false);
            }
        };

        if (isExploring && timer === 0) {
            handleExplorationEnd();
        }
    }, [isExploring, timer]);

    const handleExplore = async () => {
        if (currentStamina <= 0) {
            Alert.alert('Exhausted', 'You have no stamina left. Rest at the Inn or use a health potion first.');
            return;
        }

        setLog([]);
        setPendingResult(null);
        setShowBossPrep(false);

        const result = await exploreDungeon(selectedDungeonKey);
        setPendingResult(result);

        if (result.reason === 'died') {
            setLog(["Died to a trap! Returning to town..."]);
            Alert.alert("Defeated", "You collapsed in the dungeon and were rescued by the guards.");
            return;
        }

        setTimer(maxTime);
        setIsExploring(true);
    };

    const handleCollectAndLeave = () => {
        claimDungeonRewards(pendingResult);
        setPendingResult(null);
        setLog(prev => ["Returned to town with loot.", ...prev]);
    };

    const handleBossFight = () => {
        setShowBossPrep(true);
    };

    const startBossFight = () => {
        setIsFightingBoss(true);
        setTimeout(() => {
            const fightResult = runBossFight(pendingResult);
            setIsFightingBoss(false);
            if (fightResult.success) {
                claimDungeonRewards(pendingResult); // Claim original reward
                let msg = "BOSS DEFEATED! You earned extra rewards.";
                if (fightResult.drops.length > 0) {
                    msg += ` Found unique item: ${fightResult.drops[0].name}`;
                }
                Alert.alert("Victory", msg);
                setPendingResult(null);
                setShowBossPrep(false);
            } else {
                Alert.alert("Defeat", "The boss defeated you! You lost all your dungeon loot.");
                setPendingResult(null);
                setShowBossPrep(false);
            }
        }, 1500);
    };

    const renderDungeonSelector = () => (
        <View style={styles.selectorContainer}>
            <Text style={styles.selectorTitle}>SELECT DUNGEON:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dungeonScroll}>
                {Object.keys(DUNGEON_TYPES).filter(k => DUNGEON_TYPES[k].name).map(key => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.dungeonButton, selectedDungeonKey === key && styles.selectedDungeon]}
                        onPress={() => !isExploring && !pendingResult && setSelectedDungeonKey(key)}
                    >
                        <Text style={styles.dungeonBtnText}>{DUNGEON_TYPES[key].name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const bossStats = getBossStats(bossesDefeated, pendingResult?.dungeonKey);
    const bossName = pendingResult?.dungeonKey ? DUNGEON_TYPES[pendingResult.dungeonKey].bossName : "ANCIENT GUARDIAN";

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>DUNGEON</Text>
                <Text style={styles.subtitle}>Inventory: {inventory.length} items  |  Coins: {coins}</Text>
                {gearStats.speedBonus > 0 && (
                    <Text style={styles.bonusText}>Speed Bonus: -{gearStats.speedBonus}% Time</Text>
                )}
                <View style={styles.statsRow}>
                    <Text style={styles.statLine}>Strength: {playerStats.maxHit} | </Text>
                    <Text style={styles.statLine}>Accuracy: {playerStats.accuracy} | </Text>
                    <Text style={styles.statLine}>Defense: {playerStats.defence} | </Text>
                    <Text style={styles.statLine}>HP: {currentStamina}/{playerStats.stamina}</Text>
                </View>
            </View>

            {renderDungeonSelector()}

            <View style={styles.mainContent}>
                {showBossPrep ? (
                    <View style={styles.bossPrepContainer}>
                        <Text style={styles.bossTitle}>BOSS: {bossName.toUpperCase()}</Text>
                        <Text style={styles.bossStatsText}>HP: {bossStats.hp} | Max Hit: {bossStats.maxHit}</Text>
                        <Text style={styles.warningText}>WARNING: Losing will forfeit ALL current dungeon rewards!</Text>

                        {healthPotions.length > 0 && (
                            <View style={styles.potionSection}>
                                <Text style={styles.sectionTitle}>Use Potion before fight:</Text>
                                <ScrollView horizontal style={styles.potionList}>
                                    {healthPotions.map(p => (
                                        <TouchableOpacity key={p.id} style={styles.potionButton} onPress={() => consumePotion(p)}>
                                            <Text style={styles.potionText}>{p.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {isFightingBoss ? (
                            <ActivityIndicator size="large" color="#ff0000" />
                        ) : (
                            <View style={styles.bossActions}>
                                <TouchableOpacity style={styles.fightButton} onPress={startBossFight}>
                                    <Text style={styles.buttonText}>START FIGHT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowBossPrep(false)}>
                                    <Text style={styles.buttonText}>GO BACK</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ) : pendingResult && !isExploring && pendingResult.success ? (
                    <View style={styles.resultContainer}>
                        <Text style={styles.resultTitle}>EXPLORATION SUCCESSFUL!</Text>
                        <Text style={styles.lootText}>Found: {pendingResult.coins} Coins</Text>
                        {pendingResult.reward && <Text style={styles.lootText}>Item: {pendingResult.reward.name}</Text>}

                        <View style={styles.choiceButtons}>
                            <TouchableOpacity style={styles.leaveButton} onPress={handleCollectAndLeave}>
                                <Text style={styles.buttonText}>LEAVE WITH LOOT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.bossButton} onPress={handleBossFight}>
                                <Text style={styles.buttonText}>CHALLENGE BOSS (RISK LOOT)</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        <Text style={styles.dungeonDescription}>{selectedDungeon.description}</Text>
                        {isExploring ? (
                            <View style={styles.progressContainer}>
                                <Text style={styles.exploringText}>EXPLORING {selectedDungeon.name.toUpperCase()}...</Text>
                                <Text style={styles.timerText}>{timer}s</Text>
                                <ActivityIndicator size="large" color="#00ff00" />
                            </View>
                        ) : (
                            <View style={styles.idleContainer}>
                                <Text style={styles.idleText}>Ready to explore ({maxTime}s).</Text>
                                <TouchableOpacity
                                    style={styles.exploreButton}
                                    onPress={handleExplore}
                                    disabled={isExploring}
                                >
                                    <Text style={styles.buttonText}>START EXPLORATION</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}

                <View style={styles.logContainer}>
                    <Text style={styles.logTitle}>Exploration Log:</Text>
                    <FlatList
                        data={log}
                        renderItem={({ item }) => <Text style={styles.logEntry}>• {item}</Text>}
                        keyExtractor={(item, index) => index.toString()}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#001a00', // Dark Green
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 10,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 5,
        backgroundColor: '#113311',
        padding: 5,
        borderRadius: 5,
    },
    statLine: {
        color: '#dfd',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // ... existing styles ...
    selectorContainer: {
        marginBottom: 10,
    },
    selectorTitle: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 5,
        textAlign: 'center',
    },
    dungeonButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    dungeonButton: {
        backgroundColor: '#222',
        padding: 10,
        borderRadius: 5,
        width: '48%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    selectedDungeon: {
        backgroundColor: '#004400',
        borderColor: '#00ff00',
    },
    dungeonBtnText: {
        color: '#fff',
        fontSize: 12,
    },
    // ...
    saveLoadContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    smallButton: {
        backgroundColor: '#444',
        padding: 8,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#666',
    },
    smallButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#00ff00',
        textTransform: 'uppercase',
    },
    subtitle: {
        color: '#8f8',
        fontSize: 16,
    },
    bonusText: {
        color: '#00ffff',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 5,
    },
    costText: {
        color: '#FFD700',
        fontSize: 16,
        marginTop: 5,
        fontWeight: 'bold',
    },
    mainContent: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    dungeonDescription: {
        color: '#dfd',
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 10,
        paddingHorizontal: 20,
    },
    progressContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    exploringText: {
        fontSize: 18,
        color: '#cfc',
        marginBottom: 10,
        textAlign: 'center',
    },
    timerText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
    },
    idleContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    idleText: {
        color: '#666',
        fontSize: 18,
    },
    logContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        padding: 10,
    },
    logTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    logEntry: {
        color: '#afa',
        marginBottom: 5,
        fontSize: 14,
    },
    exploreButton: {
        backgroundColor: '#006400',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#00ff00',
        elevation: 5,
    },
    disabledButton: {
        backgroundColor: '#224422',
        borderColor: '#446644',
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    potionContainer: {
        marginBottom: 15,
        backgroundColor: '#2c3e50',
        padding: 10,
        borderRadius: 5,
    },
    potionScroll: {
        flexDirection: 'row',
    },
    potionButton: {
        backgroundColor: '#e74c3c',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 3,
        marginRight: 10,
    },
    potionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default ExploreDungeonScreen;
