import { API } from './api.js';
import { UI } from './ui.js';

export const Chat = {
    async sendTextMessage(prompt) {
        if (!prompt.trim()) return;

        UI.addMessage('user', prompt);
        UI.elements.textInput.value = '';
        UI.showTypingIndicator();

        try {
            const result = await API.sendText(prompt);
            UI.removeTypingIndicator();
            UI.addMessage('assistant', result.data.aiResponse, true);
        } catch (err) {
            UI.removeTypingIndicator();
            UI.showError(err.message);
        }
    },

    async clearHistory() {
        if (!confirm('Clear conversation history?')) return;

        try {
            await API.clearHistory();
            UI.clearChat();
        } catch (err) {
            UI.showError(err.message);
        }
    },

    async loadHistory() {
        try {
            const result = await API.getHistory();
            const history = result.data?.history || [];

            if (history.length === 0) {
                UI.elements.emptyState.style.display = 'flex';
                return;
            }

            UI.elements.emptyState.style.display = 'none';
            UI.elements.chatContainer.innerHTML = '';

            history.forEach(msg => {
                UI.addMessage(msg.role, msg.content, msg.role === 'assistant');
            });
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    }
};
