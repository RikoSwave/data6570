
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ProgressBarAndroid, ActivityIndicator, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { DUNGEON_TYPES } from '../utils/gameLogic';

const ExploreDungeonScreen = () => {
    const { currentStamina, playerStats, exploreDungeon, inventory, gearStats, coins, payCoins, consumePotion } = useGame();
    const [isExploring, setIsExploring] = useState(false);
    const isExploringRef = useRef(isExploring);

    // Health Potion logic
    const healthPotions = useMemo(() => {
        return inventory.filter(p => p.type === 'Potion' && p.effectType === 'Health');
    }, [inventory]);
    const [timer, setTimer] = useState(0);
    const [log, setLog] = useState([]);
    const [maxTime, setMaxTime] = useState(15);
    const [selectedDungeonKey, setSelectedDungeonKey] = useState('GEAR');

    const selectedDungeon = DUNGEON_TYPES[selectedDungeonKey];

    useEffect(() => {
        isExploringRef.current = isExploring;
    }, [isExploring]);

    useEffect(() => {
        // Calculate modified explore time
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

    useEffect(() => {
        const handleExplorationEnd = async () => {
            // Finished
            const exploreResult = await exploreDungeon(selectedDungeonKey);
            if (exploreResult.success) {
                const foundItem = exploreResult.reward;
                const logEntry = foundItem.type === 'Potion'
                    ? `Found ${foundItem.name}!`
                    : `Found ${foundItem.name}! (Acc: ${foundItem.stats.accuracyPercent ? `+${foundItem.stats.accuracyPercent}%` : `+${foundItem.stats.accuracy || 0}`}, Str: ${foundItem.stats.maxHitPercent ? `+${foundItem.stats.maxHitPercent}%` : `+${foundItem.stats.maxHit || 0}`}, Def: +${foundItem.stats.defence || 0}, HP: +${foundItem.stats.stamina || 0})`;
                setLog(prev => [logEntry, ...prev].slice(0, 15));
                setIsExploring(false);
            } else if (exploreResult.reason === 'trap') {
                setLog(prev => [`Trapped! Took ${exploreResult.damage} damage.`, ...prev].slice(0, 15));
                if (exploreResult.died) {
                    if (exploreResult.coinsLost > 0) {
                        Alert.alert("Rescued!", `You collapsed in the dungeon! The village guard rescued you for ${exploreResult.coinsLost} coins.`);
                        setLog(prev => [`Rescued by village guard for ${exploreResult.coinsLost} coins!`, ...prev].slice(0, 15));
                    } else {
                        Alert.alert("Rescued!", "The village guard took pity on you and rescued you for free.");
                        setLog(prev => [`Rescued by village guard for free!`, ...prev].slice(0, 15));
                    }
                    setIsExploring(false);
                } else {
                    setIsExploring(false);
                }
            } else if (exploreResult.reason === 'inventory_full') {
                setLog(prev => ['Inventory full! Cannot carry more.', ...prev].slice(0, 15));
                Alert.alert("Inventory Full", "You cannot carry any more items.");
                setIsExploring(false);
            }
        };

        if (isExploring && timer === 0) {
            handleExplorationEnd();
        }
    }, [isExploring, timer, exploreDungeon, selectedDungeonKey]);

    const handleExplore = () => {
        if (currentStamina <= 0) {
            Alert.alert('Exhausted', 'You have no stamina left to explore. Rest or use a health potion first.');
            return;
        }

        if (selectedDungeon.cost > 0) {
            const success = payCoins(selectedDungeon.cost);
            if (!success) {
                Alert.alert('Not Enough Coins', `You need ${selectedDungeon.cost} coins to enter this dungeon.`);
                return;
            }
        }
        setTimer(maxTime);
        setIsExploring(true);
    };

    const renderDungeonSelector = () => (
        <View style={styles.selectorContainer}>
            <Text style={styles.selectorTitle}>SELECT DUNGEON:</Text>
            <View style={styles.dungeonButtons}>
                <TouchableOpacity
                    style={[styles.dungeonButton, selectedDungeonKey === 'GEAR' && styles.selectedDungeon]}
                    onPress={() => !isExploring && setSelectedDungeonKey('GEAR')}
                >
                    <Text style={styles.dungeonBtnText}>Gear (Free)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.dungeonButton, selectedDungeonKey === 'BASIC_POTION' && styles.selectedDungeon]}
                    onPress={() => !isExploring && setSelectedDungeonKey('BASIC_POTION')}
                >
                    <Text style={styles.dungeonBtnText}>Basic (10g)</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.dungeonButtons}>
                <TouchableOpacity
                    style={[styles.dungeonButton, selectedDungeonKey === 'GOOD_POTION' && styles.selectedDungeon]}
                    onPress={() => !isExploring && setSelectedDungeonKey('GOOD_POTION')}
                >
                    <Text style={styles.dungeonBtnText}>Good (50g)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.dungeonButton, selectedDungeonKey === 'RARE_POTION' && styles.selectedDungeon]}
                    onPress={() => !isExploring && setSelectedDungeonKey('RARE_POTION')}
                >
                    <Text style={styles.dungeonBtnText}>Rare (200g)</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>

                <Text style={styles.title}>DUNGEON</Text>
                <Text style={styles.subtitle}>Inventory: {inventory.length} items  |  Coins: {coins}</Text>
                {gearStats.speedBonus > 0 && (
                    <Text style={styles.bonusText}>Speed Bonus: -{gearStats.speedBonus}% Time</Text>
                )}
            </View>

            {renderDungeonSelector()}

            <View style={styles.mainContent}>

                {/* Health Potions Section */}
                {healthPotions.length > 0 && (
                    <View style={styles.potionContainer}>
                        <Text style={styles.sectionTitle}>Use Health Potion:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.potionScroll}>
                            {healthPotions.map(potion => (
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

                <Text style={styles.dungeonDescription}>{selectedDungeon.description}</Text>
                {isExploring ? (
                    <View style={styles.progressContainer}>
                        <Text style={styles.exploringText}>EXPLORING {selectedDungeon.name}...</Text>
                        <Text style={styles.timerText}>{timer}s</Text>
                        <ActivityIndicator size="large" color="#00ff00" />
                    </View>
                ) : (
                    <View style={styles.idleContainer}>
                        <Text style={styles.idleText}>Ready to explore ({maxTime}s).</Text>
                        {selectedDungeon.cost > 0 && <Text style={styles.costText}>Cost: {selectedDungeon.cost} Coins</Text>}
                    </View>
                )}

                <View style={styles.logContainer}>
                    <Text style={styles.logTitle}>Exploration Log:</Text>
                    <FlatList
                        data={log}
                        renderItem={({ item }) => <Text style={styles.logEntry}>{item}</Text>}
                        keyExtractor={(item, index) => index.toString()}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.exploreButton, isExploring && styles.disabledButton]}
                onPress={handleExplore}
                disabled={isExploring}
            >
                <Text style={styles.buttonText}>
                    {isExploring ? 'EXPLORING...' : `EXPLORE (${maxTime}s)`}
                </Text>
            </TouchableOpacity>
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
