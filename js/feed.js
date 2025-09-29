// 📰 FEED MANAGER - NORISK STYLE
class FeedManager {
    constructor() {
        this.posts = [];
    }
    
    init() {
        console.log('📰 Feed Manager initializing...');
        this.loadPosts();
        console.log('✅ Feed Manager initialized');
    }
    
    async loadPosts() {
        console.log('📰 Loading posts...');
        try {
            const snapshot = await window.firebaseServices.db
                .collection('posts')
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
            
            this.posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.renderPosts();
        } catch (error) {
            console.error('❌ Error loading posts:', error);
        }
    }
    
    async createPost(content, mediaData = null) {
        if (!window.app?.authManager?.currentUser) {
            if (window.app?.authManager) {
                window.app.authManager.showToast('Please log in to create posts', 'error');
            }
            return;
        }

        try {
            const user = window.app.authManager.currentUser;
            const userDoc = window.app.authManager.userDoc;
            
            const postData = {
                content: content || '',
                authorId: user.uid,
                authorName: userDoc?.displayName || user.displayName || 'Anonymous',
                authorAvatar: userDoc?.avatar || null,
                username: userDoc?.username || userDoc?.displayName?.toLowerCase().replace(/\s+/g, '') || 'user',
                authorCreatedAt: userDoc?.createdAt || new Date().toISOString(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                likes: 0,
                comments: 0,
                hasMedia: !!mediaData
            };
            
            if (mediaData) {
                window.app.authManager.showToast('Bilder werden bald unterstützt! 📸', 'info');
                return;
            }
            
            console.log('📝 Creating post with data:', postData);
            
            await window.firebaseServices.db.collection('posts').add(postData);
            
            if (window.app?.authManager) {
                window.app.authManager.showToast('Post created successfully!', 'success');
            }
            this.loadPosts();
            
        } catch (error) {
            console.error('❌ Error creating post:', error);
            console.error('Error details:', error.code, error.message);
            
            if (window.app?.authManager) {
                if (error.code === 'permission-denied') {
                    window.app.authManager.showToast('Keine Berechtigung zum Erstellen von Posts', 'error');
                } else {
                    window.app.authManager.showToast('Error creating post', 'error');
                }
            }
        }
    }
    
    renderPosts() {
        const container = document.getElementById('feedContainer');
        if (!container) return;
        
        const currentUserId = window.app?.authManager?.currentUser?.uid;
        
        container.innerHTML = this.posts.map(post => `
            <div class="post-card">
                <div class="post-header">
                    <div class="user-profile-info" onclick="window.app.feedManager.openUserProfile('${post.authorId}')">
                        <div class="user-avatar-post">
                            ${post.authorAvatar ? 
                                `<img src="${post.authorAvatar}" alt="Avatar">` : 
                                `<div class="avatar-placeholder-post">${(post.authorName || 'A').charAt(0).toUpperCase()}</div>`
                            }
                        </div>
                        <div class="user-details-post">
                            <div class="user-name-line">
                                <span class="display-name-post">${post.authorName || 'Anonymous'}</span>
                                <span class="username-post">@${post.username || post.authorName?.toLowerCase().replace(/\s+/g, '') || 'user'}</span>
                            </div>
                            <div class="user-meta-post">
                                <i class="fas fa-calendar-alt"></i>
                                <span>${window.i18n.t('member_since')} ${this.formatDate(post.authorCreatedAt || post.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="post-actions-header">
                        <div class="post-timestamp">
                            ${this.formatTimestamp(post.createdAt)}
                        </div>
                        ${currentUserId === post.authorId ? `
                            <button class="post-delete-btn" onclick="window.app.feedManager.confirmDeletePost('${post.id}')" title="Beitrag löschen">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="post-content">
                    ${this.renderPostContent(post.content)}
                </div>
                
                ${post.media ? this.renderPostMedia(post.media) : ''}
                
                <div class="post-actions">
                    <button class="post-action-btn like-btn" onclick="window.app.feedManager.toggleLike('${post.id}')">
                        <i class="fas fa-heart"></i>
                        <span>${post.likes || 0}</span>
                    </button>
                    <button class="post-action-btn comment-btn" onclick="window.app.feedManager.openComments('${post.id}')">
                        <i class="fas fa-comment"></i>
                        <span>${post.comments || 0}</span>
                    </button>
                    <button class="post-action-btn share-btn" onclick="window.app.feedManager.sharePost('${post.id}')">
                        <i class="fas fa-share"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPostContent(content) {
        if (!content) return '';
        
        // Enhanced emoji rendering
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        
        return content
            .replace(/\n/g, '<br>')
            .replace(emojiRegex, (emoji) => `<span class="post-emoji">${emoji}</span>`)
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="post-link">$1</a>')
            .replace(/@(\w+)/g, '<span class="post-mention">@$1</span>')
            .replace(/#(\w+)/g, '<span class="post-hashtag">#$1</span>');
    }

    renderPostMedia(media) {
        // Für jetzt keine Medien anzeigen
        return '';
    }

    openImageModal(imageUrl) {
        const modalContent = `
            <div class="image-modal">
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <img src="${imageUrl}" alt="Full size image" class="modal-image">
            </div>
        `;
        
        this.showModal(modalContent);
    }

    getRoleDisplay(role) {
        return window.i18n.t(`rank_${role || 'user'}`);
    }

    // Sichere Helper-Methoden (nur öffentliche Daten!)
    getDisplayNameForUser(userId) {
        return 'User Display Name';
    }

    getUsernameForUser(userId) {
        return 'username';
    }

    getJoinDateForUser(userId) {
        return 'Juli 2025';
    }

    getAvatarForUser(userId) {
        return `<div class="avatar-placeholder-compact">U</div>`;
    }

    showModal(content) {
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) existingModal.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `<div class="modal user-profile-view-modal">${content}</div>`;
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    formatDate(dateString) {
        if (!dateString) return window.i18n?.t('unknown') || 'Unbekannt';
        
        try {
            let date;
            
            // Handle different date formats
            if (dateString.toDate) {
                // Firestore Timestamp
                date = dateString.toDate();
            } else if (typeof dateString === 'string') {
                // ISO String
                date = new Date(dateString);
            } else if (dateString instanceof Date) {
                // Already a Date object
                date = dateString;
            } else {
                // Fallback
                date = new Date(dateString);
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Unbekannt';
            }
            
            return date.toLocaleDateString('de-DE', { 
                year: 'numeric', 
                month: 'long'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Unbekannt';
        }
    }

    formatTimestamp(dateString) {
        if (!dateString) return '';
        
        try {
            let date;
            
            // Handle different date formats
            if (dateString.toDate) {
                // Firestore Timestamp
                date = dateString.toDate();
            } else if (typeof dateString === 'string') {
                // ISO String
                date = new Date(dateString);
            } else if (dateString instanceof Date) {
                // Already a Date object
                date = dateString;
            } else {
                // Fallback
                date = new Date(dateString);
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return '';
            }
            
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) return window.i18n.t('just_now') || 'Gerade eben';
            if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
            return date.toLocaleDateString('de-DE');
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return '';
        }
    }

    confirmDeletePost(postId) {
        const modalContent = `
            <div class="delete-confirmation-modal">
                <div class="delete-modal-header">
                    <h2><i class="fas fa-exclamation-triangle"></i> Beitrag löschen?</h2>
                </div>
                
                <div class="delete-modal-content">
                    <p>Bist du dir sicher, dass du diesen Beitrag löschen möchtest?</p>
                    <p class="warning-text">Diese Aktion kann nicht rückgängig gemacht werden.</p>
                </div>
                
                <div class="delete-modal-footer">
                    <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                        Abbrechen
                    </button>
                    <button class="btn-danger" onclick="window.app.feedManager.deletePost('${postId}')">
                        <i class="fas fa-trash"></i> Löschen
                    </button>
                </div>
            </div>
        `;
        
        this.showModal(modalContent);
    }

    async deletePost(postId) {
        try {
            await window.firebaseServices.db.collection('posts').doc(postId).delete();
            
            // Modal schließen
            document.querySelector('.modal-overlay')?.remove();
            
            // Posts neu laden
            this.loadPosts();
            
            if (window.app?.authManager) {
                window.app.authManager.showToast('Beitrag erfolgreich gelöscht!', 'success');
            }
        } catch (error) {
            console.error('❌ Error deleting post:', error);
            if (window.app?.authManager) {
                window.app.authManager.showToast('Fehler beim Löschen des Beitrags', 'error');
            }
        }
    }

    async openUserProfile(userId) {
        console.log('👤 Opening user profile for:', userId);
        
        try {
            const userDoc = await window.firebaseServices.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                window.app?.authManager?.showToast('User not found', 'error');
                return;
            }
            
            const userData = userDoc.data();
            const isOwnProfile = userId === window.app?.authManager?.currentUser?.uid;
            
            // Check if following
            let isFollowing = false;
            if (!isOwnProfile && window.app?.authManager?.currentUser) {
                const followDoc = await window.firebaseServices.db
                    .collection('users')
                    .doc(window.app.authManager.currentUser.uid)
                    .collection('following')
                    .doc(userId)
                    .get();
                isFollowing = followDoc.exists;
            }
            
            // Handle banner display
            let bannerStyle = '';
            if (userData.banner) {
                if (typeof userData.banner === 'string') {
                    bannerStyle = `background: ${userData.banner}`;
                } else if (userData.banner.type === 'image') {
                    bannerStyle = `background-image: url(${userData.banner.url}); background-size: ${userData.banner.size || 'cover'}; background-position: ${userData.banner.position || 'center'}`;
                }
            } else {
                bannerStyle = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
            
            const modalContent = `
                <div class="user-profile-modal">
                    <!-- Banner Section -->
                    <div class="profile-banner" style="${bannerStyle}">
                        ${isOwnProfile ? `
                            <button class="edit-banner-btn" onclick="window.app.feedManager.editBanner()" title="Banner bearbeiten">
                                <i class="fas fa-camera"></i>
                            </button>
                        ` : ''}
                    </div>
                    
                    <!-- Profile Header -->
                    <div class="profile-header">
                        <div class="profile-avatar-section">
                            <div class="profile-avatar-large">
                                ${userData.avatar ? 
                                    `<img src="${userData.avatar}" alt="Avatar">` : 
                                    `<div class="avatar-placeholder">${(userData.displayName || 'U').charAt(0).toUpperCase()}</div>`
                                }
                            </div>
                            ${isOwnProfile ? `
                                <button class="edit-avatar-btn" onclick="window.app.authManager.openProfileModal()" title="Profil bearbeiten">
                                    <i class="fas fa-edit"></i>
                                </button>
                            ` : ''}
                        </div>
                        
                        <div class="profile-info-section">
                            <div class="profile-names">
                                <h2 class="profile-display-name">${userData.displayName || 'Anonymous'}</h2>
                                <p class="profile-username">@${userData.username || userData.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
                            </div>
                            
                            ${userData.bio ? `
                                <p class="profile-bio">${userData.bio}</p>
                            ` : `
                                <p class="profile-bio-empty">${isOwnProfile ? 'Füge eine Bio hinzu, um anderen mehr über dich zu erzählen!' : 'Keine Bio verfügbar'}</p>
                            `}
                            
                            <div class="profile-meta">
                                <div class="profile-meta-item">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>${window.i18n.t('member_since')} ${this.formatDate(userData.createdAt)}</span>
                                </div>
                                <div class="profile-meta-item">
                                    <i class="fas fa-star"></i>
                                    <span class="rank-badge ${userData.role || 'user'}">${this.getRoleDisplay(userData.role)}</span>
                                </div>
                                ${userData.status ? `
                                    <div class="profile-meta-item">
                                        <div class="status-indicator ${userData.status}"></div>
                                        <span>${userData.status === 'online' ? 'Online' : 'Offline'}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Profile Stats -->
                    <div class="profile-stats">
                        <div class="stat-item">
                            <span class="stat-number">${await this.getUserPostCount(userId)}</span>
                            <span class="stat-label">Posts</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${userData.followersCount || 0}</span>
                            <span class="stat-label">Follower</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${userData.followingCount || 0}</span>
                            <span class="stat-label">Following</span>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    ${!isOwnProfile ? `
                        <div class="profile-actions">
                            <button class="follow-btn ${isFollowing ? 'following' : ''}" data-user-id="${userId}" onclick="window.app.feedManager.followUser('${userId}')">
                                <i class="fas ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}"></i>
                                ${isFollowing ? 'Gefolgt' : 'Folgen'}
                            </button>
                            <button class="btn-outline message-btn" onclick="window.app.feedManager.addFriend('${userId}')">
                                <i class="fas fa-user-plus"></i>
                                Als Freund hinzufügen
                            </button>
                        </div>
                    ` : `
                        <div class="profile-actions">
                            <button class="btn-primary" onclick="window.app.authManager.openProfileModal()">
                                <i class="fas fa-edit"></i>
                                Profil bearbeiten
                            </button>
                        </div>
                    `}
                </div>
            `;
            
            this.showModal(modalContent);
            
        } catch (error) {
            console.error('❌ Error loading user profile:', error);
            window.app?.authManager?.showToast('Error loading profile', 'error');
        }
    }

    async getUserPostCount(userId) {
        try {
            const snapshot = await window.firebaseServices.db
                .collection('posts')
                .where('authorId', '==', userId)
                .get();
            return snapshot.size;
        } catch (error) {
            return 0;
        }
    }

    editBanner() {
        const modalContent = `
            <div class="banner-editor-modal">
                <div class="banner-editor-header">
                    <h2><i class="fas fa-image"></i> Banner bearbeiten</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="banner-editor-content">
                    <!-- Current Banner Preview -->
                    <div class="banner-preview-section">
                        <label class="banner-label">Aktueller Banner</label>
                        <div class="banner-preview" id="bannerPreview" style="background: ${window.app?.authManager?.userDoc?.banner || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}">
                            <div class="banner-overlay">
                                <i class="fas fa-camera"></i>
                                <span>Klicke um zu ändern</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Upload Section -->
                    <div class="banner-upload-section">
                        <input type="file" id="bannerUpload" accept="image/*" style="display: none;">
                        <div class="upload-options">
                            <button class="btn-primary" onclick="document.getElementById('bannerUpload').click()">
                                <i class="fas fa-upload"></i> Eigenes Bild hochladen
                            </button>
                            <button class="btn-outline" onclick="window.app.feedManager.showGradientPicker()">
                                <i class="fas fa-palette"></i> Farbverlauf wählen
                            </button>
                        </div>
                    </div>
                    
                    <!-- Gradient Picker -->
                    <div class="gradient-picker-section hidden" id="gradientPicker">
                        <label class="banner-label">Farbverläufe</label>
                        <div class="gradient-grid">
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"></div>
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"></div>
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"></div>
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"></div>
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)"></div>
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"></div>
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)" style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"></div>
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"></div>
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" style="background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"></div>
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)" style="background: linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)"></div>
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)" style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)"></div>
                            <div class="gradient-option" data-gradient="linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)" style="background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)"></div>
                        </div>
                    </div>
                    
                    <!-- Image Adjustment Controls -->
                    <div class="image-controls-section hidden" id="imageControls">
                        <label class="banner-label">Bildanpassung</label>
                        <div class="control-group">
                            <label for="positionX">Position X:</label>
                            <input type="range" id="positionX" min="0" max="100" value="50" class="slider">
                        </div>
                        <div class="control-group">
                            <label for="positionY">Position Y:</label>
                            <input type="range" id="positionY" min="0" max="100" value="50" class="slider">
                        </div>
                        <div class="control-group">
                            <label for="scale">Zoom:</label>
                            <input type="range" id="scale" min="100" max="200" value="100" class="slider">
                        </div>
                    </div>
                </div>
                
                <div class="banner-editor-footer">
                    <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                        Abbrechen
                    </button>
                    <button class="btn-primary" onclick="window.app.feedManager.saveBanner()">
                        <i class="fas fa-save"></i> Banner speichern
                    </button>
                </div>
            </div>
        `;
        
        this.showModal(modalContent);
        this.setupBannerEditor();
    }

    setupBannerEditor() {
        const bannerUpload = document.getElementById('bannerUpload');
        const bannerPreview = document.getElementById('bannerPreview');
        const gradientOptions = document.querySelectorAll('.gradient-option');
        
        // Banner upload
        if (bannerUpload) {
            bannerUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleBannerUpload(file);
                }
            });
        }
        
        // Banner preview click
        if (bannerPreview) {
            bannerPreview.addEventListener('click', () => {
                bannerUpload?.click();
            });
        }
        
        // Gradient selection
        gradientOptions.forEach(option => {
            option.addEventListener('click', () => {
                const gradient = option.dataset.gradient;
                bannerPreview.style.background = gradient;
                bannerPreview.dataset.newBanner = gradient;
                bannerPreview.dataset.bannerType = 'gradient';
                
                // Hide image controls
                document.getElementById('imageControls')?.classList.add('hidden');
                
                // Update selection
                gradientOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
        
        // Image adjustment controls
        const positionX = document.getElementById('positionX');
        const positionY = document.getElementById('positionY');
        const scale = document.getElementById('scale');
        
        [positionX, positionY, scale].forEach(control => {
            if (control) {
                control.addEventListener('input', () => {
                    this.updateBannerImage();
                });
            }
        });
    }

    handleBannerUpload(file) {
        if (!file.type.startsWith('image/')) {
            window.app?.authManager?.showToast('Bitte wähle eine gültige Bilddatei aus', 'error');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            window.app?.authManager?.showToast('Bild ist zu groß. Maximum: 10MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const bannerPreview = document.getElementById('bannerPreview');
            if (bannerPreview) {
                bannerPreview.style.backgroundImage = `url(${e.target.result})`;
                bannerPreview.style.backgroundSize = 'cover';
                bannerPreview.style.backgroundPosition = 'center';
                bannerPreview.dataset.newBanner = e.target.result;
                bannerPreview.dataset.bannerType = 'image';
                
                // Show image controls
                document.getElementById('imageControls')?.classList.remove('hidden');
                
                // Clear gradient selection
                document.querySelectorAll('.gradient-option').forEach(opt => opt.classList.remove('selected'));
            }
        };
        reader.readAsDataURL(file);
    }

    showGradientPicker() {
        const gradientPicker = document.getElementById('gradientPicker');
        if (gradientPicker) {
            gradientPicker.classList.toggle('hidden');
        }
    }

    updateBannerImage() {
        const bannerPreview = document.getElementById('bannerPreview');
        const positionX = document.getElementById('positionX')?.value || 50;
        const positionY = document.getElementById('positionY')?.value || 50;
        const scale = document.getElementById('scale')?.value || 100;
        
        if (bannerPreview && bannerPreview.dataset.bannerType === 'image') {
            bannerPreview.style.backgroundPosition = `${positionX}% ${positionY}%`;
            bannerPreview.style.backgroundSize = `${scale}%`;
        }
    }

    async saveBanner() {
        const bannerPreview = document.getElementById('bannerPreview');
        if (!bannerPreview || !bannerPreview.dataset.newBanner) {
            window.app?.authManager?.showToast('Keine Änderungen zum Speichern', 'info');
            return;
        }
        
        try {
            const bannerData = bannerPreview.dataset.newBanner;
            const bannerType = bannerPreview.dataset.bannerType;
            
            let bannerValue = bannerData;
            
            // For images, include position and scale
            if (bannerType === 'image') {
                const positionX = document.getElementById('positionX')?.value || 50;
                const positionY = document.getElementById('positionY')?.value || 50;
                const scale = document.getElementById('scale')?.value || 100;
                
                bannerValue = {
                    type: 'image',
                    url: bannerData,
                    position: `${positionX}% ${positionY}%`,
                    size: `${scale}%`
                };
            }
            
            await window.firebaseServices.db.collection('users')
                .doc(window.app.authManager.currentUser.uid)
                .update({ banner: bannerValue });
            
            // Update local userDoc
            window.app.authManager.userDoc.banner = bannerValue;
            
            window.app?.authManager?.showToast('Banner erfolgreich gespeichert! 🎨', 'success');
            document.querySelector('.modal-overlay')?.remove();
            
        } catch (error) {
            console.error('❌ Error saving banner:', error);
            window.app?.authManager?.showToast('Fehler beim Speichern des Banners', 'error');
        }
    }

    async toggleLike(postId) {
        if (!window.app?.authManager?.currentUser) {
            window.app?.authManager?.showToast('Bitte melde dich an um zu liken', 'error');
            return;
        }

        try {
            const userId = window.app.authManager.currentUser.uid;
            const postRef = window.firebaseServices.db.collection('posts').doc(postId);
            const likesRef = postRef.collection('likes').doc(userId);
            
            const likeDoc = await likesRef.get();
            const likeBtn = document.querySelector(`[onclick="window.app.feedManager.toggleLike('${postId}')"]`);
            
            if (likeDoc.exists) {
                // Unlike
                await likesRef.delete();
                await postRef.update({
                    likes: firebase.firestore.FieldValue.increment(-1)
                });
                
                if (likeBtn) {
                    likeBtn.classList.remove('liked');
                    const countSpan = likeBtn.querySelector('span');
                    if (countSpan) {
                        const currentCount = parseInt(countSpan.textContent) || 0;
                        countSpan.textContent = Math.max(0, currentCount - 1);
                    }
                }
            } else {
                // Like
                await likesRef.set({
                    userId: userId,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                await postRef.update({
                    likes: firebase.firestore.FieldValue.increment(1)
                });
                
                if (likeBtn) {
                    likeBtn.classList.add('liked');
                    const countSpan = likeBtn.querySelector('span');
                    if (countSpan) {
                        const currentCount = parseInt(countSpan.textContent) || 0;
                        countSpan.textContent = currentCount + 1;
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error toggling like:', error);
            window.app?.authManager?.showToast('Fehler beim Liken', 'error');
        }
    }

    async openComments(postId) {
        console.log('💬 Opening comments for post:', postId);
        
        try {
            // Load comments
            const commentsSnapshot = await window.firebaseServices.db
                .collection('posts')
                .doc(postId)
                .collection('comments')
                .orderBy('createdAt', 'desc')
                .get();
            
            const comments = commentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Get post data for context
            const postDoc = await window.firebaseServices.db
                .collection('posts')
                .doc(postId)
                .get();
            
            const postData = postDoc.data();
            
            const modalContent = `
                <div class="profile-edit-modal">
                    <div class="profile-modal">
                        <div class="profile-modal-header">
                            <h2>
                                <i class="fas fa-comments"></i>
                                Kommentare
                            </h2>
                            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div class="profile-modal-body">
                            <!-- Original Post Context -->
                            <div class="profile-section">
                                <div class="section-header">
                                    <h3><i class="fas fa-quote-left"></i> Original Post</h3>
                                </div>
                                <div class="original-post-context">
                                    <div class="user-profile-info-compact">
                                        <div class="user-avatar-compact">
                                            ${postData?.authorAvatar ? 
                                                `<img src="${postData.authorAvatar}" alt="Avatar">` : 
                                                `<div class="avatar-placeholder-compact">${(postData?.authorName || 'A').charAt(0).toUpperCase()}</div>`
                                            }
                                        </div>
                                        <div class="user-details-compact">
                                            <span class="display-name-compact">${postData?.authorName || 'Anonymous'}</span>
                                            <span class="post-time-compact">${this.formatTimestamp(postData?.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div class="post-content-compact">
                                        ${this.renderPostContent(postData?.content || '')}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Comment Input -->
                            <div class="profile-section">
                                <div class="section-header">
                                    <h3><i class="fas fa-pen"></i> Neuer Kommentar</h3>
                                </div>
                                <div class="comment-input-section">
                                    <div class="user-avatar-input">
                                        ${window.app?.authManager?.userDoc?.avatar ? 
                                            `<img src="${window.app.authManager.userDoc.avatar}" alt="Avatar">` : 
                                            `<div class="avatar-placeholder-input">${(window.app?.authManager?.userDoc?.displayName || 'U').charAt(0).toUpperCase()}</div>`
                                        }
                                    </div>
                                    <div class="comment-input-container">
                                        <textarea 
                                            id="commentInput" 
                                            class="profile-textarea" 
                                            placeholder="Schreibe einen Kommentar..."
                                            rows="3"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Comments List -->
                            <div class="profile-section">
                                <div class="section-header">
                                    <h3><i class="fas fa-comments"></i> Alle Kommentare (${comments.length})</h3>
                                </div>
                                <div class="comments-list">
                                    ${comments.length > 0 ? comments.map(comment => this.renderCommentClean(comment, postId)).join('') : 
                                        '<div class="no-comments"><i class="fas fa-comment-slash"></i> Noch keine Kommentare</div>'
                                    }
                                </div>
                            </div>
                        </div>
                        
                        <div class="profile-modal-footer">
                            <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                                <i class="fas fa-times"></i> Schließen
                            </button>
                            <button class="btn-primary" onclick="window.app.feedManager.submitComment('${postId}')">
                                <i class="fas fa-paper-plane"></i> Kommentieren
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            this.showModal(modalContent);
            
            // Focus comment input
            setTimeout(() => {
                document.getElementById('commentInput')?.focus();
            }, 100);
            
        } catch (error) {
            console.error('❌ Error loading comments:', error);
            window.app?.authManager?.showToast('Fehler beim Laden der Kommentare', 'error');
        }
    }

    renderCommentClean(comment, postId) {
        const currentUserId = window.app?.authManager?.currentUser?.uid;
        const isOwnComment = currentUserId === comment.authorId;
        
        return `
            <div class="comment-item-clean">
                <div class="comment-header-clean">
                    <div class="user-profile-info-compact">
                        <div class="user-avatar-compact">
                            ${comment.authorAvatar ? 
                                `<img src="${comment.authorAvatar}" alt="Avatar">` : 
                                `<div class="avatar-placeholder-compact">${(comment.authorName || 'A').charAt(0).toUpperCase()}</div>`
                            }
                        </div>
                        <div class="user-details-compact">
                            <span class="display-name-compact">${comment.authorName || 'Anonymous'}</span>
                            <span class="post-time-compact">${this.formatTimestamp(comment.createdAt)}</span>
                        </div>
                    </div>
                    ${isOwnComment ? `
                        <button class="btn-icon-danger" onclick="window.app.feedManager.deleteComment('${comment.postId}', '${comment.id}')" title="Kommentar löschen">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="comment-content-clean">
                    ${this.renderPostContent(comment.content)}
                </div>
                <div class="comment-actions-clean">
                    <button class="btn-icon-like ${comment.userLiked ? 'liked' : ''}" onclick="window.app.feedManager.toggleCommentLike('${comment.postId}', '${comment.id}')">
                        <i class="fas fa-heart"></i>
                        <span>${comment.likes || 0}</span>
                    </button>
                </div>
            </div>
        `;
    }

    async submitComment(postId) {
        const commentInput = document.getElementById('commentInput');
        if (!commentInput) return;
        
        const content = commentInput.value.trim();
        if (!content) {
            window.app?.authManager?.showToast('Kommentar darf nicht leer sein', 'error');
            return;
        }
        
        if (!window.app?.authManager?.currentUser) {
            window.app?.authManager?.showToast('Bitte melde dich an um zu kommentieren', 'error');
            return;
        }
        
        try {
            const commentData = {
                content: content,
                authorId: window.app.authManager.currentUser.uid,
                authorName: window.app.authManager.userDoc?.displayName || 'Anonymous',
                authorAvatar: window.app.authManager.userDoc?.avatar || null,
                postId: postId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                likes: 0
            };
            
            // Add comment
            await window.firebaseServices.db
                .collection('posts')
                .doc(postId)
                .collection('comments')
                .add(commentData);
            
            // Update post comment count
            await window.firebaseServices.db
                .collection('posts')
                .doc(postId)
                .update({
                    comments: firebase.firestore.FieldValue.increment(1)
                });
            
            // Clear input
            commentInput.value = '';
            
            // Reload comments
            this.openComments(postId);
            
            window.app?.authManager?.showToast('Kommentar hinzugefügt! 💬', 'success');
            
        } catch (error) {
            console.error('❌ Error submitting comment:', error);
            window.app?.authManager?.showToast('Fehler beim Kommentieren', 'error');
        }
    }

    async deleteComment(postId, commentId) {
        try {
            await window.firebaseServices.db
                .collection('posts')
                .doc(postId)
                .collection('comments')
                .doc(commentId)
                .delete();
            
            // Update post comment count
            await window.firebaseServices.db
                .collection('posts')
                .doc(postId)
                .update({
                    comments: firebase.firestore.FieldValue.increment(-1)
                });
            
            // Reload comments
            this.openComments(postId);
            
            window.app?.authManager?.showToast('Kommentar gelöscht', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting comment:', error);
            window.app?.authManager?.showToast('Fehler beim Löschen', 'error');
        }
    }

    async toggleCommentLike(postId, commentId) {
        if (!window.app?.authManager?.currentUser) {
            window.app?.authManager?.showToast('Bitte melde dich an um zu liken', 'error');
            return;
        }

        try {
            const userId = window.app.authManager.currentUser.uid;
            const commentRef = window.firebaseServices.db
                .collection('posts')
                .doc(postId)
                .collection('comments')
                .doc(commentId);
            const likesRef = commentRef.collection('likes').doc(userId);
            
            const likeDoc = await likesRef.get();
            
            if (likeDoc.exists) {
                // Unlike
                await likesRef.delete();
                await commentRef.update({
                    likes: firebase.firestore.FieldValue.increment(-1)
                });
            } else {
                // Like
                await likesRef.set({
                    userId: userId,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                await commentRef.update({
                    likes: firebase.firestore.FieldValue.increment(1)
                });
            }
            
            // Reload comments to show updated likes
            this.openComments(postId);
            
        } catch (error) {
            console.error('❌ Error toggling comment like:', error);
            window.app?.authManager?.showToast('Fehler beim Liken', 'error');
        }
    }

    async followUser(userId) {
        if (!window.app?.authManager?.currentUser) {
            window.app?.authManager?.showToast('Bitte melde dich an um zu folgen', 'error');
            return;
        }
        
        const currentUserId = window.app.authManager.currentUser.uid;
        if (currentUserId === userId) {
            window.app?.authManager?.showToast('Du kannst dir nicht selbst folgen', 'error');
            return;
        }
        
        try {
            // Simplified approach - just update current user's following list
            const currentUserRef = window.firebaseServices.db.collection('users').doc(currentUserId);
            const currentUserDoc = await currentUserRef.get();
            const currentUserData = currentUserDoc.data();
            
            const following = currentUserData.following || [];
            const isFollowing = following.includes(userId);
            
            if (isFollowing) {
                // Unfollow
                await currentUserRef.update({
                    following: firebase.firestore.FieldValue.arrayRemove(userId)
                });
                window.app?.authManager?.showToast('Nicht mehr gefolgt', 'info');
            } else {
                // Follow
                await currentUserRef.update({
                    following: firebase.firestore.FieldValue.arrayUnion(userId)
                });
                window.app?.authManager?.showToast('Erfolgreich gefolgt! 👥', 'success');
            }
            
            // Update local userDoc
            if (window.app.authManager.userDoc) {
                window.app.authManager.userDoc.following = isFollowing 
                    ? following.filter(id => id !== userId)
                    : [...following, userId];
            }
            
            // Update button if visible
            this.updateFollowButton(userId);
            
        } catch (error) {
            console.error('❌ Error following user:', error);
            window.app?.authManager?.showToast('Fehler beim Folgen', 'error');
        }
    }

    async addFriend(userId) {
        if (!window.app?.authManager?.currentUser) {
            window.app?.authManager?.showToast('Bitte melde dich an um Freunde hinzuzufügen', 'error');
            return;
        }
        
        const currentUserId = window.app.authManager.currentUser.uid;
        if (currentUserId === userId) {
            window.app?.authManager?.showToast('Du kannst dich nicht selbst als Freund hinzufügen', 'error');
            return;
        }
        
        try {
            // Simplified approach - add to current user's friend requests sent
            const currentUserRef = window.firebaseServices.db.collection('users').doc(currentUserId);
            const currentUserDoc = await currentUserRef.get();
            const currentUserData = currentUserDoc.data();
            
            const friendRequestsSent = currentUserData.friendRequestsSent || [];
            
            if (friendRequestsSent.includes(userId)) {
                window.app?.authManager?.showToast('Freundschaftsanfrage bereits gesendet', 'info');
                return;
            }
            
            // Add to sent requests
            await currentUserRef.update({
                friendRequestsSent: firebase.firestore.FieldValue.arrayUnion(userId)
            });
            
            // Update local userDoc
            if (window.app.authManager.userDoc) {
                window.app.authManager.userDoc.friendRequestsSent = [...friendRequestsSent, userId];
            }
            
            window.app?.authManager?.showToast('Freundschaftsanfrage gesendet! 🤝', 'success');
            
        } catch (error) {
            console.error('❌ Error adding friend:', error);
            window.app?.authManager?.showToast('Fehler beim Hinzufügen als Freund', 'error');
        }
    }

    async updateFollowButton(userId) {
        const followBtn = document.querySelector(`.follow-btn[data-user-id="${userId}"]`);
        if (!followBtn) return;
        
        try {
            const currentUserId = window.app?.authManager?.currentUser?.uid;
            if (!currentUserId) return;
            
            const currentUserDoc = await window.firebaseServices.db
                .collection('users')
                .doc(currentUserId)
                .get();
            
            const following = currentUserDoc.data()?.following || [];
            const isFollowing = following.includes(userId);
            
            if (isFollowing) {
                followBtn.innerHTML = '<i class="fas fa-user-check"></i> Gefolgt';
                followBtn.classList.add('following');
            } else {
                followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Folgen';
                followBtn.classList.remove('following');
            }
        } catch (error) {
            console.error('❌ Error updating follow button:', error);
        }
    }

    sharePost(postId) {
        const url = `${window.location.origin}${window.location.pathname}#post=${postId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'RopeHub Post',
                text: 'Schau dir diesen Post auf RopeHub an!',
                url: url
            }).catch(error => {
                console.log('Share cancelled or failed:', error);
            });
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                window.app?.authManager?.showToast('Link kopiert! 📋', 'success');
            }).catch(() => {
                window.app?.authManager?.showToast('Fehler beim Kopieren', 'error');
            });
        }
    }
}

window.FeedManager = FeedManager;



























