// 👥 FRIENDS MANAGER - Vollständiges Freunde-System
class FriendsManager {
    constructor() {
        this.friends = [];
        this.pendingRequests = [];
        this.sentRequests = [];
        this.currentTab = 'all';
    }

    init() {
        console.log('👥 Freunde-Manager wird initialisiert...');
        this.setupEventListeners();
        // loadFriends() wird erst nach Login aufgerufen
        console.log('✅ Freunde-Manager initialisiert');
    }

    setupEventListeners() {
        // Freund hinzufügen Button
        const addFriendBtn = document.getElementById('addFriendBtn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => this.showAddFriendModal());
        }

        // Freunde-Tabs
        document.querySelectorAll('.friends-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tab) {
        console.log('🔄 Switching to tab:', tab);
        this.currentTab = tab;
        
        // Alle Tab-Buttons aktualisieren
        document.querySelectorAll('.friends-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Aktiven Tab markieren
        const activeTab = document.querySelector(`.friends-tab[onclick*="'${tab}'"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Alle Listen verstecken
        document.querySelectorAll('.friends-list').forEach(list => {
            list.classList.remove('active');
            list.classList.add('hidden');
            list.style.display = 'none'; // Explizit verstecken
        });
        
        // Aktive Liste anzeigen
        const activeList = document.getElementById(`${tab}FriendsList`) || 
                          document.getElementById(`pendingRequestsList`);
        
        if (activeList) {
            activeList.classList.add('active');
            activeList.classList.remove('hidden');
            activeList.style.display = 'block'; // Explizit anzeigen
            console.log('✅ Showing list:', activeList.id);
        }
        
        // Render basierend auf Tab
        this.renderFriends();
    }

    async loadFriends() {
        console.log('🔄 === FREUNDE LADEN GESTARTET ===');
        
        const currentUserId = window.app?.authManager?.currentUser?.uid;
        if (!currentUserId) {
            console.log('❌ Kein User eingeloggt');
            return;
        }

        try {
            console.log('👤 Lade User-Daten für:', currentUserId);
            
            const userDoc = await window.firebaseServices.db.collection('users').doc(currentUserId).get();
            if (!userDoc.exists) {
                console.log('❌ User-Dokument existiert nicht');
                return;
            }

            const userData = userDoc.data();
            console.log('📊 User Data:', userData);
            
            const friendIds = userData.friends || [];
            const pendingIds = userData.friendRequestsReceived || [];
            const sentIds = userData.friendRequestsSent || [];
            
            console.log('👥 Friend IDs:', friendIds);
            console.log('⏳ Pending IDs:', pendingIds);
            console.log('📤 Sent IDs:', sentIds);

            // Freunde-Daten laden
            this.friends = await this.loadUsersByIds(friendIds);
            
            // Ausstehende Anfragen laden (empfangen)
            this.pendingRequests = await this.loadUsersByIds(pendingIds);
            
            // Gesendete Anfragen laden
            this.sentRequests = await this.loadUsersByIds(sentIds);

            console.log('✅ Alle Daten geladen:', {
                friends: this.friends.length,
                pending: this.pendingRequests.length,
                sent: this.sentRequests.length
            });

            // UI rendern
            this.renderFriends();

        } catch (error) {
            console.error('❌ Fehler beim Laden der Freunde:', error);
        }
    }

    async loadUsersByIds(userIds) {
        console.log('👥 === LOAD USERS BY IDS ===');
        console.log('📋 User IDs:', userIds);
        
        if (!userIds || userIds.length === 0) {
            console.log('📭 Keine User IDs vorhanden');
            return [];
        }

        try {
            console.log('🔄 Lade User-Daten für', userIds.length, 'User...');
            
            const userPromises = userIds.map(async (userId) => {
                console.log('👤 Lade User:', userId);
                
                const userDoc = await window.firebaseServices.db
                    .collection('users')
                    .doc(userId)
                    .get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log('✅ User geladen:', userData.displayName, userData);
                    return { 
                        id: userId, 
                        displayName: userData.displayName || 'Unbekannt',
                        username: userData.username || userData.displayName?.toLowerCase() || 'user',
                        avatar: userData.avatar || null,
                        bio: userData.bio || '',
                        status: userData.status || 'offline'
                    };
                } else {
                    console.warn(`⚠️ User ${userId} nicht gefunden`);
                    return null;
                }
            });

            const users = await Promise.all(userPromises);
            const validUsers = users.filter(user => user !== null);
            
            console.log('✅ Geladene User:', validUsers);
            return validUsers;
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der User-Daten:', error);
            return [];
        }
    }

    updateTabCounts() {
        const onlineCount = this.friends?.filter(f => f.status === 'online').length || 0;
        const pendingCount = (this.pendingRequests?.length || 0) + (this.sentRequests?.length || 0);
        
        // Tab-Counts aktualisieren
        const allTab = document.querySelector('.friends-tab[onclick*="all"] .tab-count');
        const onlineTab = document.querySelector('.friends-tab[onclick*="online"] .tab-count');
        const pendingTab = document.querySelector('.friends-tab[onclick*="pending"] .tab-count');
        
        if (allTab) allTab.textContent = this.friends?.length || 0;
        if (onlineTab) onlineTab.textContent = onlineCount;
        if (pendingTab) pendingTab.textContent = pendingCount;
    }

    loadTabContent(tabName) {
        switch (tabName) {
            case 'all':
                this.renderAllFriends();
                break;
            case 'online':
                this.renderOnlineFriends();
                break;
            case 'pending':
                this.renderPendingRequests();
                break;
        }
    }

    renderFriends() {
        console.log('🎨 === RENDER FRIENDS GESTARTET ===');
        console.log('📊 Current Tab:', this.currentTab);
        console.log('📊 Data:', {
            friends: this.friends?.length || 0,
            pending: this.pendingRequests?.length || 0,
            sent: this.sentRequests?.length || 0
        });
        
        // Container prüfen
        const allContainer = document.getElementById('allFriendsList');
        const onlineContainer = document.getElementById('onlineFriendsList');
        const pendingContainer = document.getElementById('pendingRequestsList');
        
        console.log('📦 Container Check:', {
            all: !!allContainer,
            online: !!onlineContainer,
            pending: !!pendingContainer
        });
        
        if (!allContainer || !onlineContainer || !pendingContainer) {
            console.log('❌ Container fehlen! Erstelle sie...');
            this.createFriendsContainers();
            return;
        }

        // Tab-Counts aktualisieren
        this.updateTabCounts();

        // Render basierend auf aktuellem Tab
        switch (this.currentTab) {
            case 'all':
                console.log('🎨 Rendering ALL friends...');
                this.renderAllFriends();
                break;
            case 'online':
                console.log('🎨 Rendering ONLINE friends...');
                this.renderOnlineFriends();
                break;
            case 'pending':
                console.log('🎨 Rendering PENDING requests...');
                this.renderPendingRequests();
                break;
            default:
                console.log('🎨 Rendering DEFAULT (all) friends...');
                this.renderAllFriends();
        }
        
        console.log('✅ Render abgeschlossen');
    }

    renderAllFriends() {
        console.log('👥 === RENDER ALL FRIENDS ===');
        const container = document.getElementById('allFriendsList');
        if (!container) {
            console.log('❌ allFriendsList Container nicht gefunden!');
            return;
        }

        console.log('📊 Friends Array:', this.friends);

        if (!this.friends || this.friends.length === 0) {
            console.log('📭 Keine Freunde vorhanden');
            container.innerHTML = `
                <div class="empty-friends-state">
                    <i class="fas fa-users"></i>
                    <h3 data-i18n="no_friends_yet">${window.i18n.t('no_friends_yet')}</h3>
                    <p data-i18n="add_friends_to_chat">${window.i18n.t('add_friends_to_chat')}</p>
                    <button onclick="window.app.friendsManager.showAddFriendModal()" class="btn-primary">
                        <i class="fas fa-user-plus"></i> <span data-i18n="add_friends_button">${window.i18n.t('add_friends_button')}</span>
                    </button>
                </div>
            `;
            return;
        }

        console.log('✅ Rendering', this.friends.length, 'Freunde');
        container.innerHTML = this.friends.map(friend => this.renderFriendItem(friend)).join('');
    }

    renderOnlineFriends() {
        const container = document.getElementById('onlineFriendsList');
        if (!container) return;

        const onlineFriends = this.friends.filter(friend => friend.status === 'online');

        if (onlineFriends.length === 0) {
            container.innerHTML = `
                <div class="empty-friends-state">
                    <i class="fas fa-circle"></i>
                    <h3 data-i18n="no_friends_online">${window.i18n.t('no_friends_online')}</h3>
                    <p data-i18n="friends_not_online">${window.i18n.t('friends_not_online')}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = onlineFriends.map(friend => this.renderFriendItem(friend)).join('');
    }

    renderPendingRequests() {
        console.log('⏳ === RENDER PENDING REQUESTS ===');
        const container = document.getElementById('pendingRequestsList');
        if (!container) {
            console.log('❌ pendingRequestsList Container nicht gefunden!');
            return;
        }

        // Container-Styles explizit setzen
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.style.height = 'auto';
        container.style.maxHeight = 'none';
        container.style.overflow = 'visible';
        container.style.position = 'relative';
        container.style.zIndex = '1';

        const totalPending = (this.pendingRequests?.length || 0) + (this.sentRequests?.length || 0);
        console.log('📊 Pending Data:', {
            received: this.pendingRequests?.length || 0,
            sent: this.sentRequests?.length || 0,
            total: totalPending
        });

        if (totalPending === 0) {
            console.log('📭 Keine ausstehenden Anfragen');
            container.innerHTML = `
                <div class="empty-friends-state" style="padding: 40px; text-align: center; color: white;">
                    <i class="fas fa-clock" style="font-size: 48px; margin-bottom: 20px; color: #666;"></i>
                    <h3 data-i18n="no_pending_requests">${window.i18n.t('no_pending_requests')}</h3>
                    <p data-i18n="no_open_requests">${window.i18n.t('no_open_requests')}</p>
                </div>
            `;
            return;
        }

        let html = '';

        // 📨 A) EMPFANGENE Anfragen
        if (this.pendingRequests?.length > 0) {
            console.log('📨 Rendering', this.pendingRequests.length, 'empfangene Anfragen');
            html += `
                <div class="pending-section received-section" style="margin-bottom: 30px;">
                    <h4 class="pending-section-title" style="color: white; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-inbox" style="color: #28a745;"></i> 
                        <span data-i18n="received_requests">Empfangene Anfragen</span> 
                        <span class="count-badge received" style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${this.pendingRequests.length}</span>
                    </h4>
                    <div class="pending-requests-list">
                        ${this.pendingRequests.map(request => this.renderReceivedRequestItem(request)).join('')}
                    </div>
                </div>
            `;
        }

        // 🛎️ B) GESENDETE Anfragen
        if (this.sentRequests?.length > 0) {
            console.log('📤 Rendering', this.sentRequests.length, 'gesendete Anfragen');
            
            const requestItems = this.sentRequests.map(request => {
                const item = this.renderSentRequestItem(request);
                console.log('📤 Generated HTML for', request.displayName, ':', item.substring(0, 100) + '...');
                return item;
            });
            
            html += `
                <div class="pending-section sent-section" style="margin-bottom: 30px;">
                    <h4 class="pending-section-title" style="color: white; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-paper-plane" style="color: #ffc107;"></i> 
                        <span data-i18n="sent_requests">Gesendete Anfragen</span> 
                        <span class="count-badge sent" style="background: #ffc107; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${this.sentRequests.length}</span>
                    </h4>
                    <div class="pending-requests-list">
                        ${requestItems.join('')}
                    </div>
                </div>
            `;
        }

        console.log('✅ Final HTML length:', html.length);
        console.log('✅ Final HTML preview:', html.substring(0, 200) + '...');
        console.log('✅ Setting HTML for pending requests');
        
        container.innerHTML = html;
        
        // Prüfen ob HTML korrekt gesetzt wurde
        setTimeout(() => {
            console.log('🔍 Container content after setting:', container.innerHTML.length, 'characters');
            console.log('🔍 Container children:', container.children.length);
            console.log('🔍 Container styles:', {
                display: container.style.display,
                visibility: container.style.visibility,
                height: container.style.height,
                overflow: container.style.overflow
            });
            
            // Force repaint
            container.style.transform = 'translateZ(0)';
            setTimeout(() => {
                container.style.transform = '';
            }, 10);
        }, 100);
    }

    renderFriendItem(friend) {
        const isOnline = friend.status === 'online';
        const avatar = friend.avatar || this.generateAvatarSVG(friend.displayName);

        return `
            <div class="friend-item">
                <div class="friend-avatar">
                    <img src="${avatar}" alt="${friend.displayName}">
                    <div class="friend-status-dot ${isOnline ? 'online' : 'offline'}"></div>
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.displayName || window.i18n.t('anonymous')}</div>
                    <div class="friend-username">@${friend.username || friend.displayName?.toLowerCase() || window.i18n.t('user')}</div>
                    <div class="friend-status">
                        <i class="fas fa-circle ${isOnline ? 'text-success' : 'text-muted'}"></i>
                        ${isOnline ? window.i18n.t('online') : 'Offline'}
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-primary" onclick="window.app.dmManager.startConversation('${friend.id}')" data-i18n-title="send_message" title="${window.i18n.t('send_message')}">
                        <i class="fas fa-comment"></i> <span>Nachricht</span>
                    </button>
                    <button class="btn btn-outline" onclick="window.app.feedManager.openUserProfile('${friend.id}')" data-i18n-title="view_profile" title="${window.i18n.t('view_profile')}">
                        <i class="fas fa-user"></i>
                    </button>
                    <button class="btn btn-danger" onclick="window.app.friendsManager.removeFriend('${friend.id}')" data-i18n-title="remove_friend" title="${window.i18n.t('remove_friend')}">
                        <i class="fas fa-user-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderReceivedRequestItem(request) {
        console.log('📨 Rendering received request:', request);
        
        // Avatar mit korrektem Fallback
        let avatar;
        if (request.avatar && (request.avatar.startsWith('http') || request.avatar.startsWith('data:image'))) {
            avatar = request.avatar;
        } else {
            avatar = this.generateAvatarSVG(request.displayName);
        }

        return `
            <div class="friend-request-card received-request">
                <div class="received-request-header">
                    <p class="received-request-info">
                        <i class="fas fa-inbox" style="color: #28a745; margin-right: 8px;"></i>
                        <strong>@${request.username || 'user'}</strong> möchte mit dir befreundet sein
                    </p>
                </div>
                
                <div class="request-header" onclick="window.app.feedManager.openUserProfile('${request.id}')">
                    <div class="request-avatar">
                        <img src="${avatar}" alt="${request.displayName}" onerror="this.src='${this.generateAvatarSVG(request.displayName)}'">
                        <div class="request-type-indicator received">
                            <i class="fas fa-arrow-down" style="color: #28a745;"></i>
                        </div>
                    </div>
                    <div class="request-info">
                        <h4 class="request-name">${request.displayName || 'Unbekannt'}</h4>
                        <p class="request-username">@${request.username || 'user'}</p>
                        ${request.bio ? `<p class="request-bio">${request.bio.substring(0, 100)}${request.bio.length > 100 ? '...' : ''}</p>` : ''}
                        <div class="request-status received">
                            <i class="fas fa-user-plus" style="color: #28a745;"></i>
                            <span>Freundschaftsanfrage</span>
                        </div>
                    </div>
                </div>
                <div class="request-actions received-actions">
                    <button class="btn btn-success request-accept-btn" 
                            onclick="window.app.friendsManager.acceptFriendRequest('${request.id}')" 
                            title="Annehmen">
                        <i class="fas fa-check"></i> 
                        <span>Annehmen</span>
                    </button>
                    <button class="btn btn-danger request-decline-btn" 
                            onclick="window.app.friendsManager.declineFriendRequest('${request.id}')" 
                            title="Ablehnen">
                        <i class="fas fa-times"></i> 
                        <span>Ablehnen</span>
                    </button>
                </div>
            </div>
        `;
    }

    renderSentRequestItem(request) {
        console.log('📤 Rendering sent request:', request.displayName);
        
        // Avatar mit korrektem Fallback
        let avatar;
        if (request.avatar && (request.avatar.startsWith('http') || request.avatar.startsWith('data:image'))) {
            avatar = request.avatar;
        } else {
            avatar = this.generateAvatarSVG(request.displayName);
        }

        const html = `
            <div class="friend-request-card sent-request" style="background: #2a2a2a; border: 1px solid #444; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                <div class="sent-request-header">
                    <p class="sent-request-info" style="margin: 0 0 12px 0; color: #ffc107;">
                        <i class="fas fa-paper-plane" style="color: #ffc107; margin-right: 8px;"></i>
                        Du hast eine Anfrage an <strong>@${request.username || 'user'}</strong> gesendet
                    </p>
                </div>
                
                <div class="request-header" style="display: flex; align-items: center; gap: 12px; cursor: pointer; margin-bottom: 12px;" onclick="window.app.feedManager.openUserProfile('${request.id}')">
                    <div class="request-avatar" style="position: relative; width: 50px; height: 50px;">
                        <img src="${avatar}" alt="${request.displayName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.src='${this.generateAvatarSVG(request.displayName)}'">
                        <div class="request-type-indicator sent" style="position: absolute; bottom: -2px; right: -2px; width: 20px; height: 20px; border-radius: 50%; background: #2a2a2a; display: flex; align-items: center; justify-content: center; border: 2px solid #2a2a2a;">
                            <i class="fas fa-arrow-up" style="color: #ffc107; font-size: 10px;"></i>
                        </div>
                    </div>
                    <div class="request-info" style="flex: 1;">
                        <h4 class="request-name" style="margin: 0; color: white; font-size: 1.1rem;">${request.displayName || 'Unbekannt'}</h4>
                        <p class="request-username" style="margin: 2px 0; color: #888; font-size: 0.9rem;">@${request.username || 'user'}</p>
                        ${request.bio ? `<p class="request-bio" style="margin: 4px 0; color: #aaa; font-size: 0.85rem; line-height: 1.4;">${request.bio.substring(0, 100)}${request.bio.length > 100 ? '...' : ''}</p>` : ''}
                        <div class="request-status sent" style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; margin-top: 8px; color: #ffc107;">
                            <i class="fas fa-clock" style="color: #ffc107;"></i>
                            <span>Wartet auf Antwort</span>
                        </div>
                    </div>
                </div>
                <div class="request-actions sent-actions" style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn btn-outline request-withdraw-btn" 
                            onclick="window.app.friendsManager.cancelFriendRequest('${request.id}')" 
                            title="Anfrage zurückziehen"
                            style="padding: 8px 16px; border: 1px solid #666; background: transparent; color: #ccc; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-times"></i> 
                        <span>Anfrage zurückziehen</span>
                    </button>
                </div>
            </div>
        `;
        
        console.log('📤 Generated HTML for', request.displayName, '- Length:', html.length);
        return html;
    }

    showAddFriendModal() {
        console.log('🔍 ===== NEUE MODAL-FUNKTION GESTARTET =====');
        
        // Alle alten Modals entfernen
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.remove());
        
        // Neues Modal HTML - komplett neu
        const modalHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
                <div class="modal-content add-friend-modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-user-plus"></i> Freunde hinzufügen</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="search-section">
                            <label>Benutzer suchen:</label>
                            <div style="position: relative;">
                                <input type="text" 
                                       id="liveUserSearch" 
                                       placeholder="Tippe einen Namen oder @username..." 
                                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                <i class="fas fa-search" style="position: absolute; right: 10px; top: 12px; color: #666;"></i>
                            </div>
                            <small style="color: #666; margin-top: 5px; display: block;">
                                Suche nach Anzeigename oder @username (z.B. "maxmustermann" oder "@maxmustermann")
                            </small>
                        </div>
                        <div id="liveSearchResults" style="margin-top: 15px; max-height: 400px; overflow-y: auto;">
                            <div style="padding: 20px; text-align: center; color: #666;">
                                <i class="fas fa-search" style="font-size: 24px; margin-bottom: 10px;"></i>
                                <p>Tippe einen Namen ein, um zu suchen...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Modal direkt zum Body hinzufügen (nicht über UIManager)
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event Listener sofort einrichten
        const searchInput = document.getElementById('liveUserSearch');
        const resultsContainer = document.getElementById('liveSearchResults');
        
        console.log('🔍 Search Input:', searchInput);
        console.log('🔍 Results Container:', resultsContainer);
        
        if (searchInput && resultsContainer) {
            console.log('✅ Event Listener werden eingerichtet...');
            
            // Live-Suche mit Debounce
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                console.log('🔍 Input Event - Query:', query);
                
                clearTimeout(searchTimeout);
                
                if (query.length === 0) {
                    resultsContainer.innerHTML = `
                        <div style="padding: 20px; text-align: center; color: #666;">
                            <i class="fas fa-search" style="font-size: 24px; margin-bottom: 10px;"></i>
                            <p>Tippe einen Namen ein, um zu suchen...</p>
                        </div>
                    `;
                    return;
                }
                
                if (query.length >= 1) {
                    searchTimeout = setTimeout(() => {
                        console.log('🔍 Starte Live-Suche für:', query);
                        this.performLiveSearch(query, resultsContainer);
                    }, 300);
                }
            });
            
            // Enter-Taste
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = e.target.value.trim();
                    if (query.length >= 1) {
                        console.log('🔍 Enter - Starte Suche für:', query);
                        this.performLiveSearch(query, resultsContainer);
                    }
                }
            });
            
            // Auto-Focus
            searchInput.focus();
            console.log('✅ Modal setup komplett');
        } else {
            console.error('❌ Search Input oder Results Container nicht gefunden!');
        }
    }

    async performLiveSearch(query, resultsContainer) {
        console.log('🔍 ===== LIVE SEARCH GESTARTET =====');
        console.log('🔍 Query:', query);
        
        // Loading anzeigen
        resultsContainer.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 20px; margin-bottom: 10px;"></i>
                <p>Suche nach "${query}"...</p>
            </div>
        `;
        
        try {
            const currentUserId = window.app?.authManager?.currentUser?.uid;
            if (!currentUserId) {
                resultsContainer.innerHTML = `<div style="padding: 20px; color: red;">Nicht angemeldet</div>`;
                return;
            }
            
            console.log('👤 Current User ID:', currentUserId);
            
            // Alle User aus Firebase laden
            console.log('📊 Lade alle User aus Firebase...');
            const usersSnapshot = await window.firebaseServices.db.collection('users').get();
            console.log('📊 Anzahl User in Firebase:', usersSnapshot.docs.length);
            
            // User-Daten sammeln
            const allUsers = [];
            usersSnapshot.docs.forEach(doc => {
                const userData = doc.data();
                if (doc.id !== currentUserId) { // Eigenen Account ausschließen
                    allUsers.push({
                        id: doc.id,
                        displayName: userData.displayName || 'Unbekannt',
                        username: userData.username || '',
                        avatar: userData.avatar || null,
                        bio: userData.bio || ''
                    });
                }
            });
            
            console.log('👥 Alle User (ohne eigenen):', allUsers.length);
            console.log('👥 User-Liste:', allUsers);
            
            // Suche durchführen (case-insensitive)
            const searchTerm = query.toLowerCase().trim();
            const isUsernameSearch = query.startsWith('@');
            const actualSearchTerm = isUsernameSearch ? searchTerm.substring(1) : searchTerm;
            
            console.log('🔍 Suche nach:', actualSearchTerm);
            console.log('🔍 Username-Suche:', isUsernameSearch);
            
            const matches = allUsers.filter(user => {
                const username = user.username.toLowerCase();
                const displayName = user.displayName.toLowerCase();
                
                if (isUsernameSearch) {
                    // Nur Username durchsuchen
                    const match = username.includes(actualSearchTerm) || username.startsWith(actualSearchTerm);
                    if (match) console.log(`✅ Username Match: ${user.displayName} (@${user.username})`);
                    return match;
                } else {
                    // DisplayName und Username durchsuchen
                    const match = displayName.includes(actualSearchTerm) || 
                                 username.includes(actualSearchTerm) ||
                                 displayName.startsWith(actualSearchTerm) ||
                                 username.startsWith(actualSearchTerm);
                    if (match) console.log(`✅ General Match: ${user.displayName} (@${user.username})`);
                    return match;
                }
            });
            
            console.log('🎯 Gefundene Matches:', matches.length);
            console.log('🎯 Matches:', matches);
            
            // Ergebnisse anzeigen
            if (matches.length === 0) {
                resultsContainer.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #666;">
                        <i class="fas fa-search" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <h3>Keine Benutzer gefunden</h3>
                        <p>Für "${query}" wurden keine Benutzer gefunden.</p>
                        <small>Durchsuchte User: ${allUsers.length}</small>
                    </div>
                `;
                return;
            }
            
            // User-Beziehungen laden für Button-Status
            const currentUserDoc = await window.firebaseServices.db.collection('users').doc(currentUserId).get();
            const currentUserData = currentUserDoc.data() || {};
            const friends = currentUserData.friends || [];
            const sentRequests = currentUserData.friendRequestsSent || [];
            const receivedRequests = currentUserData.friendRequestsReceived || [];
            
            // Ergebnisse HTML generieren
            const resultsHTML = matches.map(user => {
                const avatar = user.avatar || this.generateAvatarSVG(user.displayName);
                
                let buttonHTML = '';
                if (friends.includes(user.id)) {
                    buttonHTML = `<span style="color: #28a745; font-weight: bold;"><i class="fas fa-check"></i> Bereits Freunde</span>`;
                } else if (sentRequests.includes(user.id)) {
                    buttonHTML = `<span style="color: #ffc107;"><i class="fas fa-clock"></i> Anfrage gesendet</span>`;
                } else if (receivedRequests.includes(user.id)) {
                    buttonHTML = `
                        <button onclick="window.app.friendsManager.acceptFriendRequest('${user.id}')" 
                                style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px; margin-right: 5px;">
                            <i class="fas fa-check"></i> Annehmen
                        </button>
                        <button onclick="window.app.friendsManager.declineFriendRequest('${user.id}')" 
                                style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                            <i class="fas fa-times"></i> Ablehnen
                        </button>
                    `;
                } else {
                    buttonHTML = `
                        <button onclick="window.app.friendsManager.sendFriendRequestToUser('${user.id}')" 
                                style="background: #007bff; color: white; border: none; padding: 5px 15px; border-radius: 3px;">
                            <i class="fas fa-user-plus"></i> Freund hinzufügen
                        </button>
                    `;
                }
                
                return `
                    <div style="display: flex; align-items: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; background: white;">
                        <img src="${avatar}" 
                             style="width: 50px; height: 50px; border-radius: 50%; margin-right: 15px; object-fit: cover;" 
                             alt="${user.displayName}">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 5px 0; font-size: 16px;">${user.displayName}</h4>
                            <p style="margin: 0; color: #666; font-size: 14px;">@${user.username}</p>
                            ${user.bio ? `<p style="margin: 5px 0 0 0; color: #888; font-size: 12px;">${user.bio}</p>` : ''}
                        </div>
                        <div style="margin-left: 15px;">
                            ${buttonHTML}
                        </div>
                    </div>
                `;
            }).join('');
            
            resultsContainer.innerHTML = `
                <div style="padding: 10px;">
                    <h4 style="margin: 0 0 15px 0; color: #333;">
                        ${matches.length} Benutzer gefunden für "${query}"
                    </h4>
                    ${resultsHTML}
                </div>
            `;
            
        } catch (error) {
            console.error('❌ Fehler bei Live-Suche:', error);
            resultsContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <h3>Fehler bei der Suche</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    async sendFriendRequestToUser(userId) {
        const currentUserId = window.app?.authManager?.currentUser?.uid;
        if (!currentUserId) return;

        try {
            // Zu aktuellen Benutzer's gesendete Anfragen hinzufügen
            await window.firebaseServices.db
                .collection('users')
                .doc(currentUserId)
                .update({
                    friendRequestsSent: firebase.firestore.FieldValue.arrayUnion(userId)
                });

            // Zu Ziel-Benutzer's erhaltene Anfragen hinzufügen
            await window.firebaseServices.db
                .collection('users')
                .doc(userId)
                .update({
                    friendRequestsReceived: firebase.firestore.FieldValue.arrayUnion(currentUserId)
                });

            window.app?.authManager?.showToast('Freundschaftsanfrage erfolgreich gesendet! 🤝', 'success');
            
            // Modal schließen
            document.querySelector('.modal-overlay')?.remove();
            
            // Freunde-Liste neu laden
            this.loadFriends();

        } catch (error) {
            console.error('❌ Fehler beim Senden der Freundschaftsanfrage:', error);
            window.app?.authManager?.showToast('Fehler beim Senden der Anfrage', 'error');
        }
    }

    async acceptFriendRequest(userId) {
        const currentUserId = window.app?.authManager?.currentUser?.uid;
        if (!currentUserId) return;

        try {
            // Zu beiden Benutzern's Freundeslisten hinzufügen
            await window.firebaseServices.db
                .collection('users')
                .doc(currentUserId)
                .update({
                    friends: firebase.firestore.FieldValue.arrayUnion(userId),
                    friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(userId)
                });

            await window.firebaseServices.db
                .collection('users')
                .doc(userId)
                .update({
                    friends: firebase.firestore.FieldValue.arrayUnion(currentUserId),
                    friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(currentUserId)
                });

            window.app?.authManager?.showToast('Freundschaftsanfrage angenommen! 🎉', 'success');
            
            // Freunde-Liste neu laden
            this.loadFriends();
            
            // DM-Manager über neue Freundschaft informieren (falls vorhanden)
            if (window.app?.dmManager) {
                window.app.dmManager.loadConversations();
            }

            // Modal schließen falls offen
            document.querySelector('.modal-overlay')?.remove();

        } catch (error) {
            console.error('❌ Fehler beim Annehmen der Anfrage:', error);
            window.app?.authManager?.showToast('Fehler beim Annehmen der Anfrage', 'error');
        }
    }

    async declineFriendRequest(userId) {
        const currentUserId = window.app?.authManager?.currentUser?.uid;
        if (!currentUserId) return;

        try {
            // Von beiden Benutzern's Anfragenlisten entfernen
            await window.firebaseServices.db
                .collection('users')
                .doc(currentUserId)
                .update({
                    friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(userId)
                });

            await window.firebaseServices.db
                .collection('users')
                .doc(userId)
                .update({
                    friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(currentUserId)
                });

            window.app?.authManager?.showToast('Freundschaftsanfrage abgelehnt', 'info');
            this.loadFriends();

        } catch (error) {
            console.error('❌ Fehler beim Ablehnen der Freundschaftsanfrage:', error);
            window.app?.authManager?.showToast('Fehler beim Ablehnen der Anfrage', 'error');
        }
    }

    async removeFriend(userId) {
        if (!confirm('Möchtest du diesen Freund wirklich entfernen?')) return;

        const currentUserId = window.app?.authManager?.currentUser?.uid;
        if (!currentUserId) return;

        try {
            // Von beiden Benutzern's Freundeslisten entfernen
            await window.firebaseServices.db
                .collection('users')
                .doc(currentUserId)
                .update({
                    friends: firebase.firestore.FieldValue.arrayRemove(userId)
                });

            await window.firebaseServices.db
                .collection('users')
                .doc(userId)
                .update({
                    friends: firebase.firestore.FieldValue.arrayRemove(currentUserId)
                });

            window.app?.authManager?.showToast('Freund entfernt', 'info');
            this.loadFriends();

        } catch (error) {
            console.error('❌ Fehler beim Entfernen des Freundes:', error);
            window.app?.authManager?.showToast('Fehler beim Entfernen des Freundes', 'error');
        }
    }

    async cancelFriendRequest(userId) {
        const currentUserId = window.app?.authManager?.currentUser?.uid;
        if (!currentUserId) return;

        try {
            // Von beiden Benutzern's Anfragenlisten entfernen
            await window.firebaseServices.db
                .collection('users')
                .doc(currentUserId)
                .update({
                    friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(userId)
                });

            await window.firebaseServices.db
                .collection('users')
                .doc(userId)
                .update({
                    friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(currentUserId)
                });

            window.app?.authManager?.showToast('Freundschaftsanfrage zurückgezogen', 'info');
            this.loadFriends();

        } catch (error) {
            console.error('❌ Fehler beim Zurückziehen der Anfrage:', error);
            window.app?.authManager?.showToast('Fehler beim Zurückziehen der Anfrage', 'error');
        }
    }

    // Debug-Funktion zum Testen der Suche
    async debugSearchUsers() {
        console.log('🔍 Debug: Alle User laden...');
        
        try {
            const allUsersSnapshot = await window.firebaseServices.db
                .collection('users')
                .get();
            
            console.log('📊 Gefundene User:', allUsersSnapshot.docs.length);
            
            allUsersSnapshot.docs.forEach(doc => {
                const userData = doc.data();
                console.log(`👤 ${userData.displayName} (@${userData.username}) - ID: ${doc.id}`);
            });
            
        } catch (error) {
            console.error('❌ Debug Fehler:', error);
        }
    }

    // Test-Funktion für die Konsole
    testSearch(query = 'scout') {
        console.log('🧪 Test-Suche gestartet mit:', query);
        this.searchUsersLive(query);
    }

    // Backup: Komplett neue Modal-Funktion
    showAddFriendModalNew() {
        console.log('🆕 Neue Modal-Funktion aufgerufen');
        
        // Modal HTML
        const modalHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
                <div class="modal-content add-friend-modal">
                    <div class="modal-header">
                        <h2><i class="fas fa-user-plus"></i> Freund hinzufügen</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="search-input-section">
                            <label for="newUserSearchInput">Benutzer suchen</label>
                            <div class="search-input-wrapper">
                                <i class="fas fa-search search-icon"></i>
                                <input type="text" id="newUserSearchInput" placeholder="SCOUT, @username..." class="search-input">
                            </div>
                        </div>
                        <div id="newUserSearchResults" class="search-results"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Modal zum DOM hinzufügen
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event Listener einrichten
        const searchInput = document.getElementById('newUserSearchInput');
        const resultsContainer = document.getElementById('newUserSearchResults');
        
        if (searchInput && resultsContainer) {
            console.log('🔍 Neue Event Listener eingerichtet');
            
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                console.log('🔍 Neue Suche:', query);
                
                if (query.length >= 1) {
                    this.searchUsersLiveNew(query, resultsContainer);
                } else {
                    resultsContainer.innerHTML = '';
                }
            });
            
            searchInput.focus();
        }
    }

    async searchUsersLiveNew(query, resultContainer) {
        console.log('🆕 ===== NEUE SUCHE GESTARTET =====');
        console.log('Query:', query);
        
        resultContainer.innerHTML = '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Suche läuft...</div>';
        
        try {
            // Alle User laden
            const snapshot = await window.firebaseServices.db.collection('users').get();
            console.log('Geladene User:', snapshot.docs.length);
            
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('User-Liste:', users);
            
            // Filtern
            const searchTerm = query.toLowerCase();
            const matches = users.filter(user => {
                const username = (user.username || '').toLowerCase();
                const displayName = (user.displayName || '').toLowerCase();
                return username.includes(searchTerm) || displayName.includes(searchTerm);
            });
            
            console.log('Matches:', matches);
            
            if (matches.length === 0) {
                resultContainer.innerHTML = `<div class="no-results">Keine User gefunden für: "${query}"</div>`;
                return;
            }
            
            // Ergebnisse anzeigen
            const html = matches.map(user => `
                <div class="user-result">
                    <strong>${user.displayName}</strong> (@${user.username})
                    <button onclick="alert('User: ${user.id}')">Hinzufügen</button>
                </div>
            `).join('');
            
            resultContainer.innerHTML = html;
            
        } catch (error) {
            console.error('Fehler:', error);
            resultContainer.innerHTML = `<div class="search-error">Fehler: ${error.message}</div>`;
        }
    }

    createFriendsContainers() {
        console.log('🏗️ Erstelle Freunde-Container...');
        
        const friendsContent = document.querySelector('.friends-content') || 
                              document.querySelector('#friendsView .content');
        
        if (!friendsContent) {
            console.log('❌ Freunde-Content-Container nicht gefunden!');
            return;
        }
        
        friendsContent.innerHTML = `
            <div class="friends-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: white;">Freunde</h2>
                <button onclick="window.app.friendsManager.showAddFriendModal()" class="btn-primary">
                    <i class="fas fa-user-plus"></i> Freund hinzufügen
                </button>
            </div>
            
            <div class="friends-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #444;">
                <button class="friends-tab ${this.currentTab === 'all' ? 'active' : ''}" 
                        onclick="window.app.friendsManager.switchTab('all')"
                        style="padding: 10px 15px; background: ${this.currentTab === 'all' ? '#6c5ce7' : 'transparent'}; color: white; border: none; border-radius: 5px 5px 0 0; cursor: pointer;">
                    <i class="fas fa-users"></i> Alle Freunde
                    <span class="tab-count" style="background: #444; padding: 2px 6px; border-radius: 10px; margin-left: 5px;">${this.friends?.length || 0}</span>
                </button>
                <button class="friends-tab ${this.currentTab === 'online' ? 'active' : ''}" 
                        onclick="window.app.friendsManager.switchTab('online')"
                        style="padding: 10px 15px; background: ${this.currentTab === 'online' ? '#6c5ce7' : 'transparent'}; color: white; border: none; border-radius: 5px 5px 0 0; cursor: pointer;">
                    <i class="fas fa-circle" style="color: #28a745;"></i> Online
                    <span class="tab-count" style="background: #444; padding: 2px 6px; border-radius: 10px; margin-left: 5px;">${this.friends?.filter(f => f.status === 'online').length || 0}</span>
                </button>
                <button class="friends-tab ${this.currentTab === 'pending' ? 'active' : ''}" 
                        onclick="window.app.friendsManager.switchTab('pending')"
                        style="padding: 10px 15px; background: ${this.currentTab === 'pending' ? '#6c5ce7' : 'transparent'}; color: white; border: none; border-radius: 5px 5px 0 0; cursor: pointer;">
                    <i class="fas fa-clock"></i> Ausstehend
                    <span class="tab-count" style="background: #444; padding: 2px 6px; border-radius: 10px; margin-left: 5px;">${(this.pendingRequests?.length || 0) + (this.sentRequests?.length || 0)}</span>
                </button>
            </div>
            
            <div class="friends-content-area" style="min-height: 400px;">
                <div id="allFriendsList" class="friends-list" style="display: ${this.currentTab === 'all' ? 'block' : 'none'};">
                    <div class="loading">Lade Freunde...</div>
                </div>
                <div id="onlineFriendsList" class="friends-list" style="display: ${this.currentTab === 'online' ? 'block' : 'none'};">
                    <div class="loading">Lade Online-Freunde...</div>
                </div>
                <div id="pendingRequestsList" class="friends-list" style="display: ${this.currentTab === 'pending' ? 'block' : 'none'};">
                    <div class="loading">Lade Anfragen...</div>
                </div>
            </div>
        `;
        
        console.log('✅ Freunde-Container erstellt!');
        
        // Jetzt rendern
        setTimeout(() => {
            this.renderFriends();
        }, 100);
    }

    generateAvatarSVG(displayName) {
        const initial = (displayName || 'U').charAt(0).toUpperCase();
        const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        const color = colors[initial.charCodeAt(0) % colors.length];
        
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="${color}"/>
                <text x="50" y="60" text-anchor="middle" fill="white" font-size="30" font-family="Arial, sans-serif">${initial}</text>
            </svg>
        `)}`;
    }
}

window.FriendsManager = FriendsManager;
console.log('👥 FriendsManager geladen');

































































