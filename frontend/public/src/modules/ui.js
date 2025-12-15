export const UI = {
    elements: {
        recordBtn: null,
        stopBtn: null,
        recordStatus: null,
        sendBtn: null,
        clearBtn: null,
        textInput: null,
        chatContainer: null,
        emptyState: null
    },

    init() {
        this.elements = {
            recordBtn: document.getElementById('recordBtn'),
            stopBtn: document.getElementById('stopBtn'),
            recordStatus: document.getElementById('recordStatus'),
            sendBtn: document.getElementById('sendBtn'),
            clearBtn: document.getElementById('clearBtn'),
            textInput: document.getElementById('textInput'),
            chatContainer: document.getElementById('chatContainer'),
            emptyState: document.getElementById('emptyState')
        };
    },

    addMessage(role, content, isMarkdown = false) {
        this.elements.emptyState.style.display = 'none';

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (isMarkdown && role === 'assistant') {
            contentDiv.innerHTML = marked.parse(content);
        } else {
            contentDiv.textContent = content;
        }

        messageDiv.appendChild(contentDiv);
        this.elements.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    },

    showTypingIndicator() {
        this.elements.emptyState.style.display = 'none';

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant';
        typingDiv.id = 'typingIndicator';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content typing-indicator';
        contentDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

        typingDiv.appendChild(contentDiv);
        this.elements.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
    },

    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    },

    showError(message) {
        alert(`Error: ${message}`);
    },

    scrollToBottom() {
        this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
    },

    clearChat() {
        this.elements.chatContainer.innerHTML = '';
        this.elements.emptyState.style.display = 'flex';
        this.elements.chatContainer.appendChild(this.elements.emptyState);
    },

    setRecordingState(isRecording) {
        this.elements.recordBtn.disabled = isRecording;
        this.elements.recordBtn.classList.toggle('recording', isRecording);
        this.elements.stopBtn.disabled = !isRecording;
        this.elements.recordStatus.textContent = isRecording ? 'Recording...' : '';
    }
};
