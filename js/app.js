// 🚀 MAIN APP INITIALIZATION
class App {
    constructor() {
        this.authManager = null;
        this.uiManager = null;
        this.feedManager = null;
        this.settingsManager = null;
    }

    async init() {
        console.log('🚀 RopeHub initializing...');
        
        try {
            // Wait for Firebase to be ready (it's already initializing)
            await this.waitForFirebase();
            
            // Initialize managers
            this.settingsManager = new SettingsManager();
            this.authManager = new AuthManager();
            this.uiManager = new UIManager();
            this.feedManager = new FeedManager();
            this.dmManager = new DMManager();
            this.friendsManager = new FriendsManager(); // Add Friends Manager
            
            // Initialize all systems
            this.settingsManager.init();
            window.i18n.init();
            this.authManager.init();
            this.uiManager.init();
            this.feedManager.init();
            this.dmManager.init();
            this.friendsManager.init(); // Initialize Friends Manager
            
            console.log('✅ RopeHub initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize RopeHub:', error);
        }
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseServices?.auth && window.firebaseServices?.db) {
                    console.log('✅ Firebase services confirmed ready');
                    resolve();
                } else {
                    console.log('⏳ Waiting for Firebase services...');
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});

// Globale Funktion für Beta Banner
window.closeBetaBanner = function() {
    const banner = document.getElementById('betaBanner');
    const mainApp = document.getElementById('mainApp');
    
    if (banner) {
        banner.classList.remove('show');
        if (mainApp) mainApp.classList.remove('beta-active');
        
        setTimeout(() => banner.classList.add('hidden'), 600);
        localStorage.setItem('betaBannerClosed', 'true');
        
        console.log('🚧 Beta Banner geschlossen');
    }
};

// Debug: Beta Banner sofort anzeigen (zum Testen)
window.showBetaBannerNow = function() {
    localStorage.removeItem('betaBannerClosed'); // Reset
    const banner = document.getElementById('betaBanner');
    const mainApp = document.getElementById('mainApp');
    
    if (banner) {
        banner.classList.remove('hidden');
        setTimeout(() => {
            banner.classList.add('show');
            if (mainApp) mainApp.classList.add('beta-active');
        }, 100);
        console.log('🚧 Beta Banner manuell angezeigt');
    } else {
        console.log('❌ Beta Banner Element nicht gefunden');
    }
};









