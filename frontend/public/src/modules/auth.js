import { CONFIG } from '../config/config.js';

export const Auth = {
    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    setToken(token) {
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
    },

    clearToken() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
    },

    getHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    async authenticate() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (result.success && result.data.token) {
                this.setToken(result.data.token);
                return true;
            }

            return false;
        } catch (err) {
            console.error('Authentication failed:', err);
            return false;
        }
    }
};
