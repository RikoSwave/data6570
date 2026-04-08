import axios from 'axios';

// Defaults to localhost for dev unless otherwise specified in .env
const baseURL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: baseURL,
});

export async function createUser(userData) {
    const res = await api.post('/users/', userData);
    return res.data;
}

export async function getUsers() {
    const res = await api.get('/users/');
    return res.data;
}

export async function getUser(userId) {
    const res = await api.get(`/users/${userId}`);
    return res.data;
}

export async function saveRun(userId, coins, distance) {
    const res = await api.patch(`/users/${userId}/run`, {
        coins_collected: coins,
        distance_run: distance
    });
    return res.data;
}

export async function buyItem(userId, purchaseData) {
    const res = await api.post(`/users/${userId}/store/buy`, purchaseData);
    return res.data;
}

export async function setActiveMount(userId, mountId) {
    const res = await api.post(`/users/${userId}/barn/mount/${mountId}`);
    return res.data;
}

// Generate simple placeholder assets since art isn't provided
export function createPlaceholders(scene) {
    let graphics = scene.add.graphics();

    // Simple square for the player (Rider)
    graphics.fillStyle(0xFFFFFF, 1.0);
    graphics.fillRect(0, 0, 32, 48);
    graphics.generateTexture('player_placeholder', 32, 48);
    graphics.clear();
    
    // Simple rectangle for the mount
    graphics.fillStyle(0x8888FF, 1.0);
    graphics.fillRect(0, 0, 48, 32);
    graphics.generateTexture('mount_placeholder', 48, 32);
    graphics.clear();
    
    // Simple yellow circle for coin
    graphics.fillStyle(0xFFD700, 1.0);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('coin_placeholder', 16, 16);
    graphics.clear();

    // Red triangle for obstacle
    graphics.fillStyle(0xFF0000, 1.0);
    graphics.fillTriangle(0, 32, 16, 0, 32, 32);
    graphics.generateTexture('obstacle_placeholder', 32, 32);
    graphics.clear();
    
    // Simple green rectangle for ground platform
    graphics.fillStyle(0x228B22, 1.0);
    graphics.fillRect(0, 0, 800, 32);
    graphics.generateTexture('ground_placeholder', 800, 32);
    graphics.destroy();
}
