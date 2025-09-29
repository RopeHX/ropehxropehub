// 🎨 UI MANAGER - NORISK STYLE
class UIManager {
    constructor() {
        this.currentView = 'feed';
    }

    init() {
        console.log('🎨 UI Manager initializing...');
        this.setupNavigation();
        this.setupPostComposer();
        this.setupSidebarToggle();
        this.initBetaBanner();
        console.log('✅ UI Manager initialized');
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                if (view) {
                    this.showView(view); // Changed from switchView to showView
                }
            });
        });
    }

    setupPostComposer() {
        const createPostBtn = document.getElementById('createPostBtn');
        const postComposer = document.getElementById('postComposer');
        const cancelPost = document.getElementById('cancelPost');
        const submitPost = document.getElementById('submitPost');

        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => {
                if (postComposer) {
                    postComposer.classList.remove('hidden');
                    this.updateComposerAvatar();
                }
            });
        }

        if (cancelPost) {
            cancelPost.addEventListener('click', () => {
                if (postComposer) {
                    postComposer.classList.add('hidden');
                }
                const postContent = document.getElementById('postContent');
                if (postContent) {
                    postContent.value = '';
                }
                this.clearMediaPreview();
            });
        }

        if (submitPost) {
            submitPost.addEventListener('click', () => {
                const content = document.getElementById('postContent')?.value?.trim();
                const mediaData = this.getMediaData();
                
                if ((content || mediaData) && window.app?.feedManager) {
                    window.app.feedManager.createPost(content, mediaData);
                    if (postComposer) {
                        postComposer.classList.add('hidden');
                    }
                    const postContent = document.getElementById('postContent');
                    if (postContent) {
                        postContent.value = '';
                    }
                    this.clearMediaPreview();
                }
            });
        }

        // Setup media upload
        this.setupMediaUpload();
    }

    getMediaData() {
        const previewContainer = document.getElementById('mediaPreview');
        if (!previewContainer || previewContainer.classList.contains('hidden')) {
            return null;
        }
        
        const img = previewContainer.querySelector('.media-preview-img');
        if (img) {
            return {
                type: 'image',
                url: img.src,
                mimeType: 'image/jpeg'
            };
        }
        
        return null;
    }

    updateComposerAvatar() {
        const composerAvatar = document.querySelector('.composer-avatar');
        if (!composerAvatar) return;

        const userDoc = window.app?.authManager?.userDoc;
        if (userDoc?.avatar) {
            composerAvatar.src = userDoc.avatar;
        } else {
            const initial = (userDoc?.displayName || userDoc?.email || 'U').charAt(0).toUpperCase();
            composerAvatar.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%238b5cf6"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">${initial}</text></svg>`;
        }
    }

    setupMediaUpload() {
        // Image upload
        const imageBtn = document.querySelector('.option-btn[data-type="image"]');
        const imageInput = document.getElementById('imageUpload');
        
        if (imageBtn && imageInput) {
            imageBtn.addEventListener('click', () => imageInput.click());
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // Emoji picker
        const emojiBtn = document.querySelector('.option-btn[data-type="emoji"]');
        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => this.showEmojiPicker());
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            window.app?.authManager?.showToast('Bitte wähle eine gültige Bilddatei aus', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            window.app?.authManager?.showToast('Bild ist zu groß. Maximum: 10MB', 'error');
            return;
        }

        // Compress image for posts
        this.compressImageForPost(file).then(compressedImage => {
            this.showMediaPreview('image', compressedImage, file.name);
        }).catch(error => {
            console.error('❌ Error compressing image:', error);
            window.app?.authManager?.showToast('Fehler beim Verarbeiten des Bildes', 'error');
        });
    }

    async compressImageForPost(file, maxWidth = 1200, maxHeight = 800, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
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
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // Check size and reduce quality if needed
                const sizeInBytes = (compressedDataUrl.length * 3) / 4;
                if (sizeInBytes > 800 * 1024 && quality > 0.5) {
                    this.compressImageForPost(file, maxWidth, maxHeight, quality * 0.8)
                        .then(resolve)
                        .catch(reject);
                    return;
                }
                
                resolve(compressedDataUrl);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    showMediaPreview(type, src, filename) {
        const previewContainer = document.getElementById('mediaPreview');
        if (!previewContainer) return;

        previewContainer.innerHTML = `
            <div class="media-preview-item">
                <img src="${src}" alt="Preview" class="media-preview-img">
                <div class="media-preview-info">
                    <span class="media-filename">${filename}</span>
                    <button class="media-remove-btn" onclick="window.app.uiManager.clearMediaPreview()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        previewContainer.classList.remove('hidden');
    }

    clearMediaPreview() {
        const previewContainer = document.getElementById('mediaPreview');
        if (previewContainer) {
            previewContainer.innerHTML = '';
            previewContainer.classList.add('hidden');
        }
        
        // Clear file inputs
        const imageInput = document.getElementById('imageUpload');
        if (imageInput) imageInput.value = '';
    }

    showEmojiPicker() {
        const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        const modalContent = `
            <div class="emoji-picker-modal">
                <div class="emoji-picker-header">
                    <h3>Emoji auswählen 😊</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="emoji-grid">
                    ${emojis.map(emoji => 
                        `<button class="emoji-btn" onclick="window.app.uiManager.insertEmoji('${emoji}')">${emoji}</button>`
                    ).join('')}
                </div>
            </div>
        `;

        this.showModal(modalContent);
    }

    insertEmoji(emoji) {
        const textarea = document.getElementById('postContent');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            textarea.value = text.substring(0, start) + emoji + text.substring(end);
            textarea.focus();
            textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        }
        document.querySelector('.modal-overlay')?.remove();
    }

    showModal(content) {
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) existingModal.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `<div class="modal">${content}</div>`;
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show selected view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.add('active');
            
            // Load view-specific content
            if (viewName === 'dm' && window.app?.dmManager) {
                window.app.dmManager.loadConversations();
            } else if (viewName === 'friends' && window.app?.friendsManager) {
                window.app.friendsManager.loadFriends();
            }
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        console.log(`📱 Switched to ${viewName} view`);
    }

    switchView(viewName) {
        this.currentView = viewName;
        this.showView(viewName);
    }

    showToast(message, type = 'info') {
        // Delegate to AuthManager if available
        if (window.app?.authManager) {
            window.app.authManager.showToast(message, type);
            return;
        }
        
        // Fallback toast implementation
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }

    async leaveServer(serverId) {
        const currentUser = window.firebaseServices?.auth?.currentUser;
        if (!currentUser) return;

        try {
            await window.firebaseServices.db
                .collection('servers')
                .doc(serverId)
                .update({
                    members: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
                    memberCount: firebase.firestore.FieldValue.increment(-1)
                });

            window.showNotification('Server verlassen', 'success');

            // Refresh lists
            this.loadMyServers();
            if (this.currentView === 'servers') {
                this.loadServers();
            }
        } catch (error) {
            console.error('❌ Error leaving server:', error);
            window.showNotification('Fehler beim Verlassen des Servers', 'error');
        }
    }

    setupSidebarToggle() {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.setAttribute('aria-label', 'Toggle Sidebar');
        
        // Add to topbar
        const topbarLeft = document.querySelector('.topbar-left');
        if (topbarLeft) {
            topbarLeft.insertBefore(toggleBtn, topbarLeft.firstChild);
        }

        // Toggle functionality
        toggleBtn.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const isClickInsideSidebar = sidebar?.contains(e.target);
            const isToggleButton = e.target.closest('.sidebar-toggle');
            
            if (!isClickInsideSidebar && !isToggleButton && window.innerWidth <= 768) {
                this.closeSidebar();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.openSidebar();
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const contentArea = document.querySelector('.content-area');
        const toggleBtn = document.querySelector('.sidebar-toggle');
        
        if (sidebar?.classList.contains('collapsed')) {
            this.openSidebar();
        } else {
            this.closeSidebar();
        }
    }

    openSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const contentArea = document.querySelector('.content-area');
        const toggleBtn = document.querySelector('.sidebar-toggle i');
        
        sidebar?.classList.remove('collapsed');
        contentArea?.classList.remove('sidebar-collapsed');
        if (toggleBtn) toggleBtn.className = 'fas fa-bars';
    }

    closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const contentArea = document.querySelector('.content-area');
        const toggleBtn = document.querySelector('.sidebar-toggle i');
        
        sidebar?.classList.add('collapsed');
        contentArea?.classList.add('sidebar-collapsed');
        if (toggleBtn) toggleBtn.className = 'fas fa-times';
    }

    // Beta Banner Management
    initBetaBanner() {
        // Prüfen ob Banner bereits geschlossen wurde
        const bannerClosed = localStorage.getItem('betaBannerClosed');
        if (bannerClosed === 'true') {
            return; // Banner nicht anzeigen
        }

        // Banner nach kurzer Verzögerung einblenden
        setTimeout(() => {
            this.showBetaBanner();
        }, 1000);
    }

    showBetaBanner() {
        const banner = document.getElementById('betaBanner');
        const mainApp = document.getElementById('mainApp');
        
        if (banner) {
            banner.classList.remove('hidden');
            
            // Sanfte Einblendung
            setTimeout(() => {
                banner.classList.add('show');
                
                // Main App Layout anpassen
                if (mainApp) {
                    mainApp.classList.add('beta-active');
                }
            }, 100);
        }
    }

    closeBetaBanner() {
        const banner = document.getElementById('betaBanner');
        const mainApp = document.getElementById('mainApp');
        
        if (banner) {
            // Ausblend-Animation
            banner.classList.remove('show');
            
            // Main App Layout zurücksetzen
            if (mainApp) {
                mainApp.classList.remove('beta-active');
            }
            
            // Banner nach Animation komplett entfernen
            setTimeout(() => {
                banner.classList.add('hidden');
            }, 600);
            
            // Status in localStorage speichern
            localStorage.setItem('betaBannerClosed', 'true');
            
            console.log('🚧 Beta Banner geschlossen und gespeichert');
        }
    }
}

window.UIManager = UIManager;
// Initialize UIManager globally
window.UIManager = new UIManager();
console.log('🎨 UIManager loaded and initialized');





















