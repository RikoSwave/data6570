import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useGame } from '../context/GameContext';

const LoginScreen = () => {
    const { loginOrRegister } = useGame();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);

    const handleSubmit = async () => {
        if (!username || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }
        await loginOrRegister(username, password, isLogin);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>RPG Expo App</Text>
            <Text style={styles.subtitle}>{isLogin ? 'Login' : 'Register'}</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>{isLogin ? 'Log In' : 'Create Account'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 20 }}>
                <Text style={styles.toggleText}>
                    {isLogin ? "Need an account? Register." : "Have an account? Log In."}
                </Text>
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
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 10
    },
    subtitle: {
        fontSize: 24,
        color: '#fff',
        marginBottom: 30
    },
    input: {
        width: '100%',
        backgroundColor: '#222',
        color: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
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
        fontSize: 16
    },
    toggleText: {
        color: '#FFD700',
        textDecorationLine: 'underline'
    }
});

export default LoginScreen;
