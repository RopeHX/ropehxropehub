// 💬 DM MANAGER - Real-time Direct Messages
class DMManager {
    constructor() {
        this.conversations = new Map();
        this.currentConversation = null;
        this.messageListeners = new Map();
    }

    init() {
        console.log('💬 DM Manager initializing...');
        this.setupEventListeners();
        console.log('✅ DM Manager initialized');
    }

    setupEventListeners() {
        // New DM button
        const newDmBtn = document.getElementById('newDmBtn');
        if (newDmBtn) {
            newDmBtn.addEventListener('click', () => this.showNewConversationModal());
        }

        // DM search
        const dmSearch = document.getElementById('dmSearch');
        if (dmSearch) {
            dmSearch.addEventListener('input', (e) => this.filterConversations(e.target.value));
        }
    }

    async loadConversations() {
        const currentUser = window.app?.authManager?.currentUser;
        if (!currentUser) return;

        try {
            const conversationsRef = window.firebaseServices.db
                .collection('conversations')
                .where('participants', 'array-contains', currentUser.uid)
                .orderBy('lastMessageTime', 'desc');

            // Listen for real-time updates
            conversationsRef.onSnapshot((snapshot) => {
                this.updateConversationsList(snapshot.docs);
            });

        } catch (error) {
            console.error('❌ Error loading conversations:', error);
            window.app?.authManager?.showToast('Fehler beim Laden der Konversationen', 'error');
        }
    }

    async updateConversationsList(docs) {
        const conversationsContainer = document.getElementById('dmConversations');
        if (!conversationsContainer) return;

        if (docs.length === 0) {
            conversationsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>Noch keine Konversationen</p>
                    <button onclick="window.app.dmManager.showNewConversationModal()" class="btn-primary">
                        Neue Nachricht
                    </button>
                </div>
            `;
            return;
        }

        const currentUserId = window.app?.authManager?.currentUser?.uid;
        const conversationsHTML = await Promise.all(docs.map(async (doc) => {
            const data = doc.data();
            const otherUserId = data.participants.find(id => id !== currentUserId);
            
            // Get other user's info
            const otherUserDoc = await window.firebaseServices.db
                .collection('users')
                .doc(otherUserId)
                .get();
            
            const otherUser = otherUserDoc.data() || {};
            const lastMessage = data.lastMessage || '';
            const lastMessageTime = data.lastMessageTime ? 
                window.Utils.formatTime(data.lastMessageTime) : '';

            return `
                <div class="dm-conversation ${this.currentConversation === doc.id ? 'active' : ''}" 
                     onclick="window.app.dmManager.openConversation('${doc.id}')">
                    <div class="conversation-avatar">
                        <img src="${otherUser.avatar || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%238b5cf6"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">${(otherUser.displayName || 'U').charAt(0).toUpperCase()}</text></svg>`}" 
                             alt="${otherUser.displayName || 'User'}">
                    </div>
                    <div class="conversation-info">
                        <div class="conversation-name">${otherUser.displayName || 'Unknown User'}</div>
                        <div class="conversation-preview">${lastMessage.substring(0, 50)}${lastMessage.length > 50 ? '...' : ''}</div>
                    </div>
                    <div class="conversation-time">${lastMessageTime}</div>
                </div>
            `;
        }));

        conversationsContainer.innerHTML = conversationsHTML.join('');
    }

    async openConversation(conversationId) {
        this.currentConversation = conversationId;
        
        // Update active state
        document.querySelectorAll('.dm-conversation').forEach(conv => {
            conv.classList.remove('active');
        });
        document.querySelector(`[onclick*="${conversationId}"]`)?.classList.add('active');

        const dmChat = document.getElementById('dmChat');
        if (!dmChat) return;

        try {
            // Get conversation data
            const conversationDoc = await window.firebaseServices.db
                .collection('conversations')
                .doc(conversationId)
                .get();
            
            const conversationData = conversationDoc.data();
            const currentUserId = window.app?.authManager?.currentUser?.uid;
            const otherUserId = conversationData.participants.find(id => id !== currentUserId);
            
            // Get other user info
            const otherUserDoc = await window.firebaseServices.db
                .collection('users')
                .doc(otherUserId)
                .get();
            
            const otherUser = otherUserDoc.data() || {};

            // Setup chat UI
            dmChat.innerHTML = `
                <div class="dm-chat-header">
                    <img src="${otherUser.avatar || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%238b5cf6"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">${(otherUser.displayName || 'U').charAt(0).toUpperCase()}</text></svg>`}" 
                         alt="${otherUser.displayName}" class="user-avatar">
                    <div>
                        <h3>${otherUser.displayName || 'Unknown User'}</h3>
                        <span class="user-status">${otherUser.status || 'offline'}</span>
                    </div>
                </div>
                <div class="dm-messages" id="dmMessages"></div>
                <div class="dm-input-container">
                    <div class="message-input-wrapper">
                        <input type="text" id="messageInput" placeholder="Nachricht schreiben..." 
                               onkeypress="if(event.key==='Enter') window.app.dmManager.sendMessage('${conversationId}')">
                        <button onclick="window.app.dmManager.sendMessage('${conversationId}')" class="btn-primary">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            `;

            // Load messages
            this.loadMessages(conversationId);

        } catch (error) {
            console.error('❌ Error opening conversation:', error);
            window.app?.authManager?.showToast('Fehler beim Öffnen der Konversation', 'error');
        }
    }

    loadMessages(conversationId) {
        const messagesRef = window.firebaseServices.db
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .limit(50);

        // Remove previous listener
        if (this.messageListeners.has(conversationId)) {
            this.messageListeners.get(conversationId)();
        }

        // Add new listener
        const unsubscribe = messagesRef.onSnapshot((snapshot) => {
            this.updateMessagesUI(snapshot.docs, conversationId);
        });

        this.messageListeners.set(conversationId, unsubscribe);
    }

    updateMessagesUI(docs, conversationId) {
        const messagesContainer = document.getElementById('dmMessages');
        if (!messagesContainer) return;

        const currentUserId = window.app?.authManager?.currentUser?.uid;
        
        const messagesHTML = docs.map(doc => {
            const message = doc.data();
            const isOwn = message.senderId === currentUserId;
            const time = message.timestamp ? window.Utils.formatTime(message.timestamp) : '';

            return `
                <div class="dm-message ${isOwn ? 'own' : ''}">
                    <div class="dm-message-bubble">
                        ${message.content}
                        <div class="dm-message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');

        messagesContainer.innerHTML = messagesHTML;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async sendMessage(conversationId) {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        const content = messageInput.value.trim();
        if (!content) return;

        const currentUser = window.app?.authManager?.currentUser;
        if (!currentUser) return;

        try {
            // Add message to conversation
            await window.firebaseServices.db
                .collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .add({
                    content,
                    senderId: currentUser.uid,
                    senderName: window.app.authManager.userDoc?.displayName || 'Anonymous',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Update conversation last message
            await window.firebaseServices.db
                .collection('conversations')
                .doc(conversationId)
                .update({
                    lastMessage: content,
                    lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
                });

            messageInput.value = '';

        } catch (error) {
            console.error('❌ Error sending message:', error);
            window.app?.authManager?.showToast('Fehler beim Senden der Nachricht', 'error');
        }
    }

    showNewConversationModal() {
        const modalContent = `
            <div class="new-conversation-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-plus"></i> Neue Konversation</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="text" id="userSearchInput" placeholder="Benutzername oder E-Mail eingeben..." class="search-input">
                    <div id="userSearchResults" class="user-search-results"></div>
                </div>
            </div>
        `;

        window.app?.uiManager?.showModal(modalContent);

        // Setup search
        const searchInput = document.getElementById('userSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', window.Utils.debounce((e) => {
                this.searchUsers(e.target.value);
            }, 300));
        }
    }

    async searchUsers(query) {
        if (!query || query.length < 2) {
            document.getElementById('userSearchResults').innerHTML = '';
            return;
        }

        try {
            const usersRef = window.firebaseServices.db.collection('users');
            const snapshot = await usersRef
                .where('displayName', '>=', query)
                .where('displayName', '<=', query + '\uf8ff')
                .limit(10)
                .get();

            const currentUserId = window.app?.authManager?.currentUser?.uid;
            const results = snapshot.docs
                .filter(doc => doc.id !== currentUserId)
                .map(doc => {
                    const user = doc.data();
                    return `
                        <div class="user-search-result" onclick="window.app.dmManager.startConversation('${doc.id}')">
                            <img src="${user.avatar || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%238b5cf6"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">${(user.displayName || 'U').charAt(0).toUpperCase()}</text></svg>`}" 
                                 alt="${user.displayName}" class="user-avatar">
                            <div>
                                <div class="user-name">${user.displayName}</div>
                                <div class="user-username">@${user.username || user.displayName?.toLowerCase()}</div>
                            </div>
                        </div>
                    `;
                }).join('');

            document.getElementById('userSearchResults').innerHTML = results || '<p>Keine Benutzer gefunden</p>';

        } catch (error) {
            console.error('❌ Error searching users:', error);
        }
    }

    async startConversation(userId) {
        const currentUserId = window.app?.authManager?.currentUser?.uid;
        if (!currentUserId) return;

        try {
            // Check if conversation already exists
            const existingConversation = await window.firebaseServices.db
                .collection('conversations')
                .where('participants', 'array-contains', currentUserId)
                .get();

            let conversationId = null;

            for (const doc of existingConversation.docs) {
                const data = doc.data();
                if (data.participants.includes(userId) && data.participants.length === 2) {
                    conversationId = doc.id;
                    break;
                }
            }

            // Create new conversation if doesn't exist
            if (!conversationId) {
                const newConversation = await window.firebaseServices.db
                    .collection('conversations')
                    .add({
                        participants: [currentUserId, userId],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastMessage: '',
                        lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
                    });
                conversationId = newConversation.id;
            }

            // Close modal and open conversation
            document.querySelector('.modal-overlay')?.remove();
            this.openConversation(conversationId);

        } catch (error) {
            console.error('❌ Error starting conversation:', error);
            window.app?.authManager?.showToast('Fehler beim Starten der Konversation', 'error');
        }
    }

    filterConversations(query) {
        const conversations = document.querySelectorAll('.dm-conversation');
        conversations.forEach(conv => {
            const name = conv.querySelector('.conversation-name')?.textContent.toLowerCase() || '';
            const preview = conv.querySelector('.conversation-preview')?.textContent.toLowerCase() || '';
            
            if (name.includes(query.toLowerCase()) || preview.includes(query.toLowerCase())) {
                conv.style.display = 'block';
            } else {
                conv.style.display = 'none';
            }
        });
    }

    cleanup() {
        // Remove all message listeners
        this.messageListeners.forEach(unsubscribe => unsubscribe());
        this.messageListeners.clear();
    }
}

window.DMManager = DMManager;
console.log('💬 DMManager loaded');

