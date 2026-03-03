
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { GEAR_TYPES } from '../utils/gameLogic';
import SaveLoadControls from '../components/SaveLoadControls';

const GearScreen = () => {
    const { equipped, inventory, equipGear, unequipGear, playerStats, coins, consumePotion } = useGame();

    const renderEquippedSlot = (slot) => {
        const item = equipped[slot];
        return (
            <TouchableOpacity
                key={slot}
                style={[styles.slot, item ? styles.filledSlot : styles.emptySlot]}
                onPress={() => item && unequipGear(slot)}
                disabled={!item}
            >
                <Text style={styles.slotLabel}>{slot}</Text>
                {item ? (
                    <View>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemStats}>
                            {item.stats.accuracy ? `Acc: +${item.stats.accuracy} ` : ''}
                            {item.stats.maxHit ? `Str: +${item.stats.maxHit} ` : ''}
                            {item.stats.defence ? `Def: +${item.stats.defence} ` : ''}
                            {item.stats.speedBonus ? `Spd: +${item.stats.speedBonus}%` : ''}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.emptyText}>Empty</Text>
                )}
            </TouchableOpacity>
        );
    };

    const handleInventoryPress = (item) => {
        if (item.type === 'Potion') {
            // Potions cannot be equipped here, maybe just show details?
            // Actually, let's allow selling logic to be separate.
            return;
        }
        equipGear(item);
    };

    const renderInventoryItem = ({ item }) => (
        <View style={styles.inventoryItemContainer}>
            <TouchableOpacity style={styles.inventoryItem} onPress={() => handleInventoryPress(item)}>
                <View style={styles.itemInfo}>
                    <Text style={styles.invItemName}>{item.name}</Text>
                    <Text style={styles.invItemType}>{item.type}</Text>
                </View>
                {item.type !== 'Potion' && (
                    <Text style={styles.invItemStats}>
                        {item.stats.accuracy ? `Acc: ${item.stats.accuracy} ` : ''}
                        {item.stats.maxHit ? `Str: ${item.stats.maxHit} ` : ''}
                        {item.stats.defence ? `Def: ${item.stats.defence} ` : ''}
                        {item.stats.speedBonus ? `Spd: ${item.stats.speedBonus}%` : ''}
                    </Text>
                )}
                {item.type === 'Potion' && (
                    <Text style={styles.invItemStats}>
                        {item.effectType} +{Math.round((item.multiplier - 1) * 100)}%
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <SaveLoadControls />
            <View style={styles.statsPanel}>
                <Text style={styles.panelTitle}>PLAYER STATS</Text>
                <Text style={styles.coinText}>Coins: {coins}</Text>
                <View style={styles.statsGrid}>
                    <Text style={styles.statLine}>Accuracy: <Text style={styles.statValue}>{playerStats.accuracy}</Text></Text>
                    <Text style={styles.statLine}>Max Hit: <Text style={styles.statValue}>{playerStats.maxHit}</Text></Text>
                    <Text style={styles.statLine}>Defence: <Text style={styles.statValue}>{playerStats.defence}</Text></Text>
                </View>
            </View>

            <Text style={styles.sectionHeader}>EQUIPPED GEAR</Text>
            <View style={styles.equippedContainer}>
                {GEAR_TYPES.map(slot => renderEquippedSlot(slot))}
            </View>

            <Text style={styles.sectionHeader}>INVENTORY ({inventory.length})</Text>
            <FlatList
                data={inventory}
                renderItem={renderInventoryItem}
                keyExtractor={(item) => item.id}
                style={styles.inventoryList}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={<Text style={styles.emptyList}>No items in inventory.</Text>}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
        padding: 10,
    },
    statsPanel: {
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    panelTitle: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 5,
        textAlign: 'center',
    },
    coinText: {
        color: '#FFD700',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statLine: {
        color: '#ccc',
        fontSize: 16,
    },
    statValue: {
        color: '#fff',
        fontWeight: 'bold',
    },
    sectionHeader: {
        color: '#888',
        fontSize: 14,
        marginBottom: 10,
        paddingLeft: 5,
        fontWeight: 'bold',
    },
    equippedContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    slot: {
        width: '48%',
        backgroundColor: '#222',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#444',
        minHeight: 80,
    },
    filledSlot: {
        borderColor: '#66aa66',
        backgroundColor: '#1a331a',
    },
    emptySlot: {
        borderStyle: 'dashed',
    },
    slotLabel: {
        color: '#666',
        fontSize: 12,
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    itemName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    itemStats: {
        color: '#aaa',
        fontSize: 12,
    },
    emptyText: {
        color: '#444',
        fontStyle: 'italic',
    },
    inventoryList: {
        flex: 1,
    },
    inventoryItemContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    inventoryItem: {
        backgroundColor: '#2a2a2a',
        padding: 12,
        borderRadius: 8,
        marginRight: 5,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    invItemName: {
        color: '#eee',
        fontWeight: 'bold',
    },
    invItemType: {
        color: '#666',
        fontSize: 12,
    },
    invItemStats: {
        color: '#aaa',
        fontSize: 12,
    },
    emptyList: {
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default GearScreen;
