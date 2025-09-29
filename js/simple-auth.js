// Simple Auth System - Backup Implementation
class SimpleAuth {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🔧 Simple Auth initializing...');
        this.setupFormSwitching();
        this.setupFormSubmission();
        this.checkAuthState();
    }
    
    setupFormSwitching() {
        // Show register form
        const showRegisterBtn = document.getElementById('showRegister');
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Switching to register form');
                this.showRegisterForm();
            });
        }
        
        // Show login form
        const showLoginBtn = document.getElementById('showLogin');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Switching to login form');
                this.showLoginForm();
            });
        }
    }
    
    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (registerForm) registerForm.classList.add('hidden');
        if (loginForm) loginForm.classList.remove('hidden');
        
        console.log('✅ Login form shown');
    }
    
    showRegisterForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
        
        console.log('✅ Register form shown');
    }
    
    setupFormSubmission() {
        // Login form
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // Register form
        const registerForm = document.getElementById('registerFormElement');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }
    
    async handleLogin() {
        console.log('🔐 Processing login...');
        
        const emailOrUsername = document.getElementById('loginEmail')?.value?.trim();
        const password = document.getElementById('loginPassword')?.value;
        
        if (!emailOrUsername || !password) {
            window.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        try {
            let loginEmail = emailOrUsername;
            
            // Check if it's username (no @ symbol)
            if (!emailOrUsername.includes('@')) {
                const userQuery = await window.firebaseServices.db
                    .collection('users')
                    .where('username', '==', emailOrUsername.toLowerCase())
                    .limit(1)
                    .get();
                
                if (!userQuery.empty) {
                    loginEmail = userQuery.docs[0].data().email;
                } else {
                    window.showNotification('Username not found', 'error');
                    return;
                }
            }

            const result = await window.firebaseServices.auth.signInWithEmailAndPassword(loginEmail, password);
            console.log('✅ Login successful:', result.user.uid);
            window.showNotification('Login successful!', 'success');
            this.showMainApp();
        } catch (error) {
            console.error('❌ Login failed:', error);
            window.showNotification('Login failed: ' + error.message, 'error');
        }
    }
    
    async handleRegister() {
        console.log('📝 Processing registration...');
        
        const username = document.getElementById('registerUsername')?.value?.trim();
        const email = document.getElementById('registerEmail')?.value?.trim();
        const password = document.getElementById('registerPassword')?.value;
        
        if (!username || !email || !password) {
            window.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        try {
            const result = await window.firebaseServices.auth.createUserWithEmailAndPassword(email, password);
            await result.user.updateProfile({ displayName: username });
            
            console.log('✅ Registration successful:', result.user.uid);
            window.showNotification(`Welcome ${username}!`, 'success');
            this.showMainApp();
        } catch (error) {
            console.error('❌ Registration failed:', error);
            window.showNotification('Registration failed: ' + error.message, 'error');
        }
    }
    
    checkAuthState() {
        if (!window.firebaseServices?.auth) {
            setTimeout(() => this.checkAuthState(), 100);
            return;
        }
        
        window.firebaseServices.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('👤 User logged in:', user.uid);
                this.showMainApp();
            } else {
                console.log('👤 No user logged in');
                this.showAuthScreen();
            }
        });
    }
    
    showAuthScreen() {
        const authContainer = document.getElementById('authContainer');
        const mainApp = document.getElementById('mainApp');
        
        if (authContainer) authContainer.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
    }
    
    showMainApp() {
        const authContainer = document.getElementById('authContainer');
        const mainApp = document.getElementById('mainApp');
        
        if (authContainer) authContainer.classList.add('hidden');
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
}

// Initialize simple auth as backup
window.SimpleAuth = SimpleAuth;

console.log('🔧 Simple Auth system loaded');


