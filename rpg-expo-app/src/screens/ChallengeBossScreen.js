
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { getBossStats } from '../utils/gameLogic';


const ChallengeBossScreen = () => {
    const { bossesDefeated, runBossFight, playerStats, activePotions, inventory, consumePotion } = useGame();
    const [isFighting, setIsFighting] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [result, setResult] = useState(null); // 'VICTORY' | 'DEFEAT'
    const [message, setMessage] = useState('');
    const [showPotions, setShowPotions] = useState(false);
    const bossStats = getBossStats(bossesDefeated);

    useEffect(() => {
        let interval;
        if (isFighting && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (isFighting && countdown === 0) {
            // Fight!
            const success = runBossFight();
            setResult(success ? 'VICTORY' : 'DEFEAT');
            setMessage(success ? 'You defeated the boss!' : 'The boss was too strong.');
            setIsFighting(false);
        }
        return () => clearInterval(interval);
    }, [isFighting, countdown, runBossFight]);

    const handleChallenge = () => {
        setResult(null);
        setCountdown(5);
        setIsFighting(true);
        setShowPotions(false);
    };

    const potions = inventory.filter(i => i.type === 'Potion');

    const handleUsePotion = (potion) => {
        consumePotion(potion);
        setShowPotions(false);
    };

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.title}>BOSS LAIR</Text>
                <Text style={styles.subtitle}>Bosses Defeated: {bossesDefeated}</Text>

                {activePotions && activePotions.length > 0 ? (
                    <View style={styles.activePotionContainer}>
                        <Text style={styles.activePotionText}>Active Effects:</Text>
                        {activePotions.map((p, index) => (
                            <Text key={index} style={styles.activePotionEffect}>
                                {p.name}: {p.effectType} +{Math.round((p.multiplier - 1) * 100)}%
                            </Text>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noPotionText}>No Active Potion</Text>
                )}

                <View style={styles.statsPreview}>
                    <Text style={styles.statText}>Boss HP: {bossStats.hp}</Text>
                    <Text style={styles.statText}>Boss Acc: {bossStats.accuracy}</Text>
                    <Text style={styles.statText}>Boss Str: {bossStats.maxHit}</Text>
                    <Text style={styles.statText}>Boss Def: {bossStats.defence}</Text>
                </View>
            </View>

            <View style={styles.arena}>
                {isFighting ? (
                    <View style={styles.fightContainer}>
                        <Text style={styles.countdownText}>{countdown}</Text>
                        <Text style={styles.statusText}>FIGHTING...</Text>
                        <ActivityIndicator size="large" color="#FFD700" />
                    </View>
                ) : (
                    <View style={styles.resultContainer}>
                        {result && (
                            <View style={[styles.resultBox, result === 'VICTORY' ? styles.victory : styles.defeat]}>
                                <Text style={styles.resultTitle}>{result}!</Text>
                                <Text style={styles.resultMessage}>{message}</Text>
                            </View>
                        )}

                        {!showPotions && (
                            <TouchableOpacity style={styles.showPotionsButton} onPress={() => setShowPotions(true)}>
                                <Text style={styles.showPotionsText}>Use Potion ({potions.length})</Text>
                            </TouchableOpacity>
                        )}

                        {showPotions && (
                            <View style={styles.potionsList}>
                                <Text style={styles.potionsTitle}>Select Potion:</Text>
                                {potions.length === 0 ? (
                                    <Text style={styles.noPotionsMsg}>No potions in inventory.</Text>
                                ) : (
                                    potions.map((p, i) => (
                                        <TouchableOpacity key={i} style={styles.potionItem} onPress={() => handleUsePotion(p)}>
                                            <Text style={styles.potionName}>{p.name}</Text>
                                            <Text style={styles.potionEffect}>
                                                {p.effectType} +{Math.round((p.multiplier - 1) * 100)}%
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                                <TouchableOpacity style={styles.closePotions} onPress={() => setShowPotions(false)}>
                                    <Text style={styles.closeText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>

            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.challengeButton, (isFighting || showPotions) && styles.disabledButton]}
                    onPress={handleChallenge}
                    disabled={isFighting || showPotions}
                >
                    <Text style={styles.buttonText}>{isFighting ? 'FIGHTING...' : 'CHALLENGE BOSS'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2c0000', // Dark Red
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ff4444',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 18,
        color: '#aaa',
        marginBottom: 5,
    },
    activePotionContainer: {
        marginBottom: 10,
        alignItems: 'center',
        backgroundColor: 'rgba(50, 0, 100, 0.5)',
        padding: 8,
        borderRadius: 5,
        width: '100%',
    },
    activePotionText: {
        color: '#d8f',
        fontWeight: 'bold',
        fontSize: 16,
    },
    activePotionEffect: {
        color: '#f0f',
        fontSize: 14,
    },
    noPotionText: {
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    statsPreview: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 10,
        borderRadius: 8,
    },
    statText: {
        color: '#fff',
        fontSize: 14,
    },
    arena: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    fightContainer: {
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 80,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 10,
    },
    statusText: {
        fontSize: 24,
        color: '#fff',
        marginBottom: 20,
        letterSpacing: 2,
    },
    resultContainer: {
        alignItems: 'center',
        width: '100%',
        flex: 1,
        justifyContent: 'center',
    },
    resultBox: {
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        width: '90%',
        borderWidth: 2,
        marginBottom: 20,
    },
    victory: {
        backgroundColor: 'rgba(0, 200, 0, 0.2)',
        borderColor: '#00cc00',
    },
    defeat: {
        backgroundColor: 'rgba(200, 0, 0, 0.2)',
        borderColor: '#cc0000',
    },
    resultTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    resultMessage: {
        fontSize: 18,
        color: '#ddd',
        textAlign: 'center',
    },
    showPotionsButton: {
        backgroundColor: '#6200ea',
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
    },
    showPotionsText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    potionsList: {
        width: '100%',
        backgroundColor: '#1a1a1a',
        padding: 15,
        borderRadius: 10,
        maxHeight: 300,
        alignItems: 'center',
    },
    potionsTitle: {
        color: '#aaa',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    noPotionsMsg: {
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    potionItem: {
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 5,
        marginBottom: 5,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    potionName: {
        color: '#d8f',
        fontWeight: 'bold',
    },
    potionEffect: {
        color: '#aaa',
    },
    closePotions: {
        marginTop: 10,
        padding: 5,
    },
    closeText: {
        color: '#ff4444',
    },
    actionContainer: {
        paddingBottom: 20,
    },
    challengeButton: {
        backgroundColor: '#8b0000',
        paddingVertical: 20,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ff4444',
        elevation: 5,
    },
    disabledButton: {
        backgroundColor: '#444',
        borderColor: '#666',
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

export default ChallengeBossScreen;
