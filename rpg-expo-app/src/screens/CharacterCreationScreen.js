import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useGame } from '../context/GameContext';

const CharacterCreationScreen = () => {
    const { createCharacter } = useGame();
    const [characterName, setCharacterName] = useState('');

    const handleSubmit = async () => {
        if (!characterName) {
            Alert.alert("Error", "Please enter a character name.");
            return;
        }
        await createCharacter(characterName);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Your Character</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Character Name"
                placeholderTextColor="#999"
                value={characterName}
                onChangeText={setCharacterName}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Start Adventure</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 40
    },
    input: {
        width: '100%',
        backgroundColor: '#222',
        color: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#444'
    },
    button: {
        width: '100%',
        backgroundColor: '#FFD700',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 18
    }
});

export default CharacterCreationScreen;
