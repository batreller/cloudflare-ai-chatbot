import { CONFIG } from '../config/config.js';
import { Auth } from './auth.js';

export const API = {
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_URL}${endpoint}`;
        const headers = {
            ...Auth.getHeaders(),
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });
            const result = await response.json();

            if (response.status === 401) {
                Auth.clearToken();
                const reauthed = await Auth.authenticate();

                if (reauthed) {
                    const retryHeaders = {
                        ...Auth.getHeaders(),
                        ...options.headers
                    };
                    const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
                    return await retryResponse.json();
                }
                throw new Error('Authentication failed');
            }

            if (!result.success) {
                throw new Error(result.error || 'Request failed');
            }

            return result;
        } catch (err) {
            console.error(`API request failed (${endpoint}):`, err);
            throw err;
        }
    },

    async sendVoice(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        return this.request('/api/voice', {
            method: 'POST',
            body: formData
        });
    },

    async sendText(prompt) {
        return this.request('/api/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
    },

    async clearHistory() {
        return this.request('/api/clear', {
            method: 'DELETE'
        });
    },

    async getHistory() {
        return this.request('/api/history');
    }
};
