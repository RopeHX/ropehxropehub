class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createNotificationBell();
        this.loadNotifications();
        this.setupRealtimeListener();
    }

    createNotificationBell() {
        const header = document.querySelector('.header-actions') || document.querySelector('header');
        if (!header) return;

        const bellHTML = `
            <div class="notification-bell-container">
                <button class="notification-bell" onclick="window.app.notificationManager.toggleNotifications()">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge" style="display: none;">0</span>
                </button>
                <div class="notification-dropdown" id="notificationDropdown" style="display: none;">
                    <div class="notification-header">
                        <h3>Benachrichtigungen</h3>
                        <button class="mark-all-read" onclick="window.app.notificationManager.markAllAsRead()">
                            <i class="fas fa-check-double"></i> Alle als gelesen markieren
                        </button>
                    </div>
                    <div class="notification-list" id="notificationList">
                        <div class="loading">Lade Benachrichtigungen...</div>
                    </div>
                </div>
            </div>
        `;

        header.insertAdjacentHTML('beforeend', bellHTML);
    }

    async loadNotifications() {
        const currentUserId = window.app?.authManager?.currentUser?.uid;
        if (!currentUserId) return;

        try {
            // Freundschaftsanfragen als Benachrichtigungen laden
            const userDoc = await window.firebaseServices.db.collection('users').doc(currentUserId).get();
            const userData = userDoc.data() || {};
            
            const receivedRequests = userData.friendRequestsReceived || [];
            const sentRequests = userData.friendRequestsSent || [];

            // Empfangene Anfragen zu Benachrichtigungen konvertieren
            const friendRequestNotifications = await Promise.all(
                receivedRequests.map(async (userId) => {
                    const userDoc = await window.firebaseServices.db.collection('users').doc(userId).get();
                    const user = userDoc.data();
                    
                    return {
                        id: `friend_request_${userId}`,
                        type: 'friend_request_received',
                        fromUserId: userId,
                        fromUser: user,
                        timestamp: new Date(),
                        read: false,
                        data: { userId }
                    };
                })
            );

            // Gesendete Anfragen (optional)
            const sentRequestNotifications = await Promise.all(
                sentRequests.map(async (userId) => {
                    const userDoc = await window.firebaseServices.db.collection('users').doc(userId).get();
                    const user = userDoc.data();
                    
                    return {
                        id: `friend_request_sent_${userId}`,
                        type: 'friend_request_sent',
                        toUserId: userId,
                        toUser: user,
                        timestamp: new Date(),
                        read: true,
                        data: { userId }
                    };
                })
            );

            this.notifications = [...friendRequestNotifications, ...sentRequestNotifications];
            this.updateUnreadCount();
            this.renderNotifications();

        } catch (error) {
            console.error('❌ Fehler beim Laden der Benachrichtigungen:', error);
        }
    }

    renderNotifications() {
        const container = document.getElementById('notificationList');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <h4>Keine Benachrichtigungen</h4>
                    <p>Du hast alle Benachrichtigungen gelesen</p>
                </div>
            `;
            return;
        }

        const html = this.notifications
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(notification => this.renderNotificationItem(notification))
            .join('');

        container.innerHTML = html;
    }

    renderNotificationItem(notification) {
        const timeAgo = this.getTimeAgo(notification.timestamp);
        
        switch (notification.type) {
            case 'friend_request_received':
                return this.renderFriendRequestNotification(notification, timeAgo);
            case 'friend_request_sent':
                return this.renderSentRequestNotification(notification, timeAgo);
            default:
                return '';
        }
    }

    renderFriendRequestNotification(notification, timeAgo) {
        const user = notification.fromUser;
        const avatar = user?.avatar || this.generateAvatarSVG(user?.displayName);
        
        return `
            <div class="notification-item friend-request-notification ${notification.read ? 'read' : 'unread'}" 
                 data-id="${notification.id}">
                <div class="notification-avatar" onclick="window.app.feedManager.openUserProfile('${user.id}')">
                    <img src="${avatar}" alt="${user?.displayName}" onerror="this.src='${this.generateAvatarSVG(user?.displayName)}'">
                    <div class="notification-type-icon friend-request">
                        <i class="fas fa-user-plus"></i>
                    </div>
                </div>
                
                <div class="notification-content">
                    <div class="notification-header">
                        <span class="notification-user" onclick="window.app.feedManager.openUserProfile('${user.id}')">
                            <strong>@${user?.username || 'user'}</strong>
                        </span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    
                    <div class="notification-message">
                        <i class="fas fa-user-plus text-primary"></i>
                        hat dir eine Freundschaftsanfrage geschickt
                    </div>
                    
                    <div class="notification-user-info" onclick="window.app.feedManager.openUserProfile('${user.id}')">
                        <div class="user-display-name">${user?.displayName || 'Unbekannt'}</div>
                        <div class="user-username">@${user?.username || 'user'}</div>
                        ${user?.bio ? `<div class="user-bio">${user.bio.substring(0, 60)}${user.bio.length > 60 ? '...' : ''}</div>` : ''}
                    </div>
                    
                    <div class="notification-actions">
                        <button class="btn btn-success btn-sm" 
                                onclick="window.app.notificationManager.acceptFriendRequest('${user.id}', '${notification.id}')">
                            <i class="fas fa-check"></i> Annehmen
                        </button>
                        <button class="btn btn-danger btn-sm" 
                                onclick="window.app.notificationManager.declineFriendRequest('${user.id}', '${notification.id}')">
                            <i class="fas fa-times"></i> Ablehnen
                        </button>
                    </div>
                </div>
                
                ${!notification.read ? '<div class="unread-indicator"></div>' : ''}
            </div>
        `;
    }

    renderSentRequestNotification(notification, timeAgo) {
        const user = notification.toUser;
        const avatar = user?.avatar || this.generateAvatarSVG(user?.displayName);
        
        return `
            <div class="notification-item sent-request-notification read" data-id="${notification.id}">
                <div class="notification-avatar" onclick="window.app.feedManager.openUserProfile('${user.id}')">
                    <img src="${avatar}" alt="${user?.displayName}" onerror="this.src='${this.generateAvatarSVG(user?.displayName)}'">
                    <div class="notification-type-icon sent-request">
                        <i class="fas fa-paper-plane"></i>
                    </div>
                </div>
                
                <div class="notification-content">
                    <div class="notification-header">
                        <span class="notification-user" onclick="window.app.feedManager.openUserProfile('${user.id}')">
                            <strong>@${user?.username || 'user'}</strong>
                        </span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    
                    <div class="notification-message">
                        <i class="fas fa-clock text-warning"></i>
                        Du hast eine Freundschaftsanfrage gesendet – warte auf Antwort
                    </div>
                    
                    <div class="notification-user-info" onclick="window.app.feedManager.openUserProfile('${user.id}')">
                        <div class="user-display-name">${user?.displayName || 'Unbekannt'}</div>
                        <div class="user-username">@${user?.username || 'user'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    async acceptFriendRequest(userId, notificationId) {
        try {
            await window.app.friendsManager.acceptFriendRequest(userId);
            this.removeNotification(notificationId);
            window.app?.authManager?.showToast('Freundschaftsanfrage angenommen! 🎉', 'success');
        } catch (error) {
            console.error('❌ Fehler beim Annehmen:', error);
        }
    }

    async declineFriendRequest(userId, notificationId) {
        try {
            await window.app.friendsManager.declineFriendRequest(userId);
            this.removeNotification(notificationId);
            window.app?.authManager?.showToast('Freundschaftsanfrage abgelehnt', 'info');
        } catch (error) {
            console.error('❌ Fehler beim Ablehnen:', error);
        }
    }

    removeNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.updateUnreadCount();
        this.renderNotifications();
    }

    toggleNotifications() {
        const dropdown = document.getElementById('notificationDropdown');
        if (!dropdown) return;

        this.isOpen = !this.isOpen;
        dropdown.style.display = this.isOpen ? 'block' : 'none';

        if (this.isOpen) {
            this.loadNotifications();
        }
    }

    updateUnreadCount() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notification-badge');
        
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }

        // Roten Punkt bei der Glocke anzeigen
        const bell = document.querySelector('.notification-bell');
        if (bell) {
            bell.classList.toggle('has-unread', unreadCount > 0);
        }
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return 'gerade eben';
        if (diffInSeconds < 3600) return `vor ${Math.floor(diffInSeconds / 60)} Min`;
        if (diffInSeconds < 86400) return `vor ${Math.floor(diffInSeconds / 3600)} Std`;
        return `vor ${Math.floor(diffInSeconds / 86400)} Tagen`;
    }

    generateAvatarSVG(name) {
        const initial = (name || 'U').charAt(0).toUpperCase();
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="#007bff"/>
                <text x="20" y="28" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${initial}</text>
            </svg>
        `)}`;
    }

    setupRealtimeListener() {
        // Hier könntest du einen Firestore-Listener einrichten
        // um neue Freundschaftsanfragen in Echtzeit zu erhalten
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateUnreadCount();
        this.renderNotifications();
    }
}
