// Comprehensive Debug System
window.debugAuth = function() {
    console.log('🔍 === COMPLETE AUTH DEBUG ===');
    
    // 1. Check all form elements
    const forms = {
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm'),
        loginFormElement: document.getElementById('loginFormElement'),
        registerFormElement: document.getElementById('registerFormElement')
    };
    
    const inputs = {
        loginEmail: document.getElementById('loginEmail'),
        loginPassword: document.getElementById('loginPassword'),
        registerUsername: document.getElementById('registerUsername'),
        registerEmail: document.getElementById('registerEmail'),
        registerPassword: document.getElementById('registerPassword')
    };
    
    const buttons = {
        showRegister: document.getElementById('showRegister'),
        showLogin: document.getElementById('showLogin'),
        loginSubmit: document.querySelector('#loginFormElement button[type="submit"]'),
        registerSubmit: document.querySelector('#registerFormElement button[type="submit"]')
    };
    
    console.log('📋 Forms:', forms);
    console.log('📝 Inputs:', inputs);
    console.log('🔘 Buttons:', buttons);
    
    // 2. Check services
    console.log('🔥 Firebase:', {
        global: typeof firebase,
        services: !!window.firebaseServices,
        auth: !!window.firebaseServices?.auth,
        db: !!window.firebaseServices?.db
    });
    
    console.log('🔐 Auth Services:', {
        AuthManager: !!window.AuthManager,
        RopeHubApp: !!window.RopeHubApp,
        showNotification: typeof window.showNotification
    });
    
    // 3. Check current auth state
    if (window.firebaseServices?.auth) {
        const currentUser = window.firebaseServices.auth.currentUser;
        console.log('👤 Current User:', currentUser ? {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName
        } : 'None');
    }
    
    // 4. Test form switching
    console.log('🔄 Testing form switching...');
    if (buttons.showRegister) {
        console.log('Clicking show register...');
        buttons.showRegister.click();
        setTimeout(() => {
            console.log('Register form visible:', !forms.registerForm?.classList.contains('hidden'));
            console.log('Login form hidden:', forms.loginForm?.classList.contains('hidden'));
        }, 100);
    }
    
    return { forms, inputs, buttons };
};

// Test manual login
window.testManualLogin = function(email = 'rope', password = 'test123') {
    console.log('🧪 Testing manual login...');
    
    if (!window.firebaseServices?.auth) {
        console.error('❌ Firebase auth not available');
        return;
    }
    
    console.log('🔐 Attempting login with:', email);
    
    window.firebaseServices.auth.signInWithEmailAndPassword(email, password)
        .then((result) => {
            console.log('✅ Manual login successful:', result.user.uid);
            window.showNotification('Login successful!', 'success');
        })
        .catch((error) => {
            console.error('❌ Manual login failed:', error);
            window.showNotification('Login failed: ' + error.message, 'error');
        });
};

// Test manual registration
window.testManualRegister = function(email = 'test@example.com', password = 'test123') {
    console.log('🧪 Testing manual registration...');
    
    if (!window.firebaseServices?.auth) {
        console.error('❌ Firebase auth not available');
        return;
    }
    
    console.log('📝 Attempting registration with:', email);
    
    window.firebaseServices.auth.createUserWithEmailAndPassword(email, password)
        .then((result) => {
            console.log('✅ Manual registration successful:', result.user.uid);
            window.showNotification('Registration successful!', 'success');
        })
        .catch((error) => {
            console.error('❌ Manual registration failed:', error);
            window.showNotification('Registration failed: ' + error.message, 'error');
        });
};

// Test UI functionality
window.testUI = function() {
    console.log('🧪 Testing UI functionality...');
    
    // Test user menu
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        console.log('👤 Testing user menu...');
        userMenu.click();
        
        setTimeout(() => {
            const dropdown = document.getElementById('userDropdown');
            console.log('Dropdown visible:', !dropdown?.classList.contains('hidden'));
            
            // Test profile click
            const profileItem = document.querySelector('[data-action="profile"]');
            if (profileItem) {
                console.log('🔍 Testing profile click...');
                profileItem.click();
            }
        }, 100);
    }
    
    // Test navigation
    const friendsNav = document.querySelector('[data-view="friends"]');
    if (friendsNav) {
        console.log('👥 Testing friends navigation...');
        friendsNav.click();
    }
    
    return {
        userMenu: !!userMenu,
        friendsNav: !!friendsNav,
        uiManager: !!window.UIManager
    };
};

// Force UI initialization
window.initUI = function() {
    console.log('🔧 Force initializing UI...');
    if (!window.UIManager) {
        window.UIManager = new UIManager();
    }
    return window.UIManager;
};

// Test individual UI components
window.testUIComponents = function() {
    console.log('🧪 Testing individual UI components...');
    
    const tests = {
        userMenu: () => {
            const userMenu = document.getElementById('userMenu');
            if (userMenu) {
                console.log('👤 Testing user menu click...');
                userMenu.click();
                return !!userMenu;
            }
            return false;
        },
        
        navigation: () => {
            const friendsNav = document.querySelector('[data-view="friends"]');
            if (friendsNav) {
                console.log('🔄 Testing friends navigation...');
                friendsNav.click();
                return !!friendsNav;
            }
            return false;
        },
        
        friendTabs: () => {
            const onlineTab = document.querySelector('[data-tab="online"]');
            if (onlineTab) {
                console.log('📑 Testing friend tabs...');
                onlineTab.click();
                return !!onlineTab;
            }
            return false;
        },
        
        profileModal: () => {
            const profileBtn = document.querySelector('[data-action="profile"]');
            if (profileBtn) {
                console.log('👤 Testing profile modal...');
                profileBtn.click();
                return !!profileBtn;
            }
            return false;
        }
    };
    
    const results = {};
    for (const [testName, testFn] of Object.entries(tests)) {
        try {
            results[testName] = testFn();
            console.log(`✅ ${testName}: ${results[testName] ? 'PASS' : 'FAIL'}`);
        } catch (error) {
            results[testName] = false;
            console.error(`❌ ${testName}: ERROR -`, error);
        }
    }
    
    return results;
};

// Force UI reinitialization
window.reinitializeUI = function() {
    console.log('🔄 Force reinitializing UI...');
    
    if (window.UIManager) {
        window.UIManager.cleanup();
        delete window.UIManager;
    }
    
    // Create new instance
    window.UIManager = new UIManager();
    
    // Wait a bit then test
    setTimeout(() => {
        console.log('🧪 Testing after reinitialization...');
        window.testUIComponents();
    }, 500);
    
    return window.UIManager;
};

// Debug click events
window.debugClicks = function() {
    console.log('🔍 Setting up click debugging...');
    
    document.addEventListener('click', (e) => {
        console.log('🖱️ CLICK DEBUG:', {
            target: e.target.tagName,
            id: e.target.id,
            classes: e.target.className,
            dataAction: e.target.getAttribute('data-action'),
            dataView: e.target.getAttribute('data-view'),
            dataTab: e.target.getAttribute('data-tab'),
            closest: e.target.closest('[data-action], [data-view], [data-tab]')?.tagName
        });
    }, true);
    
    console.log('✅ Click debugging enabled');
};

console.log('🔍 Debug system loaded. Use window.debugAuth() to diagnose.');


