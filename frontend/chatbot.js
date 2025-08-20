
/**
 * QuickDocs_Chatbot - Frontend Logic
 */

class ChatbotApp {
    constructor() {
         this.apiBaseUrl = 'https://baa1d9eafc64.ngrok-free.app';

       this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.checkSystemStatus();
        
        console.log('🤖 Chatbot app initialized!');
    }

    initializeElements() {
        // File upload elements
        this.fileInput = document.getElementById('fileInput');
        this.fileUploadZone = document.getElementById('fileUploadZone');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.uploadStatus = document.getElementById('uploadStatus');
        
        // CMS upload elements
        this.cmsContent = document.getElementById('cmsContent');
        this.uploadCmsBtn = document.getElementById('uploadCmsBtn');
        
        // Chat elements
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatMessages = document.getElementById('chatMessages');
        
        // Status elements
        this.serverStatus = document.getElementById('serverStatus');
        this.documentsCount = document.getElementById('documentsCount');
        this.lastUpdated = document.getElementById('lastUpdated');
        
        // Settings elements
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettings = document.getElementById('closeSettings');
        this.apiUrl = document.getElementById('apiUrl');
        this.saveSettings = document.getElementById('saveSettings');
    }

    bindEvents() {
        // File upload events
        this.fileUploadZone.addEventListener('click', () => this.fileInput.click());
        this.fileUploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileUploadZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadBtn.addEventListener('click', () => this.uploadFile());

        // CMS upload events
        this.uploadCmsBtn.addEventListener('click', () => this.uploadCmsContent());

        // Chat events
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // Settings events
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.closeSettings.addEventListener('click', () => this.hideSettings());
        this.saveSettings.addEventListener('click', () => this.saveApiUrl());
    }

    // Settings Management
    loadSettings() {
        const savedUrl = localStorage.getItem('chatbot_api_url');
        if (savedUrl) {
            this.apiBaseUrl = savedUrl;
            this.apiUrl.value = savedUrl;
        }
    }

    showSettings() {
        this.settingsPanel.classList.add('show');
        this.apiUrl.value = this.apiBaseUrl;
    }

    hideSettings() {
        this.settingsPanel.classList.remove('show');
    }

    saveApiUrl() {
        const newUrl = this.apiUrl.value.trim();
        if (newUrl) {
            this.apiBaseUrl = newUrl;
            localStorage.setItem('chatbot_api_url', newUrl);
            this.showStatus('API URL updated successfully!', 'success');
            this.hideSettings();
            this.checkSystemStatus();
        } else {
            this.showStatus('Please enter a valid URL', 'error');
        }
    }

    // File Upload Handling
    handleDragOver(e) {
        e.preventDefault();
        this.fileUploadZone.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.fileUploadZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.fileInput.files = files;
            this.handleFileSelect();
        }
    }

    handleFileSelect() {
        if (this.fileInput.files.length > 0) {
            const file = this.fileInput.files[0];
            this.uploadBtn.disabled = false;
            this.uploadBtn.textContent = `Upload ${file.name}`;
            this.fileUploadZone.classList.add('success-glow');
        } else {
            this.uploadBtn.disabled = true;
            this.uploadBtn.textContent = 'Upload File';
            this.fileUploadZone.classList.remove('success-glow');
        }
    }

    async uploadFile() {
        if (!this.fileInput.files.length) {
            this.showStatus('Please select a file first!', 'error');
            return;
        }

        const file = this.fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);

        this.setUploadingState(true);
        this.showStatus('📤 Uploading and processing your file...', 'loading');

        try {
            const response = await fetch(`${this.apiBaseUrl}/upload-file`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showStatus(`✅ ${result.message}`, 'success');
                this.resetFileUpload();
                this.updateLastUpdated();
                this.checkSystemStatus();
                
                // Add a message to chat
                this.addSystemMessage(`📁 Successfully uploaded "${result.filename}" with ${result.chunks_count} text chunks!`);
                
            } else {
                this.showStatus(`❌ ${result.message}`, 'error');
                this.fileUploadZone.classList.add('error-glow');
            }
        } catch (error) {
            this.showStatus(`❌ Connection error: ${error.message}`, 'error');
            this.fileUploadZone.classList.add('error-glow');
            console.error('Upload error:', error);
        } finally {
            this.setUploadingState(false);
        }
    }

    async uploadCmsContent() {
        const content = this.cmsContent.value.trim();
        
        if (!content) {
            this.showStatus('Please enter some content first!', 'error');
            return;
        }

        this.uploadCmsBtn.disabled = true;
        this.uploadCmsBtn.classList.add('loading');
        this.uploadCmsBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';
        
        this.showStatus('📝 Processing your text content...', 'loading');

        try {
            const formData = new FormData();
            formData.append('content', content);

            const response = await fetch(`${this.apiBaseUrl}/upload-cms`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showStatus(`✅ ${result.message}`, 'success');
                this.cmsContent.value = '';
                this.updateLastUpdated();
                this.checkSystemStatus();
                
                // Add a message to chat
                this.addSystemMessage(`📝 Successfully processed your text content with ${result.chunks_count} text chunks!`);
                
            } else {
                this.showStatus(`❌ ${result.message}`, 'error');
            }
        } catch (error) {
            this.showStatus(`❌ Connection error: ${error.message}`, 'error');
            console.error('CMS upload error:', error);
        } finally {
            this.uploadCmsBtn.disabled = false;
            this.uploadCmsBtn.classList.remove('loading');
            this.uploadCmsBtn.textContent = 'Add Text Content';
        }
    }

    // Chat Functionality
    async sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message) {
            this.chatInput.focus();
            return;
        }

        // Add user message to chat
        this.addUserMessage(message);
        this.chatInput.value = '';

        // Show typing indicator
        const typingIndicator = this.addTypingIndicator();

        try {
            const formData = new FormData();
            formData.append('query', message);

            const response = await fetch(`${this.apiBaseUrl}/chat`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            // Remove typing indicator
            typingIndicator.remove();

            if (response.ok) {
                this.addBotMessage(result.response);
                
                
                if (result.sources && result.sources.length > 0) {
                    this.addSourcesMessage(result.sources, result.confidence);
                }
            } else {
                this.addBotMessage(`❌ ${result.response}`, true);
            }
        } catch (error) {
            typingIndicator.remove();
            this.addBotMessage(`❌ Connection error: ${error.message}. Please check your settings and make sure the backend is running.`, true);
            console.error('Chat error:', error);
        }
    }

    addUserMessage(text) {
        const messageDiv = this.createMessageElement(text, 'user');
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(text, isError = false) {
        const messageDiv = this.createMessageElement(text, 'bot');
        if (isError) {
            messageDiv.querySelector('.message-content').style.borderLeft = '4px solid #e53e3e';
        }
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addSystemMessage(text) {
        const messageDiv = this.createMessageElement(text, 'bot');
        messageDiv.querySelector('.message-content').style.background = '#e6fffa';
        messageDiv.querySelector('.message-content').style.borderLeft = '4px solid #38b2ac';
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <span class="loading-spinner"></span> Thinking...
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }

    addSourcesMessage(sources, confidence) {
        const sourceTexts = sources.map(source => 
            `📄 ${source.source} (${source.file_type}) - ${Math.round(source.similarity_score * 100)}% match`
        ).join('\n');
        
        const confidenceEmoji = confidence === 'high' ? '🎯' : confidence === 'medium' ? '👍' : '🤔';
        const sourcesText = `${confidenceEmoji} Sources (${confidence} confidence):\n${sourceTexts}`;
        
        const messageDiv = this.createMessageElement(sourcesText, 'bot');
        messageDiv.querySelector('.message-content').style.background = '#f0f9ff';
        messageDiv.querySelector('.message-content').style.fontSize = '0.9em';
        messageDiv.querySelector('.message-content').style.whiteSpace = 'pre-line';
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    createMessageElement(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'user' ? '👤' : '🤖';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${text.replace(/\n/g, '<br>')}</p>
            </div>
        `;
        
        return messageDiv;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // Status and UI Updates
    async checkSystemStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/status`);
            const result = await response.json();

            if (response.ok) {
                this.serverStatus.textContent = '✅ Connected';
                this.serverStatus.style.color = '#22543d';
                this.documentsCount.textContent = result.total_documents || 0;
                
                // Clear any error states
                this.fileUploadZone.classList.remove('error-glow');
                
            } else {
                this.serverStatus.textContent = '❌ Error';
                this.serverStatus.style.color = '#742a2a';
            }
        } catch (error) {
            this.serverStatus.textContent = '❌ Offline';
            this.serverStatus.style.color = '#742a2a';
            console.log('Status check failed - backend might be offline');
        }
    }

    showStatus(message, type) {
        this.uploadStatus.textContent = message;
        this.uploadStatus.className = `status-message ${type} show`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.uploadStatus.classList.remove('show');
        }, 5000);
    }

    setUploadingState(isUploading) {
        this.uploadBtn.disabled = isUploading;
        this.uploadBtn.classList.toggle('loading', isUploading);
        
        if (isUploading) {
            this.uploadBtn.innerHTML = '<span class="loading-spinner"></span> Uploading...';
        } else {
            this.uploadBtn.textContent = this.fileInput.files.length ? 
                `Upload ${this.fileInput.files[0].name}` : 'Upload File';
        }
    }

    resetFileUpload() {
        this.fileInput.value = '';
        this.uploadBtn.disabled = true;
        this.uploadBtn.textContent = 'Upload File';
        this.fileUploadZone.classList.remove('success-glow', 'error-glow');
    }

    updateLastUpdated() {
        const now = new Date().toLocaleTimeString();
        this.lastUpdated.textContent = now;
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new ChatbotApp();
    
    // Check status every 30 seconds
    setInterval(() => {
        window.chatbot.checkSystemStatus();
    }, 30000);
    
    console.log('🚀 Chatbot is ready!');
});

window.testConnection = async function() {
    console.log('Testing connection to:', window.chatbot.apiBaseUrl);
    await window.chatbot.checkSystemStatus();
};

window.updateApiUrl = function(url) {
    window.chatbot.apiBaseUrl = url;
    localStorage.setItem('chatbot_api_url', url);
    console.log('API URL updated to:', url);
    window.chatbot.checkSystemStatus();
};// JavaScript
