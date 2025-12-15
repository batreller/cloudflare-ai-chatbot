import { UI } from '../modules/ui.js';
import { VoiceRecorder } from '../modules/voiceRecorder.js';
import { Chat } from '../modules/chat.js';

export const EventHandlers = {
    init() {
        UI.elements.recordBtn.addEventListener('click', () => VoiceRecorder.start());
        UI.elements.stopBtn.addEventListener('click', () => VoiceRecorder.stop());

        UI.elements.sendBtn.addEventListener('click', () => {
            Chat.sendTextMessage(UI.elements.textInput.value);
        });

        UI.elements.clearBtn.addEventListener('click', () => Chat.clearHistory());

        UI.elements.textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                Chat.sendTextMessage(UI.elements.textInput.value);
            }
        });
    }
};
