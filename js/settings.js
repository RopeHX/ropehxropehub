// ⚙️ SETTINGS MANAGER
class SettingsManager {
    constructor() {
        this.settings = {
            notifications: localStorage.getItem('notifications') !== 'false',
            darkMode: localStorage.getItem('darkMode') === 'true',
            language: localStorage.getItem('language') || 'de',
            soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
            autoStatus: localStorage.getItem('autoStatus') !== 'false'
        };
    }

    init() {
        console.log('⚙️ Settings Manager initializing...');
        this.applySettings();
        console.log('✅ Settings Manager initialized');
    }

    applySettings() {
        // Apply dark mode
        if (this.settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        // Apply language
        if (window.i18n) {
            window.i18n.currentLanguage = this.settings.language;
        }
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        localStorage.setItem(key, value.toString());
        this.applySettings();
        
        // Show feedback
        if (window.app?.authManager) {
            window.app.authManager.showToast('setting_saved', 'success');
        }
    }

    toggleDarkMode() {
        const newValue = !this.settings.darkMode;
        this.updateSetting('darkMode', newValue);
        
        // Smooth transition
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    toggleAllNotifications() {
        const newValue = !this.settings.notifications;
        this.updateSetting('notifications', newValue);
        this.updateSetting('soundEnabled', newValue);
        
        if (newValue && 'Notification' in window) {
            Notification.requestPermission();
        }
        
        console.log(`🔔 All notifications ${newValue ? 'enabled' : 'disabled'}`);
    }

    async changePassword(currentPassword, newPassword) {
        const user = window.firebaseServices?.auth?.currentUser;
        if (!user) throw new Error('No user logged in');

        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            user.email, 
            currentPassword
        );
        
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);
        
        if (window.app?.authManager) {
            window.app.authManager.showToast('password_changed', 'success');
        }
    }

    async deleteAccount(password) {
        const user = window.firebaseServices?.auth?.currentUser;
        if (!user) throw new Error('No user logged in');

        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            user.email, 
            password
        );
        
        await user.reauthenticateWithCredential(credential);
        
        // Delete user document
        await window.firebaseServices.db.collection('users').doc(user.uid).delete();
        
        // Delete account
        await user.delete();
        
        if (window.app?.authManager) {
            window.app.authManager.showToast('account_deleted', 'success');
        }
    }

    exportData() {
        const userData = {
            settings: this.settings,
            profile: window.app?.authManager?.userDoc,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(userData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ropehub-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        if (window.app?.authManager) {
            window.app.authManager.showToast('data_exported', 'success');
        }
    }
}

window.SettingsManager = SettingsManager;
