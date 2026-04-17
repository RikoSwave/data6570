import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { DUNGEON_TYPES, getBossStats } from '../utils/gameLogic';

const ExploreDungeonScreen = () => {
    const {
        currentStamina, playerStats, exploreDungeon, claimDungeonRewards,
        inventory, gearStats, coins, consumePotion, bossesDefeated, runBossFight,
        takeDamage
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
                takeDamage(trap.damage);
                if (currentStamina - trap.damage <= 0) {
                    setIsExploring(false);
                    Alert.alert("Defeated", "You collapsed from your wounds and were rescued by the guards.");
                    setPendingResult(null);
                }
            } else {
                setLog(prev => ["Path seems clear so far...", ...prev]);
            }
        }

        if (timer === t2) {
            const trap = pendingResult.results.find(r => r.count === 2);
            if (trap) {
                setLog(prev => [`Triggered a trap! Took ${trap.damage} damage.`, ...prev]);
                takeDamage(trap.damage);

                if (currentStamina - trap.damage <= 0) {
                    setIsExploring(false);
                    Alert.alert("Defeated", "You collapsed from your wounds and were rescued by the guards.");
                    setPendingResult(null);
                    return;
                }
                
                if (pendingResult.reason === 'trap_fail') {
                    setLog(prev => [`OH NO! A second trap! Exploration failed.`, ...prev]);
                    setIsExploring(false);
                    setTimer(0);
                    Alert.alert("Dungeon Failure", "You hit too many traps and had to retreat, losing all gathered loot.");
                    setPendingResult(null);
                }
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

        try {
            setLog([]);
            setPendingResult(null);
            setShowBossPrep(false);

            const result = await exploreDungeon(selectedDungeonKey);
            if (!result) throw new Error("No response from dungeon system");
            
            setPendingResult(result);

            setTimer(maxTime);
            setIsExploring(true);
        } catch (error) {
            console.error("Exploration failed:", error);
            Alert.alert("Error", "Something went wrong while trying to start the exploration.");
        }
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
        setLog([]);
        setLog(prev => ["The battle begins!", ...prev]);
        
        // Sequence of logs to show progress
        setTimeout(() => setLog(prev => [`Encountered ${bossName}!`, ...prev]), 500);
        setTimeout(() => setLog(prev => ["You trade blows with the guardian...", ...prev]), 1000);
        setTimeout(() => setLog(prev => ["The struggle is intense!", ...prev]), 2000);

        setTimeout(() => {
            const fightResult = runBossFight(pendingResult);
            setIsFightingBoss(false);
            if (fightResult.success) {
                claimDungeonRewards(pendingResult); // Claim original reward
                let msg = "BOSS DEFEATED! You earned extra rewards.";
                if (fightResult.drops && fightResult.drops.length > 0) {
                    msg += ` Found unique item: ${fightResult.drops[0].name}`;
                    setLog(prev => [`VICTORY! Found ${fightResult.drops[0].name}`, ...prev]);
                } else {
                    setLog(prev => ["VICTORY!", ...prev]);
                }
                Alert.alert("Victory", msg);
                setPendingResult(null);
                setShowBossPrep(false);
            } else {
                setLog(prev => ["DEFEATED! The boss was too strong.", ...prev]);
                Alert.alert("Defeat", "The boss defeated you! You lost all your dungeon loot.");
                setPendingResult(null);
                setShowBossPrep(false);
            }
        }, 3000);
    };

    const renderDungeonSelector = () => (
        <View style={styles.selectorContainer}>
            <Text style={styles.selectorTitle}>SELECT DUNGEON:</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dungeonScroll}
                contentContainerStyle={styles.dungeonScrollContent}
            >
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
    const bossName = pendingResult?.dungeonKey ? DUNGEON_TYPES[pendingResult.dungeonKey].bossName : "";

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>DUNGEON</Text>
                <Text style={styles.subtitle}>Inventory: {inventory.length}/10 items  |  Coins: {coins}</Text>
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
                                <ScrollView horizontal style={styles.potionList} contentContainerStyle={{ paddingVertical: 5 }}>
                                    {healthPotions.map(p => (
                                        <TouchableOpacity key={p.id} style={styles.potionButton} onPress={() => consumePotion(p)}>
                                            <Text style={styles.potionText}>{p.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {isFightingBoss ? (
                            <ActivityIndicator size="large" color="#ff0000" style={{ marginVertical: 20 }} />
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
                                <Text style={styles.buttonText}>CHALLENGE BOSS</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.idlePanel}>
                        <Text style={styles.dungeonDescription}>{selectedDungeon.description}</Text>
                        {isExploring ? (
                            <View style={styles.progressContainer}>
                                <Text style={styles.exploringText}>EXPLORING {selectedDungeon.name.toUpperCase()}...</Text>
                                <Text style={styles.timerText}>{timer}s</Text>
                                <ActivityIndicator size="large" color="#00ff00" />
                            </View>
                        ) : (
                            <View style={styles.idleContainer}>
                                <Text style={styles.idleText}>Time to explore: {maxTime}s</Text>
                                <TouchableOpacity
                                    style={styles.exploreButton}
                                    onPress={handleExplore}
                                    disabled={isExploring}
                                >
                                    <Text style={styles.buttonText}>START EXPLORATION</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.logWrapper}>
                    <Text style={styles.logTitle}>Exploration Log:</Text>
                    <FlatList
                        data={log}
                        renderItem={({ item }) => <Text style={styles.logEntry}>• {item}</Text>}
                        keyExtractor={(item, index) => index.toString()}
                        style={styles.logList}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#001a00',
        padding: 15,
    },
    header: {
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#00ff00',
        textTransform: 'uppercase',
    },
    subtitle: {
        color: '#8f8',
        fontSize: 14,
    },
    bonusText: {
        color: '#00ffff',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 8,
        backgroundColor: '#113311',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#225522',
    },
    statLine: {
        color: '#dfd',
        fontSize: 12,
        fontWeight: 'bold',
    },
    selectorContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    selectorTitle: {
        color: '#888',
        fontSize: 11,
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    dungeonScroll: {
        height: 45,
    },
    dungeonScrollContent: {
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    dungeonButton: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginHorizontal: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        minWidth: 120,
        alignItems: 'center',
    },
    selectedDungeon: {
        backgroundColor: '#004400',
        borderColor: '#00ff00',
    },
    dungeonBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
    },
    idlePanel: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#002200',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#004400',
        marginBottom: 20,
    },
    dungeonDescription: {
        color: '#ccffcc',
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    idleContainer: {
        alignItems: 'center',
        width: '100%',
    },
    idleText: {
        color: '#888',
        fontSize: 16,
        marginBottom: 15,
    },
    exploreButton: {
        backgroundColor: '#006400',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#00ff00',
        width: '80%',
        shadowColor: "#00ff00",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    progressContainer: {
        alignItems: 'center',
    },
    exploringText: {
        fontSize: 16,
        color: '#00ff00',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    timerText: {
        fontSize: 50,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    logWrapper: {
        flex: 0.6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#113311',
    },
    logTitle: {
        color: '#00ff00',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    logEntry: {
        color: '#afa',
        marginBottom: 4,
        fontSize: 13,
    },
    resultContainer: {
        alignItems: 'center',
        backgroundColor: '#003300',
        padding: 20,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#00ff00',
        marginBottom: 20,
    },
    resultTitle: {
        color: '#00ff00',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    lootText: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 5,
    },
    choiceButtons: {
        marginTop: 20,
        width: '100%',
    },
    leaveButton: {
        backgroundColor: '#444',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    bossButton: {
        backgroundColor: '#880000',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ff0000',
    },
    bossPrepContainer: {
        alignItems: 'center',
        backgroundColor: '#1a0000',
        padding: 20,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#ff0000',
        marginBottom: 20,
    },
    bossTitle: {
        color: '#ff0000',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    bossStatsText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 10,
    },
    warningText: {
        color: '#ffa500',
        fontSize: 12,
        textAlign: 'center',
        marginVertical: 10,
        fontWeight: 'bold',
    },
    bossActions: {
        width: '100%',
        marginTop: 10,
    },
    fightButton: {
        backgroundColor: '#880000',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    cancelButton: {
        backgroundColor: '#444',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    potionSection: {
        width: '100%',
        marginVertical: 15,
    },
    sectionTitle: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 5,
    },
    potionList: {
        flexDirection: 'row',
    },
    potionButton: {
        backgroundColor: '#c0392b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 5,
        marginRight: 8,
    },
    potionText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
});

export default ExploreDungeonScreen;
