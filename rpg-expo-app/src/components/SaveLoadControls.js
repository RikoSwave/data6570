
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useGame } from '../context/GameContext';

const SaveLoadControls = () => {
    const { saveGame, loadGame } = useGame();

    const handleSave = async () => {
        const success = await saveGame();
        Alert.alert(success ? 'Game Saved!' : 'Save Failed');
    };

    const handleLoad = async () => {
        const success = await loadGame();
        Alert.alert(success ? 'Game Loaded!' : 'Load Failed');
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.text}>SAVE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleLoad}>
                <Text style={styles.text}>LOAD</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#444',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#666',
    },
    text: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default SaveLoadControls;
