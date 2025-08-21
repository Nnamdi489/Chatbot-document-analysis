
/**
 * QuickDocs_Chatbot - Frontend Logic
 */

class QuickDocsChat {
    constructor() {
        
        this.apiBaseUrl = 'https://386d4f2651ad.ngrok-free.app/';
        this.messages = [];
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadStatus = document.getElementById('uploadStatus');
        this.welcomeScreen = document.getElementById('welcomeScreen');
    }

    bindEvents() {
        // Chat input events
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.chatInput.addEventListener('input', () => {
            this.autoResize();
            this.updateSendButton();
        });

        // File upload events
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        this.fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });
    }

    autoResize() {
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    }

    updateSendButton() {
        const hasContent = this.chatInput.value.trim().length > 0;
        this.sendButton.disabled = !hasContent;
    }

    async handleFileUpload(files) {
        if (!files.length) return;

        for (const file of files) {
            await this.uploadFile(file);
        }
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        this.showUploadStatus(`Uploading ${file.name}...`, 'info');

        try {
            const response = await fetch(`${this.apiBaseUrl}/upload-file`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showUploadStatus(`Successfully uploaded ${file.name}`, 'success');
            } else {
                this.showUploadStatus(`Failed to upload ${file.name}: ${result.message}`, 'error');
            }
        } catch (error) {
            this.showUploadStatus(`Upload failed: ${error.message}`, 'error');
            console.error('Upload error:', error);
        }
    }

    showUploadStatus(message, type) {
        this.uploadStatus.textContent = message;
        this.uploadStatus.className = `upload-status ${type} show`;

        setTimeout(() => {
            this.uploadStatus.classList.remove('show');
        }, 3000);
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Hide welcome screen on first message
        if (this.welcomeScreen) {
            this.welcomeScreen.style.display = 'none';
        }

        // Add user message
        this.addMessage(message, 'user');
        this.chatInput.value = '';
        this.autoResize();
        this.updateSendButton();

        // Show typing indicator
        const typingElement = this.addTypingIndicator();

        try {
            const formData = new FormData();
            formData.append('query', message);

            const response = await fetch(`${this.apiBaseUrl}/chat`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            // Remove typing indicator
            typingElement.remove();

            if (response.ok) {
                this.addMessage(result.response, 'assistant', result.sources);
            } else {
                this.addMessage(`I encountered an error: ${result.response}`, 'assistant');
            }
        } catch (error) {
            typingElement.remove();
            this.addMessage('Sorry, I couldn\'t process your request. Please check your connection and try again.', 'assistant');
            console.error('Chat error:', error);
        }
    }

    addMessage(content, role, sources = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = content;

        messageContent.appendChild(messageText);

        if (sources && sources.length > 0) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'message-sources';

            const sourcesTitle = document.createElement('div');
            sourcesTitle.className = 'sources-title';
            sourcesTitle.textContent = 'Sources:';
            sourcesDiv.appendChild(sourcesTitle);

            sources.forEach(source => {
                const sourceItem = document.createElement('div');
                sourceItem.className = 'source-item';
                sourceItem.textContent = `📄 ${source.source} (${Math.round(source.similarity_score * 100)}% match)`;
                sourcesDiv.appendChild(sourceItem);
            });

            messageContent.appendChild(sourcesDiv);
        }

        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        this.messages.push({ role, content, sources });
    }

    addTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            <span>Thinking</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        messageContent.appendChild(typingDiv);
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        return messageDiv;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    startNewChat() {
        this.messages = [];
        this.chatMessages.innerHTML = '';
        this.welcomeScreen.style.display = 'flex';
    }

    sendExamplePrompt(prompt) {
        this.chatInput.value = prompt;
        this.updateSendButton();
        this.sendMessage();
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new QuickDocsChat();
});

// Global functions for HTML onclick events
function startNewChat() {
    if (app) {
        app.startNewChat();
    }
}

function sendExamplePrompt(prompt) {
    if (app) {
        app.sendExamplePrompt(prompt);
    }
}

function sendMessage() {
    if (app) {
        app.sendMessage();
    }
}