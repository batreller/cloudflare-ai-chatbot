import { Auth } from './modules/auth.js';
import { UI } from './modules/ui.js';
import { Chat } from './modules/chat.js';
import { EventHandlers } from './utils/eventHandlers.js';

async function init() {
    UI.init();

    if (!Auth.getToken()) {
        const success = await Auth.authenticate();
        if (!success) {
            UI.showError('Failed to authenticate. Please refresh the page.');
            return;
        }
    }

    await Chat.loadHistory();
    EventHandlers.init();
}

init();
