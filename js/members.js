// 👥 MEMBERS DIRECTORY - Mitgliederverzeichnis
class MembersManager {
    constructor() {
        this.members = [];
        this.currentUser = null;
        this.userRelations = {
            friends: [],
            sentRequests: [],
            receivedRequests: []
        };
    }

    init() {
        console.log('👥 Members-Manager wird initialisiert...');
        this.setupEventListeners();
        console.log('✅ Members-Manager initialisiert');
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('membersSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', window.Utils.debounce((e) => {
                this.filterMembers(e.target.value);
            }, 300));
        }

        // Filter buttons
        document.querySelectorAll('.members-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = btn.dataset.filter;
                this.applyFilter(filter);
            });
        });
    }

    async loadMembers() {
        const currentUser = window.app?.authManager?.currentUser;
        if (!currentUser) {
            console.log('❌ Kein User eingeloggt');
            return;
        }

        console.log('🔄 Lade Mitglieder...');

        try {
            // Aktuelle User-Beziehungen laden
            await this.loadUserRelations();

            // Alle Mitglieder laden
            const membersSnapshot = await window.firebaseServices.db
                .collection('users')
                .orderBy('displayName')
                .get();

            this.members = membersSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(member => member.id !== currentUser.uid); // Eigenen Account ausschließen

            console.log(`📊 ${this.members.length} Mitglieder geladen`);
            this.renderMembers();

        } catch (error) {
            console.error('❌ Fehler beim Laden der Mitglieder:', error);
            window.app?.authManager?.showToast('Fehler beim Laden der Mitglieder', 'error');
        }
    }

    async loadUserRelations() {
        const currentUserId = window.app?.authManager?.currentUser?.uid;
        if (!currentUserId) return;

        try {
            const userDoc = await window.firebaseServices.db
                .collection('users')
                .doc(currentUserId)
                .get();

            const userData = userDoc.data();
            this.userRelations = {
                friends: userData.friends || [],
                sentRequests: userData.friendRequestsSent || [],
                receivedRequests: userData.friendRequestsReceived || []
            };

        } catch (error) {
            console.error('❌ Fehler beim Laden der User-Beziehungen:', error);
        }
    }

    renderMembers(filteredMembers = null) {
        const container = document.getElementById('membersGrid');
        if (!container) return;

        const membersToRender = filteredMembers || this.members;

        if (membersToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-members-state">
                    <i class="fas fa-users"></i>
                    <h3>Keine Mitglieder gefunden</h3>
                    <p>Versuche eine andere Suche oder Filter.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = membersToRender.map(member => this.renderMemberCard(member)).join('');
    }

    renderMemberCard(member) {
        const avatar = member.avatar || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%238b5cf6"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">${(member.displayName || 'U').charAt(0).toUpperCase()}</text></svg>`;
        
        const isOnline = member.status === 'online';
        const relationshipStatus = this.getUserRelationshipStatus(member.id);
        const actionButtons = this.getActionButtons(member.id, relationshipStatus);

        return `
            <div class="member-card" data-member-id="${member.id}">
                <div class="member-header" onclick="window.app.feedManager.openUserProfile('${member.id}')">
                    <div class="member-avatar">
                        <img src="${avatar}" alt="${member.displayName}">
                        <div class="member-status-dot ${isOnline ? 'online' : 'offline'}"></div>
                    </div>
                    <div class="member-info">
                        <h3 class="member-name">${member.displayName || window.i18n.t('anonymous')}</h3>
                        <p class="member-username">@${member.username || member.displayName?.toLowerCase() || 'user'}</p>
                        ${member.bio ? `<p class="member-bio">${member.bio}</p>` : ''}
                        <div class="member-meta">
                            <span class="member-status">
                                <i class="fas fa-circle ${isOnline ? 'text-success' : 'text-muted'}"></i>
                                ${isOnline ? window.i18n.t('online') : 'Offline'}
                            </span>
                            ${member.role && member.role !== 'user' ? `
                                <span class="member-role rank-badge ${member.role}">
                                    <i class="fas fa-star"></i>
                                    ${window.app?.feedManager?.getRoleDisplay(member.role) || member.role}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="member-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
    }

    getUserRelationshipStatus(userId) {
        if (this.userRelations.friends.includes(userId)) {
            return 'friend';
        } else if (this.userRelations.sentRequests.includes(userId)) {
            return 'sent';
        } else if (this.userRelations.receivedRequests.includes(userId)) {
            return 'received';
        }
        return 'none';
    }

    getActionButtons(userId, status) {
        switch (status) {
            case 'friend':
                return `
                    <button class="btn btn-outline" onclick="window.app.dmManager.startConversation('${userId}')" title="${window.i18n.t('send_message')}">
                        <i class="fas fa-comment"></i>
                    </button>
                    <button class="btn btn-success" disabled>
                        <i class="fas fa-check"></i> ${window.i18n.t('friends')}
                    </button>
                `;
            case 'sent':
                return `
                    <button class="btn btn-outline" onclick="window.app.membersManager.cancelFriendRequest('${userId}')">
                        <i class="fas fa-times"></i> ${window.i18n.t('withdraw')}
                    </button>
                `;
            case 'received':
                return `
                    <button class="btn btn-success" onclick="window.app.membersManager.acceptFriendRequest('${userId}')">
                        <i class="fas fa-check"></i> ${window.i18n.t('accept')}
                    </button>
                    <button class="btn btn-danger" onclick="window.app.membersManager.declineFriendRequest('${userId}')">
                        <i class="fas fa-times"></i> ${window.i18n.t('decline')}
                    </button>
                `;
            default:
                return `
                    <button class="btn btn-primary" onclick="window.app.membersManager.sendFriendRequest('${userId}')">
                        <i class="fas fa-user-plus"></i> ${window.i18n.t('add_friend')}
                    </button>
                `;
        }
    }

    filterMembers(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderMembers();
            return;
        }

        const filtered = this.members.filter(member => {
            const name = (member.displayName || '').toLowerCase();
            const username = (member.username || '').toLowerCase();
            const bio = (member.bio || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            return name.includes(search) || 
                   username.includes(search) || 
                   bio.includes(search);
        });

        this.renderMembers(filtered);
    }

    applyFilter(filterType) {
        // Update active filter button
        document.querySelectorAll('.members-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filterType}"]`)?.classList.add('active');

        let filtered = [...this.members];

        switch (filterType) {
            case 'all':
                // Show all members
                break;
            case 'online':
                filtered = this.members.filter(member => member.status === 'online');
                break;
            case 'new':
                // Sort by creation date (newest first)
                filtered = this.members.sort((a, b) => {
                    const dateA = a.createdAt?.toDate() || new Date(0);
                    const dateB = b.createdAt?.toDate() || new Date(0);
                    return dateB - dateA;
                });
                break;
            case 'friends':
                filtered = this.members.filter(member => 
                    this.userRelations.friends.includes(member.id)
                );
                break;
        }

        this.renderMembers(filtered);
    }

    // Friend request methods (delegate to FriendsManager)
    async sendFriendRequest(userId) {
        await window.app?.friendsManager?.sendFriendRequestToUser(userId);
        await this.loadUserRelations();
        this.renderMembers();
    }

    async acceptFriendRequest(userId) {
        await window.app?.friendsManager?.acceptFriendRequest(userId);
        await this.loadUserRelations();
        this.renderMembers();
    }

    async declineFriendRequest(userId) {
        await window.app?.friendsManager?.declineFriendRequest(userId);
        await this.loadUserRelations();
        this.renderMembers();
    }

    async cancelFriendRequest(userId) {
        await window.app?.friendsManager?.cancelFriendRequest(userId);
        await this.loadUserRelations();
        this.renderMembers();
    }
}

// Global instance
window.MembersManager = MembersManager;