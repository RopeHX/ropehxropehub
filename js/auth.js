// 🔐 AUTH MANAGER - NORISK STYLE
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userDoc = null;
    }

    init() {
        console.log('🔐 Auth Manager initializing...');
        this.setupAuthForms();
        this.setupAuthStateListener();
        console.log('✅ Auth Manager initialized');
    }

    setupAuthForms() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToRegister();
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToLogin();
            });
        }
    }

    setupAuthStateListener() {
        if (!window.firebaseServices?.auth) {
            setTimeout(() => this.setupAuthStateListener(), 100);
            return;
        }
        
        window.firebaseServices.auth.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail')?.value?.trim();
        const password = document.getElementById('loginPassword')?.value;
        
        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            await window.firebaseServices.auth.signInWithEmailAndPassword(email, password);
            this.showToast('Welcome back!', 'success');
        } catch (error) {
            console.error('❌ Login error:', error);
            this.showToast(this.getErrorMessage(error.code), 'error');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const name = document.getElementById('registerName')?.value?.trim();
        const email = document.getElementById('registerEmail')?.value?.trim();
        const password = document.getElementById('registerPassword')?.value;
        
        if (!name || !email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            const userCredential = await window.firebaseServices.auth.createUserWithEmailAndPassword(email, password);
            await this.createUserProfile(userCredential.user, name);
            this.showToast('Account created successfully!', 'success');
        } catch (error) {
            console.error('❌ Register error:', error);
            this.showToast(this.getErrorMessage(error.code), 'error');
        }
    }

    async createUserProfile(user, displayName) {
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            username: displayName.toLowerCase().replace(/\s+/g, ''),
            avatar: null,
            bio: '',
            status: 'online',
            role: 'user',
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };
        
        await window.firebaseServices.db.collection('users').doc(user.uid).set(userData);
    }

    async handleAuthStateChange(user) {
        if (user) {
            this.currentUser = user;
            try {
                const userDoc = await window.firebaseServices.db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    this.userDoc = userDoc.data();
                    this.updateUserDisplay();
                }
                this.showMainApp();
                
                // Freunde laden nach erfolgreichem Login
                if (window.app?.friendsManager) {
                    window.app.friendsManager.loadFriends();
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                this.showMainApp();
            }
        } else {
            this.currentUser = null;
            this.userDoc = null;
            this.showLoginScreen();
        }
    }

    updateUserDisplay() {
        if (!this.userDoc) return;
        
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const dropdownName = document.getElementById('dropdownName');
        const dropdownEmail = document.getElementById('dropdownEmail');
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        
        const displayName = this.userDoc.displayName || this.userDoc.email;
        const initial = (this.userDoc.displayName || 'U').charAt(0).toUpperCase();
        const avatarUrl = this.userDoc.avatar || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%238b5cf6"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">${initial}</text></svg>`;
        
        if (userName) userName.textContent = displayName;
        if (userAvatar) userAvatar.src = avatarUrl;
        if (dropdownName) dropdownName.textContent = displayName;
        if (dropdownEmail) dropdownEmail.textContent = this.userDoc.email;
        if (dropdownAvatar) dropdownAvatar.src = avatarUrl;
        
        // Setup user menu functionality
        this.setupUserMenu();
    }

    setupUserMenu() {
        const userMenu = document.getElementById('userMenu');
        const userDropdown = document.getElementById('userDropdown');
        
        if (!userMenu || !userDropdown) return;
        
        // Remove existing listeners to prevent duplicates
        userMenu.replaceWith(userMenu.cloneNode(true));
        const newUserMenu = document.getElementById('userMenu');
        
        // Single click handler for toggle
        newUserMenu.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isHidden = userDropdown.classList.contains('hidden');
            
            if (isHidden) {
                userDropdown.classList.remove('hidden');
                console.log('🔽 Dropdown opened');
            } else {
                userDropdown.classList.add('hidden');
                console.log('🔼 Dropdown closed');
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!newUserMenu.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
        
        // Handle dropdown actions with event delegation
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const actionElement = e.target.closest('[data-action]');
            if (!actionElement) return;
            
            const action = actionElement.dataset.action;
            console.log(`🎯 Action clicked: ${action}`);
            
            // Close dropdown first
            userDropdown.classList.add('hidden');
            
            // Handle action
            switch (action) {
                case 'profile':
                    this.openProfileModal();
                    break;
                case 'settings':
                    this.openSettingsModal();
                    break;
                case 'appearance':
                    this.openAppearanceModal();
                    break;
                case 'logout':
                    this.handleLogout();
                    break;
                default:
                    console.log(`❓ Unknown action: ${action}`);
            }
        });
        
        console.log('✅ User menu setup complete');
    }

    openProfileModal() {
        console.log('🔧 Opening profile modal...');
        
        const modalContent = `
            <div class="profile-modal">
                <div class="profile-modal-header">
                    <h2><i class="fas fa-user-edit"></i> <span data-i18n="edit_profile_title">Profil bearbeiten</span></h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="profile-modal-content">
                    <!-- Banner Section -->
                    <div class="profile-section">
                        <label class="profile-label">Banner</label>
                        <div class="banner-edit-container">
                            <div class="current-banner" id="profileBannerPreview" style="${this.getBannerStyle()}">
                                <div class="banner-overlay">
                                    <i class="fas fa-camera"></i>
                                    <span>Banner ändern</span>
                                </div>
                            </div>
                            <input type="file" id="bannerUpload" accept="image/*" style="display: none;">
                            <div class="banner-actions">
                                <button class="btn-secondary" onclick="document.getElementById('bannerUpload').click()">
                                    <i class="fas fa-upload"></i> Bild hochladen
                                </button>
                                <button class="btn-outline" onclick="window.app.authManager.showBannerGradients()">
                                    <i class="fas fa-palette"></i> Farbverlauf
                                </button>
                                <button class="btn-outline" onclick="window.app.authManager.removeBanner()">
                                    <i class="fas fa-trash"></i> Entfernen
                                </button>
                            </div>
                            
                            <!-- Gradient Picker -->
                            <div class="gradient-picker-section hidden" id="bannerGradientPicker">
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
                            
                            <!-- Image Controls -->
                            <div class="image-controls-section hidden" id="bannerImageControls">
                                <div class="control-group">
                                    <label for="bannerPositionX">Position X:</label>
                                    <input type="range" id="bannerPositionX" min="0" max="100" value="50" class="slider">
                                </div>
                                <div class="control-group">
                                    <label for="bannerPositionY">Position Y:</label>
                                    <input type="range" id="bannerPositionY" min="0" max="100" value="50" class="slider">
                                </div>
                                <div class="control-group">
                                    <label for="bannerScale">Zoom:</label>
                                    <input type="range" id="bannerScale" min="100" max="200" value="100" class="slider">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Avatar Section -->
                    <div class="profile-section">
                        <label class="profile-label" data-i18n="profile_picture">Profilbild</label>
                        <div class="avatar-upload-container">
                            <div class="current-avatar">
                                <img id="profilePreview" src="${this.userDoc?.avatar || this.generateDefaultAvatar()}" alt="Avatar">
                                <div class="avatar-overlay">
                                    <i class="fas fa-camera"></i>
                                    <span data-i18n="change">Ändern</span>
                                </div>
                            </div>
                            <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                            <div class="avatar-actions">
                                <button class="btn-secondary" onclick="document.getElementById('avatarUpload').click()">
                                    <i class="fas fa-upload"></i> <span data-i18n="upload_image">Bild hochladen</span>
                                </button>
                                <button class="btn-outline" onclick="window.app.authManager.removeAvatar()">
                                    <i class="fas fa-trash"></i> <span data-i18n="remove">Entfernen</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Display Name Section -->
                    <div class="profile-section">
                        <label class="profile-label" for="displayNameInput" data-i18n="display_name">Anzeigename</label>
                        <input type="text" id="displayNameInput" class="profile-input" 
                               value="${this.userDoc?.displayName || ''}" 
                               data-i18n-placeholder="display_name_placeholder" placeholder="Dein Anzeigename" maxlength="32">
                        <small class="input-hint" data-i18n="display_name_hint">Dieser Name wird anderen Nutzern angezeigt</small>
                    </div>
                    
                    <!-- Bio Section -->
                    <div class="profile-section">
                        <label class="profile-label" for="bioInput">Bio</label>
                        <textarea id="bioInput" class="profile-textarea" 
                                  placeholder="Erzähle anderen etwas über dich..." 
                                  maxlength="160" rows="3">${this.userDoc?.bio || ''}</textarea>
                        <small class="input-hint">Beschreibe dich in wenigen Worten (max. 160 Zeichen)</small>
                    </div>
                    
                    <!-- User Info Section -->
                    <div class="profile-section">
                        <label class="profile-label" data-i18n="user_information">Benutzer-Informationen</label>
                        <div class="user-info-grid">
                            <div class="info-item">
                                <span class="info-label" data-i18n="email_label">E-Mail</span>
                                <span class="info-value">${this.userDoc?.email || window.i18n.t('not_available')}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Username</span>
                                <span class="info-value">@${this.userDoc?.username || 'user'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label" data-i18n="rank">Rang</span>
                                <span class="info-value rank-badge ${this.userDoc?.role || 'user'}">
                                    <i class="fas fa-star"></i>
                                    ${this.getRankDisplay(this.userDoc?.role)}
                                </span>
                            </div>
                            <div class="info-item">
                                <span class="info-label" data-i18n="member_since">Mitglied seit</span>
                                <span class="info-value">${this.formatDate(this.userDoc?.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="profile-modal-footer">
                    <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()" data-i18n="cancel">
                        Abbrechen
                    </button>
                    <button class="btn-primary" onclick="window.app.authManager.saveProfile()">
                        <i class="fas fa-save"></i> <span data-i18n="save">Speichern</span>
                    </button>
                </div>
            </div>
        `;
        
        this.showModal(modalContent);
        this.setupAvatarUpload();
        this.setupBannerEditor();
        
        // Update translations in modal
        setTimeout(() => {
            window.i18n.updateAllTexts();
        }, 100);
    }

    showModal(content) {
        // Remove existing modal if any
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `<div class="modal profile-edit-modal">${content}</div>`;
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
            }
        });
        
        console.log('✅ Profile modal opened');
    }

    setupAvatarUpload() {
        const avatarUpload = document.getElementById('avatarUpload');
        const profilePreview = document.getElementById('profilePreview');
        const avatarContainer = document.querySelector('.current-avatar');
        
        if (avatarUpload && profilePreview) {
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleAvatarUpload(file, profilePreview);
                }
            });
        }
        
        if (avatarContainer) {
            avatarContainer.addEventListener('click', () => {
                avatarUpload?.click();
            });
        }
    }

    async handleAvatarUpload(file, previewElement) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showToast('Bitte wähle eine gültige Bilddatei aus', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showToast('Bild ist zu groß. Maximum: 5MB', 'error');
            return;
        }
        
        try {
            // Compress and resize image
            const compressedImage = await this.compressImage(file, 200, 200, 0.8);
            
            // Show preview
            previewElement.src = compressedImage;
            previewElement.dataset.newAvatar = compressedImage;
            
            this.showToast('Avatar ausgewählt! Klicke "Speichern" um zu übernehmen.', 'success');
        } catch (error) {
            console.error('❌ Error processing avatar:', error);
            this.showToast('Fehler beim Verarbeiten des Bildes', 'error');
        }
    }

    async removeAvatar() {
        const profilePreview = document.getElementById('profilePreview');
        if (profilePreview) {
            profilePreview.src = this.generateDefaultAvatar();
            profilePreview.dataset.newAvatar = '';
        }
        this.showToast('Avatar entfernt! Klicke "Speichern" um zu übernehmen.', 'info');
    }

    getBannerStyle() {
        if (!this.userDoc?.banner) {
            return 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
        
        if (typeof this.userDoc.banner === 'string') {
            return `background: ${this.userDoc.banner}`;
        } else if (this.userDoc.banner.type === 'image') {
            return `background-image: url(${this.userDoc.banner.url}); background-size: ${this.userDoc.banner.size || 'cover'}; background-position: ${this.userDoc.banner.position || 'center'}`;
        }
        
        return 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    setupBannerEditor() {
        const bannerUpload = document.getElementById('bannerUpload');
        const bannerPreview = document.getElementById('profileBannerPreview');
        const gradientOptions = document.querySelectorAll('.gradient-option');
        const bannerContainer = document.querySelector('.current-banner');
        
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
        if (bannerContainer) {
            bannerContainer.addEventListener('click', () => {
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
                document.getElementById('bannerImageControls')?.classList.add('hidden');
                
                // Update selection
                gradientOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
        
        // Image adjustment controls
        const positionX = document.getElementById('bannerPositionX');
        const positionY = document.getElementById('bannerPositionY');
        const scale = document.getElementById('bannerScale');
        
        [positionX, positionY, scale].forEach(control => {
            if (control) {
                control.addEventListener('input', () => {
                    this.updateBannerImage();
                });
            }
        });
    }

    async handleBannerUpload(file) {
        if (!file.type.startsWith('image/')) {
            this.showToast('Bitte wähle eine gültige Bilddatei aus', 'error');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showToast('Bild ist zu groß. Maximum: 10MB', 'error');
            return;
        }
        
        try {
            // Compress and resize banner image
            const compressedImage = await this.compressImage(file, 800, 300, 0.8);
            
            const bannerPreview = document.getElementById('profileBannerPreview');
            if (bannerPreview) {
                bannerPreview.style.backgroundImage = `url(${compressedImage})`;
                bannerPreview.style.backgroundSize = 'cover';
                bannerPreview.style.backgroundPosition = 'center';
                bannerPreview.dataset.newBanner = compressedImage;
                bannerPreview.dataset.bannerType = 'image';
                
                // Show image controls
                document.getElementById('bannerImageControls')?.classList.remove('hidden');
                
                // Clear gradient selection
                document.querySelectorAll('.gradient-option').forEach(opt => opt.classList.remove('selected'));
            }
            
            this.showToast('Banner ausgewählt! Klicke "Speichern" um zu übernehmen.', 'success');
        } catch (error) {
            console.error('❌ Error processing banner:', error);
            this.showToast('Fehler beim Verarbeiten des Bildes', 'error');
        }
    }

    showBannerGradients() {
        const gradientPicker = document.getElementById('bannerGradientPicker');
        if (gradientPicker) {
            gradientPicker.classList.toggle('hidden');
        }
    }

    updateBannerImage() {
        const bannerPreview = document.getElementById('profileBannerPreview');
        const positionX = document.getElementById('bannerPositionX')?.value || 50;
        const positionY = document.getElementById('bannerPositionY')?.value || 50;
        const scale = document.getElementById('bannerScale')?.value || 100;
        
        if (bannerPreview && bannerPreview.dataset.bannerType === 'image') {
            bannerPreview.style.backgroundPosition = `${positionX}% ${positionY}%`;
            bannerPreview.style.backgroundSize = `${scale}%`;
        }
    }

    removeBanner() {
        const bannerPreview = document.getElementById('profileBannerPreview');
        if (bannerPreview) {
            bannerPreview.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            bannerPreview.dataset.newBanner = '';
            bannerPreview.dataset.bannerType = 'gradient';
            
            // Hide controls
            document.getElementById('bannerImageControls')?.classList.add('hidden');
            document.getElementById('bannerGradientPicker')?.classList.add('hidden');
            
            // Clear selections
            document.querySelectorAll('.gradient-option').forEach(opt => opt.classList.remove('selected'));
        }
        this.showToast('Banner entfernt! Klicke "Speichern" um zu übernehmen.', 'info');
    }

    async saveProfile() {
        const displayNameInput = document.getElementById('displayNameInput');
        const bioInput = document.getElementById('bioInput');
        const profilePreview = document.getElementById('profilePreview');
        const bannerPreview = document.getElementById('profileBannerPreview');
        
        if (!displayNameInput) return;
        
        const newDisplayName = displayNameInput.value.trim();
        const newBio = bioInput?.value.trim() || '';
        const newAvatar = profilePreview?.dataset.newAvatar;
        const newBanner = bannerPreview?.dataset.newBanner;
        
        if (!newDisplayName) {
            this.showToast('Anzeigename darf nicht leer sein', 'error');
            return;
        }
        
        try {
            const updates = {
                displayName: newDisplayName,
                username: newDisplayName.toLowerCase().replace(/\s+/g, ''),
                bio: newBio,
                lastUpdated: new Date().toISOString(),
                displayNameLower: newDisplayName.toLowerCase()
            };
            
            // Handle avatar update
            if (newAvatar !== undefined) {
                if (newAvatar === '') {
                    updates.avatar = null;
                } else if (newAvatar.startsWith('data:')) {
                    // Validate size before saving
                    const avatarSize = (newAvatar.length * 3) / 4;
                    if (avatarSize > 500 * 1024) {
                        this.showToast('Avatar zu groß. Bitte wähle ein kleineres Bild.', 'error');
                        return;
                    }
                    updates.avatar = newAvatar;
                }
            }
            
            // Handle banner update
            if (newBanner !== undefined) {
                if (newBanner === '') {
                    updates.banner = null;
                } else if (bannerPreview?.dataset.bannerType === 'image') {
                    // Validate banner size
                    const bannerSize = (newBanner.length * 3) / 4;
                    if (bannerSize > 500 * 1024) {
                        this.showToast('Banner zu groß. Bitte wähle ein kleineres Bild.', 'error');
                        return;
                    }
                    
                    const positionX = document.getElementById('bannerPositionX')?.value || 50;
                    const positionY = document.getElementById('bannerPositionY')?.value || 50;
                    const scale = document.getElementById('bannerScale')?.value || 100;
                    
                    updates.banner = {
                        type: 'image',
                        url: newBanner,
                        position: `${positionX}% ${positionY}%`,
                        size: `${scale}%`
                    };
                } else {
                    updates.banner = newBanner;
                }
            }
            
            // Check total document size estimate
            const estimatedSize = JSON.stringify(updates).length;
            if (estimatedSize > 800 * 1024) { // 800KB safety margin
                this.showToast('Profildaten zu groß. Bitte verwende kleinere Bilder.', 'error');
                return;
            }
            
            await window.firebaseServices.db.collection('users').doc(this.currentUser.uid).update(updates);
            
            // Update local userDoc
            this.userDoc = { ...this.userDoc, ...updates };
            this.updateUserDisplay();
            
            this.showToast('Profil erfolgreich aktualisiert! 🎨', 'success');
            document.querySelector('.modal-overlay')?.remove();
            
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            if (error.code === 'invalid-argument' && error.message.includes('size')) {
                this.showToast('Profildaten zu groß. Bitte verwende kleinere Bilder.', 'error');
            } else {
                this.showToast('Fehler beim Speichern des Profils', 'error');
            }
        }
    }

    generateDefaultAvatar() {
        const initial = (this.userDoc?.displayName || this.userDoc?.email || 'U').charAt(0).toUpperCase();
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%238b5cf6"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">${initial}</text></svg>`;
    }

    getRankDisplay(role) {
        return window.i18n.t(`rank_${role || 'user'}`);
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
                month: 'long', 
                day: 'numeric' 
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Unbekannt';
        }
    }

    openSettingsModal() {
        console.log('⚙️ Opening settings modal...');
        
        const settings = window.app?.settingsManager?.settings || {};
        
        const modalContent = `
            <div class="settings-modal">
                <div class="settings-modal-header">
                    <h2><i class="fas fa-cog"></i> <span data-i18n="settings">Einstellungen</span></h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="settings-modal-content">
                    <!-- Language Section -->
                    <div class="settings-section">
                        <div class="setting-header">
                            <i class="fas fa-globe setting-icon"></i>
                            <div>
                                <label class="settings-label" data-i18n="language">Sprache</label>
                                <p class="settings-description" data-i18n="language_description">Wähle deine bevorzugte Sprache</p>
                            </div>
                        </div>
                        <div class="language-selector">
                            <button class="language-option ${window.i18n?.currentLanguage === 'de' ? 'active' : ''}" 
                                    onclick="window.i18n.setLanguage('de'); this.parentElement.querySelectorAll('.language-option').forEach(el => el.classList.remove('active')); this.classList.add('active');">
                                <span class="flag">🇩🇪</span>
                                <span data-i18n="german">Deutsch</span>
                            </button>
                            <button class="language-option ${window.i18n?.currentLanguage === 'en' ? 'active' : ''}" 
                                    onclick="window.i18n.setLanguage('en'); this.parentElement.querySelectorAll('.language-option').forEach(el => el.classList.remove('active')); this.classList.add('active');">
                                <span class="flag">🇺🇸</span>
                                <span data-i18n="english">Englisch</span>
                            </button>
                        </div>
                    </div>

                    <!-- Appearance Section -->
                    <div class="settings-section">
                        <div class="setting-header">
                            <i class="fas fa-palette setting-icon"></i>
                            <div>
                                <label class="settings-label" data-i18n="appearance">Erscheinungsbild</label>
                                <p class="settings-description" data-i18n="appearance_description">Personalisiere das Aussehen der App</p>
                            </div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-name" data-i18n="dark_mode">Dark Mode</span>
                                <span class="setting-desc" data-i18n="dark_mode_desc">Dunkles Design für die Augen</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" ${settings.darkMode ? 'checked' : ''} 
                                       onchange="window.app.settingsManager.toggleDarkMode()">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <!-- Notifications Section - SIMPLIFIED -->
                    <div class="settings-section">
                        <div class="setting-header">
                            <i class="fas fa-bell setting-icon"></i>
                            <div>
                                <label class="settings-label" data-i18n="notifications">Benachrichtigungen</label>
                                <p class="settings-description" data-i18n="notifications_description">Verwalte deine Benachrichtigungseinstellungen</p>
                            </div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-name" data-i18n="all_notifications">Alle Benachrichtigungen</span>
                                <span class="setting-desc" data-i18n="all_notifications_desc">Push-Nachrichten, Sounds und Browser-Benachrichtigungen</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" ${settings.notifications ? 'checked' : ''} 
                                       onchange="window.app.settingsManager.toggleAllNotifications()">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <!-- Privacy & Security Section -->
                    <div class="settings-section">
                        <div class="setting-header">
                            <i class="fas fa-shield-alt setting-icon"></i>
                            <div>
                                <label class="settings-label" data-i18n="privacy_security">Privatsphäre & Sicherheit</label>
                                <p class="settings-description" data-i18n="privacy_security_desc">Verwalte deine Konto-Sicherheit</p>
                            </div>
                        </div>
                        <div class="setting-item clickable" onclick="window.app.authManager.openChangePasswordModal()">
                            <div class="setting-info">
                                <span class="setting-name" data-i18n="change_password">Passwort ändern</span>
                                <span class="setting-desc" data-i18n="change_password_desc">Aktualisiere dein Passwort</span>
                            </div>
                            <i class="fas fa-chevron-right setting-arrow"></i>
                        </div>
                        <div class="setting-item clickable" onclick="window.app.settingsManager.exportData()">
                            <div class="setting-info">
                                <span class="setting-name" data-i18n="export_data">Daten exportieren</span>
                                <span class="setting-desc" data-i18n="export_data_desc">Lade deine Daten herunter</span>
                            </div>
                            <i class="fas fa-chevron-right setting-arrow"></i>
                        </div>
                    </div>

                    <!-- Danger Zone -->
                    <div class="settings-section danger-zone">
                        <div class="setting-header">
                            <i class="fas fa-exclamation-triangle setting-icon"></i>
                            <div>
                                <label class="settings-label" data-i18n="danger_zone">Gefahrenbereich</label>
                                <p class="settings-description" data-i18n="danger_zone_desc">Irreversible Aktionen</p>
                            </div>
                        </div>
                        <div class="setting-item clickable danger" onclick="window.app.authManager.openDeleteAccountModal()">
                            <div class="setting-info">
                                <span class="setting-name" data-i18n="delete_account">Konto löschen</span>
                                <span class="setting-desc" data-i18n="delete_account_desc">Lösche dein Konto permanent</span>
                            </div>
                            <i class="fas fa-chevron-right setting-arrow"></i>
                        </div>
                    </div>
                </div>
                
                <div class="settings-modal-footer">
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-check"></i> <span data-i18n="close">Schließen</span>
                    </button>
                </div>
            </div>
        `;
        
        this.showModal(modalContent);
        
        // Update translations in modal
        setTimeout(() => {
            window.i18n.updateAllTexts();
        }, 100);
    }

    openChangePasswordModal() {
        const modalContent = `
            <div class="password-modal">
                <div class="password-modal-header">
                    <h2><i class="fas fa-key"></i> <span data-i18n="change_password">Passwort ändern</span></h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="password-modal-content">
                    <div class="input-group">
                        <label data-i18n="current_password">Aktuelles Passwort</label>
                        <input type="password" id="currentPassword" class="profile-input" required>
                    </div>
                    <div class="input-group">
                        <label data-i18n="new_password">Neues Passwort</label>
                        <input type="password" id="newPassword" class="profile-input" minlength="6" required>
                    </div>
                    <div class="input-group">
                        <label data-i18n="confirm_password">Passwort bestätigen</label>
                        <input type="password" id="confirmPassword" class="profile-input" minlength="6" required>
                    </div>
                </div>
                
                <div class="password-modal-footer">
                    <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()" data-i18n="cancel">
                        Abbrechen
                    </button>
                    <button class="btn-primary" onclick="window.app.authManager.handlePasswordChange()">
                        <i class="fas fa-save"></i> <span data-i18n="change_password">Passwort ändern</span>
                    </button>
                </div>
            </div>
        `;
        
        this.showModal(modalContent);
        setTimeout(() => window.i18n.updateAllTexts(), 100);
    }

    openDeleteAccountModal() {
        const modalContent = `
            <div class="delete-modal">
                <div class="delete-modal-header">
                    <h2><i class="fas fa-exclamation-triangle"></i> <span data-i18n="delete_account">Konto löschen</span></h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="delete-modal-content">
                    <div class="warning-box">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p data-i18n="delete_warning">Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Daten werden permanent gelöscht.</p>
                    </div>
                    <div class="input-group">
                        <label data-i18n="confirm_password_delete">Passwort zur Bestätigung</label>
                        <input type="password" id="deletePassword" class="profile-input" required>
                    </div>
                    <div class="input-group">
                        <label data-i18n="type_delete">Tippe "LÖSCHEN" um zu bestätigen</label>
                        <input type="text" id="deleteConfirm" class="profile-input" required>
                    </div>
                </div>
                
                <div class="delete-modal-footer">
                    <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()" data-i18n="cancel">
                        Abbrechen
                    </button>
                    <button class="btn-danger" onclick="window.app.authManager.handleAccountDelete()">
                        <i class="fas fa-trash"></i> <span data-i18n="delete_account">Konto löschen</span>
                    </button>
                </div>
            </div>
        `;
        
        this.showModal(modalContent);
        setTimeout(() => window.i18n.updateAllTexts(), 100);
    }

    async handlePasswordChange() {
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('fill_all_fields', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showToast('passwords_dont_match', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showToast('password_too_short', 'error');
            return;
        }
        
        try {
            await window.app.settingsManager.changePassword(currentPassword, newPassword);
            document.querySelector('.modal-overlay')?.remove();
        } catch (error) {
            console.error('❌ Password change error:', error);
            this.showToast('password_change_error', 'error');
        }
    }

    async handleAccountDelete() {
        const password = document.getElementById('deletePassword')?.value;
        const confirmation = document.getElementById('deleteConfirm')?.value;
        
        if (!password || !confirmation) {
            this.showToast('fill_all_fields', 'error');
            return;
        }
        
        if (confirmation !== 'LÖSCHEN') {
            this.showToast('delete_confirmation_wrong', 'error');
            return;
        }
        
        try {
            await window.app.settingsManager.deleteAccount(password);
            document.querySelector('.modal-overlay')?.remove();
        } catch (error) {
            console.error('❌ Account deletion error:', error);
            this.showToast('account_delete_error', 'error');
        }
    }

    openAppearanceModal() {
        console.log('🎨 Opening appearance modal...');
        // TODO: Implement appearance modal
        this.showToast('Theme-Editor kommt bald!', 'info');
    }

    switchToRegister() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
    }

    switchToLogin() {
        const registerForm = document.getElementById('registerForm');
        const loginForm = document.getElementById('loginForm');
        
        if (registerForm) registerForm.classList.add('hidden');
        if (loginForm) loginForm.classList.remove('hidden');
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
    }

    showMainApp() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
        
        // Beta Banner anzeigen (falls nicht bereits geschlossen)
        this.initBetaBanner();
    }

    initBetaBanner() {
        const bannerClosed = localStorage.getItem('betaBannerClosed');
        if (bannerClosed === 'true') return;

        setTimeout(() => {
            const banner = document.getElementById('betaBanner');
            const mainApp = document.getElementById('mainApp');
            
            if (banner) {
                banner.classList.remove('hidden');
                setTimeout(() => {
                    banner.classList.add('show');
                    if (mainApp) mainApp.classList.add('beta-active');
                }, 100);
            }
        }, 1000);
    }

    closeBetaBanner() {
        const banner = document.getElementById('betaBanner');
        const mainApp = document.getElementById('mainApp');
        
        if (banner) {
            banner.classList.remove('show');
            if (mainApp) mainApp.classList.remove('beta-active');
            
            setTimeout(() => banner.classList.add('hidden'), 600);
            localStorage.setItem('betaBannerClosed', 'true');
        }
    }

    async handleLogout() {
        try {
            await window.firebaseServices.auth.signOut();
            this.showToast('Logged out successfully', 'success');
        } catch (error) {
            console.error('❌ Logout error:', error);
            this.showToast('Error logging out', 'error');
        }
    }

    getErrorMessage(errorCode) {
        const messages = {
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/invalid-email': 'Invalid email address',
            'auth/email-already-in-use': 'Email already registered',
            'auth/weak-password': 'Password too weak (minimum 6 characters)',
            'auth/too-many-requests': 'Too many attempts. Try again later',
            'auth/network-request-failed': 'Network error. Check your connection'
        };
        return messages[errorCode] || 'Authentication failed. Please try again.';
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    showToast(message, type = 'info') {
        // Use translated message if it's a key
        const translatedMessage = window.i18n.t(message) !== message ? window.i18n.t(message) : message;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${translatedMessage}</span>
            </div>
        `;
        
        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    async compressImage(file, maxWidth, maxHeight, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                // Maintain aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                // Set canvas size
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with compression
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // Check size (should be under 500KB for safety)
                const sizeInBytes = (compressedDataUrl.length * 3) / 4;
                if (sizeInBytes > 500 * 1024) {
                    // Try with lower quality
                    const lowerQuality = quality * 0.7;
                    if (lowerQuality > 0.3) {
                        this.compressImage(file, maxWidth, maxHeight, lowerQuality)
                            .then(resolve)
                            .catch(reject);
                        return;
                    } else {
                        reject(new Error('Image too large even after compression'));
                        return;
                    }
                }
                
                resolve(compressedDataUrl);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }
}

window.AuthManager = AuthManager;






















