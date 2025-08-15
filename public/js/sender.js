// Sender Page JavaScript - WhatsApp Message Broadcasting
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const senderForm = document.getElementById('senderForm');
    const phoneInput = document.getElementById('phoneNumber');
    const messageTextarea = document.getElementById('messageText');
    const charCount = document.getElementById('charCount');
    const sendButton = document.getElementById('sendButton');
    const emojiGrid = document.getElementById('emojiGrid');
    const emojiSearch = document.getElementById('emojiSearch');
    const previewBubble = document.getElementById('previewBubble');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const toastContainer = document.getElementById('toastContainer');

    // API Configuration
    const API_CONFIG = {
        baseURL: '/api/whatsapp/send', // Use local proxy to bypass CORS
        instanceId: '687DA295BBCE4',
        accessToken: '66d80dc8ab1e8',
        testMode: false // Set to false when you have valid credentials
    };

    // Emoji Database
    const EMOJIS = {
        recent: [],
        smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩'],
        gestures: ['👍', '👎', '👌', '🤝', '👏', '🙌', '👊', '✊', '🤜', '🤛', '👋', '🤚', '🖐', '✋', '🖖', '👈', '👉', '👆', '🖕', '👇', '☝', '👍', '👎', '👊', '✊', '👌', '🤝', '🙏'],
        hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💯'],
        nature: ['🌱', '🌿', '🍀', '🌳', '🌲', '🌴', '🎋', '🌵', '🌾', '🌻', '🌺', '🌸', '🌼', '🌷', '🥀', '🌹', '🏵', '💐', '🌂', '🌈', '⭐', '🌟', '✨', '💫', '⚡', '☄️', '☀️', '🌙'],
        food: ['🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥒', '🥬', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨'],
        activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎯', '🎪', '🎭', '🎨'],
        symbols: ['💯', '💫', '💥', '💢', '💨', '💦', '💤', '🕳', '💣', '💬', '🗨', '🗯', '💭', '💡', '💊', '🔥', '⭐', '🌟', '✨', '⚡', '💎', '🔔', '🔕', '📢', '📣', '📯', '💌', '💘', '💝', '🎁']
    };

    // Message Templates
    const MESSAGE_TEMPLATES = {
        greeting: "Hello! 👋 Hope you're having a great day!",
        reminder: "⏰ Friendly reminder about our upcoming meeting. Don't forget! 📅",
        announcement: "📢 Important Announcement: We have some exciting news to share with you! 🎉",
        'thank-you': "🙏 Thank you so much for your support! We truly appreciate it. ❤️",
        'follow-up': "📞 Following up on our previous conversation. Let me know if you need anything! 😊",
        invitation: "🎉 You're invited! Join us for an amazing event. Hope to see you there! 🎊"
    };

    // State Management
    let messageHistory = JSON.parse(localStorage.getItem('wabot_message_history') || '[]');
    let recentEmojis = JSON.parse(localStorage.getItem('wabot_recent_emojis') || '[]');

    // Initialize App
    initialize();

    function initialize() {
        setupEventListeners();
        renderEmojiGrid();
        updateMessagePreview();
        renderMessageHistory();
        setupPhoneInputFormatting();
        
        // Console greeting
        console.log('🚀 WABOT Sender initialized successfully!');
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Form submission
        senderForm.addEventListener('submit', handleFormSubmit);
        
        // Message input changes
        messageTextarea.addEventListener('input', handleMessageInput);
        phoneInput.addEventListener('input', handlePhoneInput);
        
        // Emoji search
        emojiSearch.addEventListener('input', handleEmojiSearch);
        
        // Template buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', handleTemplateClick);
        });
        
        // Clear history
        clearHistoryBtn.addEventListener('click', clearMessageHistory);
        
        // Phone input formatting
        phoneInput.addEventListener('input', formatPhoneNumber);
    }

    // Phone Input Formatting
    function setupPhoneInputFormatting() {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 2) {
                    value = value;
                } else if (value.length <= 5) {
                    value = value.substring(0, 2) + '-' + value.substring(2);
                } else if (value.length <= 9) {
                    value = value.substring(0, 2) + '-' + value.substring(2, 5) + ' ' + value.substring(5, 9);
                } else {
                    // Handle 10-11 digit numbers
                    value = value.substring(0, 2) + '-' + value.substring(2, 5) + ' ' + value.substring(5, 9) + value.substring(9, 11);
                }
            }
            e.target.value = value;
            updateMessagePreview();
        });
    }

    function formatPhoneNumber(e) {
        // This is handled by setupPhoneInputFormatting
        updateMessagePreview();
    }

    // Form Submission Handler
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const phone = phoneInput.value.trim();
        const message = messageTextarea.value.trim();
        
        if (!validateForm(phone, message)) {
            return;
        }

        try {
            setLoading(true);
            const result = await sendWhatsAppMessage(phone, message);
            
            if (result.success) {
                showToast('Message sent successfully! 🎉', 'success');
                addToHistory(phone, message, 'success');
                resetForm();
            } else {
                throw new Error(result.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Send error:', error);
            showToast(`Failed to send message: ${error.message}`, 'error');
            addToHistory(phone, message, 'error', error.message);
        } finally {
            setLoading(false);
        }
    }

    // Form Validation
    function validateForm(phone, message) {
        const errors = [];
        
        // Phone validation
        if (!phone) {
            errors.push('Phone number is required');
        } else {
            const digits = phone.replace(/\D/g, '');
            if (digits.length < 9 || digits.length > 11) {
                errors.push('Please enter a valid Malaysian phone number (9-11 digits)');
            } else if (!/^\d{2}-\d{3}\s\d{4,6}$/.test(phone) && !/^\d{9,11}$/.test(digits)) {
                errors.push('Please enter a valid Malaysian phone number format');
            }
        }
        
        // Message validation
        if (!message) {
            errors.push('Message is required');
        } else if (message.length > 1000) {
            errors.push('Message must be less than 1000 characters');
        }
        
        if (errors.length > 0) {
            showToast(errors.join('\n'), 'error');
            return false;
        }
        
        return true;
    }

    // WhatsApp API Integration
    async function sendWhatsAppMessage(phone, message) {
        // Format phone number for API (remove formatting, ensure it starts with 60)
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('60')) {
            formattedPhone = '60' + formattedPhone;
        }

        const payload = {
            number: parseInt(formattedPhone),
            type: "text",
            message: message,
            instance_id: API_CONFIG.instanceId,
            access_token: API_CONFIG.accessToken
        };

        try {
            const response = await fetch(API_CONFIG.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            
            if (response.ok && data.status === 'success') {
                return { success: true, data: data };
            } else {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error - please check your connection');
            }
            throw error;
        }
    }

    // UI State Management
    function setLoading(loading) {
        const buttonContent = sendButton.querySelector('.button-content');
        const loadingSpinner = sendButton.querySelector('.loading-spinner');
        
        if (loading) {
            sendButton.disabled = true;
            buttonContent.style.display = 'none';
            loadingSpinner.style.display = 'block';
        } else {
            sendButton.disabled = false;
            buttonContent.style.display = 'flex';
            loadingSpinner.style.display = 'none';
        }
    }

    // Message Input Handler
    function handleMessageInput(e) {
        const value = e.target.value;
        const count = value.length;
        
        // Update character counter
        charCount.textContent = count;
        charCount.style.color = count > 800 ? '#ff4757' : count > 600 ? '#ffa500' : '#888';
        
        // Update preview
        updateMessagePreview();
    }

    function handlePhoneInput() {
        updateMessagePreview();
    }

    // Message Preview Update
    function updateMessagePreview() {
        const message = messageTextarea.value || 'Your message will appear here...';
        const messageContent = previewBubble.querySelector('.message-content');
        const messageTime = previewBubble.querySelector('.message-time');
        
        messageContent.textContent = message;
        messageTime.textContent = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Trigger animation
        previewBubble.style.animation = 'none';
        previewBubble.offsetHeight; // Trigger reflow
        previewBubble.style.animation = 'message-appear 0.3s ease-out';
    }

    // Emoji Grid Rendering
    function renderEmojiGrid(filter = '') {
        emojiGrid.innerHTML = '';
        
        let emojisToShow = [];
        
        if (filter) {
            // Search in all categories
            Object.values(EMOJIS).flat().forEach(emoji => {
                if (typeof emoji === 'string' && emoji.includes(filter)) {
                    emojisToShow.push(emoji);
                }
            });
        } else {
            // Show popular emojis from different categories
            emojisToShow = [
                ...recentEmojis.slice(0, 6),
                ...EMOJIS.smileys.slice(0, 8),
                ...EMOJIS.gestures.slice(0, 6),
                ...EMOJIS.hearts.slice(0, 4),
                ...EMOJIS.symbols.slice(0, 6)
            ];
        }
        
        // Remove duplicates
        emojisToShow = [...new Set(emojisToShow)];
        
        emojisToShow.forEach(emoji => {
            if (emoji) {
                const emojiBtn = document.createElement('button');
                emojiBtn.type = 'button';
                emojiBtn.className = 'emoji-btn';
                emojiBtn.textContent = emoji;
                emojiBtn.addEventListener('click', () => insertEmoji(emoji));
                emojiGrid.appendChild(emojiBtn);
            }
        });
    }

    // Emoji Search Handler
    function handleEmojiSearch(e) {
        const filter = e.target.value.toLowerCase();
        renderEmojiGrid(filter);
    }

    // Insert Emoji
    function insertEmoji(emoji) {
        const start = messageTextarea.selectionStart;
        const end = messageTextarea.selectionEnd;
        const text = messageTextarea.value;
        
        messageTextarea.value = text.substring(0, start) + emoji + text.substring(end);
        messageTextarea.focus();
        
        // Update cursor position
        const newPosition = start + emoji.length;
        messageTextarea.setSelectionRange(newPosition, newPosition);
        
        // Add to recent emojis
        addToRecentEmojis(emoji);
        
        // Update preview and character count
        handleMessageInput({ target: messageTextarea });
    }

    // Recent Emojis Management
    function addToRecentEmojis(emoji) {
        recentEmojis = recentEmojis.filter(e => e !== emoji);
        recentEmojis.unshift(emoji);
        recentEmojis = recentEmojis.slice(0, 12); // Keep only 12 recent
        
        localStorage.setItem('wabot_recent_emojis', JSON.stringify(recentEmojis));
        renderEmojiGrid(); // Re-render to show updated recents
    }

    // Template Handler
    function handleTemplateClick(e) {
        const templateType = e.target.dataset.template;
        const template = MESSAGE_TEMPLATES[templateType];
        
        if (template) {
            messageTextarea.value = template;
            handleMessageInput({ target: messageTextarea });
            messageTextarea.focus();
            
            // Add ripple effect
            e.target.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.target.style.transform = '';
            }, 150);
        }
    }

    // Message History Management
    function addToHistory(phone, message, status, error = null) {
        const historyItem = {
            id: Date.now(),
            phone: phone,
            message: message,
            status: status,
            error: error,
            timestamp: new Date().toISOString()
        };
        
        messageHistory.unshift(historyItem);
        messageHistory = messageHistory.slice(0, 50); // Keep only 50 recent messages
        
        localStorage.setItem('wabot_message_history', JSON.stringify(messageHistory));
        renderMessageHistory();
    }

    function renderMessageHistory() {
        if (messageHistory.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <div class="empty-icon">📭</div>
                    <p>No messages sent yet</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = messageHistory.map(item => `
            <div class="history-item">
                <div class="history-meta">
                    <span class="history-number">+60${item.phone.replace(/\D/g, '')}</span>
                    <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <div class="history-message">${item.message}</div>
                <div class="history-status ${item.status === 'success' ? 'status-success' : 'status-error'}">
                    ${item.status === 'success' ? '✓ Delivered' : `✗ Failed: ${item.error || 'Unknown error'}`}
                </div>
            </div>
        `).join('');
    }

    function clearMessageHistory() {
        if (confirm('Are you sure you want to clear all message history?')) {
            messageHistory = [];
            localStorage.setItem('wabot_message_history', JSON.stringify(messageHistory));
            renderMessageHistory();
            showToast('Message history cleared', 'info');
        }
    }

    // Form Reset
    function resetForm() {
        phoneInput.value = '';
        messageTextarea.value = '';
        charCount.textContent = '0';
        updateMessagePreview();
    }

    // Toast Notifications
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'toast-slide-out 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
        
        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.animation = 'toast-slide-out 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to send
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !sendButton.disabled) {
            e.preventDefault();
            handleFormSubmit(e);
        }
        
        // Escape to clear form
        if (e.key === 'Escape' && document.activeElement !== emojiSearch) {
            resetForm();
        }
    });

    // Initialize background animations similar to landing page
    function createFloatingParticles() {
        const particleContainer = document.querySelector('.floating-particles');
        if (!particleContainer) return;

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = Math.random() * 3 + 1 + 'px';
            particle.style.height = particle.style.width;
            particle.style.backgroundColor = ['#00ffff', '#ff00ff', '#ffff00'][Math.floor(Math.random() * 3)];
            particle.style.borderRadius = '50%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.opacity = Math.random() * 0.4 + 0.1;
            particle.style.animation = `float ${Math.random() * 15 + 15}s linear infinite`;
            particle.style.animationDelay = Math.random() * 15 + 's';
            
            particleContainer.appendChild(particle);
        }
    }

    createFloatingParticles();

    // Console API for debugging
    window.wabotSender = {
        sendMessage: sendWhatsAppMessage,
        getHistory: () => messageHistory,
        clearHistory: clearMessageHistory,
        showToast: showToast
    };

    console.log('🎯 WABOT Sender API available as window.wabotSender');
});
