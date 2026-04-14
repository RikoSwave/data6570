import AsyncStorage from '@react-native-async-storage/async-storage';

// Use localhost for web, 10.0.2.2 for Android emulator, or your local IP for real device
// We'll use localhost since the testing is requested on the web platform primarily.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = await AsyncStorage.getItem('@auth_token');
    
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token && !endpoint.includes('/auth/login/') && !endpoint.includes('/auth/register/')) {
        headers['Authorization'] = `Token ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        let data = null;
        try {
            data = await response.json();
        } catch(e) { /* ignores empty response */ }
        
        return { status: response.status, data };
    } catch (e) {
        console.error("API Call Error:", e);
        return { status: 500, data: { error: 'Network Error' } };
    }
};
