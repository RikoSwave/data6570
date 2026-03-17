import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';
import { getTownLevelBonuses } from '../utils/gameLogic';

const TownScreen = () => {
    const {
        townLevel, townXP, activeQuest, shopStock,
        refreshShops, buyItem, sellItemToShop, restAtInn, completeInnRest,
        startQuest, updateQuestProgress, claimQuestReward, donateItem,
        inventory, coins, playerStats, calculateTownXPForLevel, xp, equipped
    } = useGame();

    const [view, setView] = useState('HUB'); // HUB, BLACKSMITH, POTION, INN, SQUARE
    const [resting, setResting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);

    // Refresh shops on mount if needed
    useEffect(() => {
        refreshShops();
    }, []);

    // Timer for refreshing shop button? 
    // The user said "60 second cooldown for the refresh button".
    // We can just check `shopStock.lastRefresh`.

    const handleRefreshShop = (type) => {
        // Find which timer we look at for the alert
        const lastRefresh = type === 'Blacksmith' ? shopStock.lastRefreshBlacksmith : shopStock.lastRefreshPotion;

        const success = refreshShops(type, true);
        if (refreshShops(type)) {
            Alert.alert("Shop Refreshed", "New stock has arrived!");
        } else {
            const remaining = 60 - Math.floor((Date.now() - lastRefresh) / 1000);
            Alert.alert("Cooldown", `Wait ${remaining}s to refresh.`);
        }
    };

    const handleSellItem = (item) => {
        const sellValue = item.name.includes('Lucky') ? Math.floor(item.value * 1.5) : item.value;
        const msg = `Sell ${item.name} for ${sellValue}c?`;
        if (Platform.OS === 'web') {
            if (window.confirm(msg)) sellItemToShop(item);
        } else {
            Alert.alert("Sell Item", msg, [
                { text: "Cancel", style: "cancel" },
                { text: "Sell", onPress: () => sellItemToShop(item) }
            ]);
        }
    };

    const handleDonateItem = (item) => {
        const msg = `Donate ${item.name}?`;
        if (Platform.OS === 'web') {
            if (window.confirm(msg)) donateItem(item);
        } else {
            Alert.alert("Donate", msg, [
                { text: "Cancel", style: "cancel" },
                { text: "Donate", onPress: () => donateItem(item) }
            ]);
        }
    };

    const handleRest = async () => {
        if (playerStats.stamina === undefined) return;
        // Or check currentStamina context? 

        const success = await restAtInn();
        if (success) {
            setResting(true);
            setTimeLeft(10);
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setResting(false);
                        completeInnRest();
                        Alert.alert("Rested", "You feel refreshed! Stamina restored.");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            Alert.alert("Not enough coins", "You need 10 coins to rest.");
        }
    };

    const renderHub = () => (
        <View style={styles.hubContainer}>
            <View style={styles.titleRow}>
                <Text style={styles.townTitle}>Town Level {townLevel}</Text>
                <TouchableOpacity onPress={() => setShowTooltip(!showTooltip)} style={styles.infoIcon}>
                    <Ionicons name="information-circle-outline" size={32} color="#FFD700" />
                </TouchableOpacity>
            </View>
            <Text style={styles.subTitle}>XP: {townXP} / {calculateTownXPForLevel(townLevel + 1)}</Text>

            {showTooltip && (
                <View style={styles.tooltipCard}>
                    <Text style={styles.tooltipHeader}>Next Level Bonuses:</Text>
                    {getTownLevelBonuses(townLevel + 1).map((bonus, idx) => (
                        <Text key={idx} style={styles.tooltipText}>• {bonus}</Text>
                    ))}
                </View>
            )}

            <TouchableOpacity style={styles.hubButton} onPress={() => setView('BLACKSMITH')}>
                <Ionicons name="hammer" size={32} color="#e74c3c" />
                <Text style={styles.hubButtonText}>Blacksmith</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubButton} onPress={() => setView('POTION')}>
                <Ionicons name="flask" size={32} color="#9b59b6" />
                <Text style={styles.hubButtonText}>Potion Shop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubButton} onPress={() => setView('INN')}>
                <Ionicons name="bed" size={32} color="#f1c40f" />
                <Text style={styles.hubButtonText}>The Inn</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubButton} onPress={() => setView('SQUARE')}>
                <Ionicons name="people" size={32} color="#3498db" />
                <Text style={styles.hubButtonText}>Town Square</Text>
            </TouchableOpacity>
        </View>
    );

    const renderShop = (type) => { // 'Blacksmith' or 'Potion'
        const stock = type === 'Blacksmith' ? (shopStock?.blacksmith || []) : (shopStock?.potion || []);
        const shopName = type === 'Blacksmith' ? "Blacksmith" : "Potion Shop";

        return (
            <View style={styles.shopContainer}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => setView('HUB')}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{shopName}</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.shopControls}>
                    <Text style={styles.coinText}>Coins: {coins}</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={() => handleRefreshShop(type)}>
                        <Text style={styles.buttonText}>Refresh Stock</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionHeader}>Buy</Text>
                {stock.length === 0 ? (
                    <Text style={styles.emptyText}>Sold Out</Text>
                ) : (
                    <FlatList
                        data={stock}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.itemRow} onPress={() => {
                                const result = buyItem(item);
                                if (result.success) Alert.alert("Bought", `You bought ${item.name}`);
                                else Alert.alert("Error", result.message);
                            }}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemDetails}>
                                        {/* Simple stat summary */}
                                        {item.type === 'Potion'
                                            ? `${item.effectType} +${Math.round((item.multiplier - 1) * 100)}%`
                                            : `Tier: ${Math.floor(item.value / 10)}` // Rough tier guess for display
                                        }
                                    </Text>
                                </View>
                                <Text style={styles.priceText}>{item.buyPrice}c</Text>
                            </TouchableOpacity>
                        )}
                    />
                )}

                <View style={styles.divider} />
                <Text style={styles.sectionHeader}>Sell from Inventory</Text>
                <FlatList
                    data={type === 'Blacksmith' ? inventory.filter(i => i.type !== 'Potion') : inventory.filter(i => i.type === 'Potion')}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.itemRow} onPress={() => handleSellItem(item)}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>
                                    {item.name} {item.quantity && item.quantity > 1 ? `(x${item.quantity})` : ''}
                                </Text>
                            </View>
                            <Text style={styles.priceText}>
                                {item.name.includes('Lucky') ? Math.floor(item.value * 1.5) : item.value}c
                                {item.name.includes('Lucky') && <Text style={{ color: '#f1c40f' }}> (+Bonus)</Text>}
                            </Text>
                        </TouchableOpacity>
                    )}
                />

            </View>
        );
    };

    const renderInn = () => (
        <View style={styles.innContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => setView('HUB')}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>The Inn</Text>

            <View style={styles.restContainer}>
                <Ionicons name="bed" size={64} color="#f1c40f" />
                <Text style={styles.descriptionText}>
                    Rest for a while to restore your strength.
                </Text>
                <Text style={styles.priceTag}>Cost: 10 Coins</Text>

                {resting ? (
                    <Text style={styles.timerText}>Resting... {timeLeft}s</Text>
                ) : (
                    <TouchableOpacity style={styles.actionButton} onPress={handleRest}>
                        <Text style={styles.actionButtonText}>Rest (10s)</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderSquare = () => (
        <View style={styles.squareContainer}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setView('HUB')}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Town Square</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.questBoard}>
                <Text style={styles.boardTitle}>Notice Board</Text>
                {activeQuest ? (
                    <View style={styles.activeQuestCard}>
                        <Text style={styles.questName}>{activeQuest.name}</Text>
                        <Text style={styles.questDesc}>{activeQuest.description}</Text>
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: `${(Math.min(activeQuest.progress, activeQuest.count) / activeQuest.count) * 100}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.min(activeQuest.progress, activeQuest.count)} / {activeQuest.count}</Text>

                        {activeQuest.isCompleted ? (
                            <TouchableOpacity style={styles.claimButton} onPress={() => {
                                claimQuestReward();
                                Alert.alert("Quest Complete", `Received ${activeQuest.rewardCoins} coins and ${activeQuest.rewardTownXP} Town XP!`);
                            }}>
                                <Text style={styles.buttonText}>CLAIM REWARD</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.statusText}>In Progress</Text>
                        )}
                    </View>
                ) : (
                    <TouchableOpacity style={styles.acceptButton} onPress={startQuest}>
                        <Text style={styles.buttonText}>Find a Quest</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.donationCenter}>
                <Text style={styles.boardTitle}>Donation Center</Text>
                <Text style={styles.descriptionText}>Donate items to improve the town.</Text>
                <FlatList
                    horizontal
                    data={inventory.filter(i => i.type !== 'Potion')}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => {
                        let sellValue = item.value || 0;
                        if (item.name.includes('Lucky')) {
                            sellValue = Math.floor(sellValue * 1.5);
                        }
                        const itemXp = Math.ceil(sellValue * 1.1);

                        return (
                            <TouchableOpacity style={styles.donateItem} onPress={() => handleDonateItem(item)}>
                                <Text style={styles.smallItemText} numberOfLines={2}>
                                    {item.name} {item.quantity && item.quantity > 1 ? `(x${item.quantity})` : ''}
                                </Text>
                                <Text style={styles.xpValueText}>+{itemXp} XP</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {view === 'HUB' && renderHub()}
            {view === 'BLACKSMITH' && renderShop('Blacksmith')}
            {view === 'POTION' && renderShop('Potion')}
            {view === 'INN' && renderInn()}
            {view === 'SQUARE' && renderSquare()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        padding: 20,
    },
    hubContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    townTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 10,
    },
    subTitle: {
        fontSize: 18,
        color: '#aaa',
        marginBottom: 40,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    infoIcon: {
        marginLeft: 10,
        marginBottom: 5,
    },
    tooltipCard: {
        backgroundColor: '#2c3e50',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        width: '80%',
        borderWidth: 1,
        borderColor: '#f39c12',
    },
    tooltipHeader: {
        color: '#f39c12',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 10,
    },
    tooltipText: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 5,
    },
    hubButton: {
        width: '80%',
        backgroundColor: '#34495e',
        padding: 20,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 5,
    },
    hubButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    shopContainer: {
        flex: 1,
    },
    shopControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    coinText: {
        color: '#f1c40f',
        fontSize: 18,
        fontWeight: 'bold',
    },
    refreshButton: {
        backgroundColor: '#2980b9',
        padding: 10,
        borderRadius: 5,
    },
    sectionHeader: {
        color: '#888',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 10,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 5,
        marginBottom: 5,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        color: '#fff',
        fontWeight: 'bold',
    },
    itemDetails: {
        color: '#aaa',
        fontSize: 12,
    },
    priceText: {
        color: '#f1c40f',
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#444',
        marginVertical: 10,
    },
    innContainer: {
        flex: 1,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        padding: 10,
        zIndex: 10,
    },
    restContainer: {
        marginTop: 100,
        alignItems: 'center',
        backgroundColor: '#2c3e50',
        padding: 40,
        borderRadius: 20,
        width: '100%',
    },
    descriptionText: {
        color: '#ccc',
        textAlign: 'center',
        marginVertical: 20,
        fontSize: 16,
    },
    priceTag: {
        color: '#f1c40f',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    actionButton: {
        backgroundColor: '#27ae60',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    timerText: {
        color: '#e74c3c',
        fontSize: 24,
        fontWeight: 'bold',
    },
    squareContainer: {
        flex: 1,
    },
    questBoard: {
        backgroundColor: '#d35400',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    boardTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    activeQuestCard: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 5,
    },
    questName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    questDesc: {
        color: '#555',
        marginBottom: 5,
    },
    progressContainer: {
        height: 10,
        backgroundColor: '#eee',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 5,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#27ae60',
    },
    progressText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#555',
    },
    acceptButton: {
        backgroundColor: '#f39c12',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    claimButton: {
        backgroundColor: '#27ae60',
        marginTop: 10,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    statusText: {
        textAlign: 'center',
        color: '#e67e22',
        fontWeight: 'bold',
        marginTop: 5,
    },
    donationCenter: {
        backgroundColor: '#34495e',
        padding: 15,
        borderRadius: 10,
        flex: 1,
    },
    donateItem: {
        backgroundColor: '#2c3e50',
        padding: 10,
        borderRadius: 5,
        marginRight: 10,
        width: 100,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    smallItemText: {
        color: '#fff',
        fontSize: 11,
        textAlign: 'center',
        marginBottom: 5,
    },
    xpValueText: {
        color: '#2ecc71',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default TownScreen;
