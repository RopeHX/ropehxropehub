// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCDEDAjMsH2BX98348ZgjEzHgqAKO-FEWw",
    authDomain: "ropehub-3ac4c.firebaseapp.com",
    projectId: "ropehub-3ac4c",
    storageBucket: "ropehub-3ac4c.firebasestorage.app",
    messagingSenderId: "780687433505",
    appId: "1:780687433505:web:7db975cd91246954ad6860",
    measurementId: "G-EQMF53Y82B"
};

console.log('🔥 Starting Firebase initialization...');

// Immediate check and initialization
function initializeFirebaseNow() {
    try {
        console.log('🔍 Checking Firebase availability...');
        console.log('- firebase global:', typeof firebase);
        console.log('- firebase.apps:', firebase?.apps?.length || 'none');
        
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK not loaded!');
            return false;
        }
        
        console.log('📦 Firebase SDK version:', firebase.SDK_VERSION);
        
        // Initialize if not already done
        if (!firebase.apps.length) {
            const app = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase app initialized');
        }
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        // Make globally available
        window.firebaseServices = {
            app: firebase.apps[0],
            auth,
            db
        };
        
        console.log('✅ Firebase services ready:', {
            app: !!window.firebaseServices.app,
            auth: !!window.firebaseServices.auth,
            db: !!window.firebaseServices.db
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        return false;
    }
}

// Try immediate initialization
if (!initializeFirebaseNow()) {
    // Retry every 100ms for 5 seconds
    let retries = 0;
    const maxRetries = 50;
    
    const retryInit = setInterval(() => {
        retries++;
        console.log(`🔄 Retry ${retries}/${maxRetries} - Initializing Firebase...`);
        
        if (initializeFirebaseNow()) {
            clearInterval(retryInit);
            console.log('✅ Firebase finally ready!');
        } else if (retries >= maxRetries) {
            clearInterval(retryInit);
            console.error('❌ Firebase failed to load after 5 seconds');
        }
    }, 100);
}

// Firebase utility functions
window.FirebaseUtils = {
    // Get current user
    getCurrentUser() {
        return window.firebaseServices?.auth?.currentUser || null;
    },
    
    // Get user document
    async getUserDoc(uid) {
        try {
            if (!window.firebaseServices?.db) {
                console.warn('Firestore not available');
                return null;
            }
            
            const doc = await window.firebaseServices.db.collection('users').doc(uid).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Error getting user document:', error);
            return null;
        }
    },
    
    // Create user document
    async createUserDoc(uid, userData) {
        try {
            if (!window.firebaseServices?.db) {
                console.warn('Firestore not available, skipping user document creation');
                return false;
            }
            
            await window.firebaseServices.db.collection('users').doc(uid).set({
                ...userData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'online'
            });
            console.log('✅ User document created');
            return true;
        } catch (error) {
            console.error('Error creating user document:', error);
            console.warn('Continuing without Firestore user document');
            return false;
        }
    },
    
    // Update user status
    async updateUserStatus(uid, status) {
        try {
            if (!window.firebaseServices?.db) {
                return;
            }
            
            await window.firebaseServices.db.collection('users').doc(uid).update({
                status,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    },
    
    // Generate unique ID
    generateId() {
        return firebaseServices.db.collection('temp').doc().id;
    },
    
    // Server timestamp
    serverTimestamp() {
        return firebase.firestore.FieldValue.serverTimestamp();
    },
    
    // Update user document
    async updateUserDoc(uid, updates) {
        try {
            if (!window.firebaseServices?.db) {
                console.warn('Firestore not available');
                return false;
            }
            
            await window.firebaseServices.db.collection('users').doc(uid).update({
                ...updates,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ User document updated');
            return true;
        } catch (error) {
            console.error('Error updating user document:', error);
            return false;
        }
    }
};

console.log('✅ Firebase utilities loaded');








