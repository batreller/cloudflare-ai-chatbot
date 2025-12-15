import { API } from './api.js';
import { UI } from './ui.js';

export const VoiceRecorder = {
    mediaRecorder: null,
    audioChunks: [],

    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                await this.handleRecording(audioBlob);
            };

            this.mediaRecorder.start();
            UI.setRecordingState(true);
        } catch (err) {
            UI.showError(`Microphone access denied: ${err.message}`);
        }
    },

    stop() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        UI.setRecordingState(false);
    },

    async handleRecording(audioBlob) {
        UI.showTypingIndicator();

        try {
            const result = await API.sendVoice(audioBlob);
            UI.removeTypingIndicator();
            UI.addMessage('user', result.data.transcription);
            UI.addMessage('assistant', result.data.aiResponse, true);
        } catch (err) {
            UI.removeTypingIndicator();
            UI.showError(err.message);
        }
    }
};
