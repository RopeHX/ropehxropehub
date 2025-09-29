// 🌍 INTERNATIONALIZATION SYSTEM
class I18nManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'de';
        this.translations = {
            de: {
                // Auth & Login
                'welcome_back': 'Willkommen zurück!',
                'join_ropehub': 'Bei RopeHub anmelden',
                'email': 'E-Mail',
                'password': 'Passwort',
                'full_name': 'Vollständiger Name',
                'sign_in': 'Anmelden',
                'create_account': 'Konto erstellen',
                'no_account': 'Noch kein Konto?',
                'create_one': 'Hier erstellen',
                'have_account': 'Bereits ein Konto?',
                'sign_in_link': 'Hier anmelden',
                'connect_share': 'Verbinden & Teilen wie nie zuvor',
                
                // Navigation
                'feed': 'Feed',
                'messages': 'Nachrichten',
                'friends': 'Freunde',
                'servers': 'Server',
                'logout': 'Abmelden',
                'search_placeholder': 'Suchen...',
                'online': 'Online',
                
                // User Menu
                'edit_profile': 'Profil bearbeiten',
                'settings': 'Einstellungen',
                'appearance': 'Erscheinungsbild',
                'logout_menu': 'Abmelden',
                
                // Feed
                'create_post': 'Beitrag erstellen',
                'whats_on_mind': 'Was beschäftigt dich?',
                'cancel': 'Abbrechen',
                'post': 'Posten',
                'no_posts_yet': 'Noch keine Beiträge',
                'be_first_share': 'Sei der Erste, der etwas teilt!',
                'just_now': 'Gerade eben',
                'minutes_ago': 'vor {0} Min.',
                'hours_ago': 'vor {0} Std.',
                'days_ago': 'vor {0} Tag(en)',
                
                // Profile Modal
                'edit_profile_title': 'Profil bearbeiten',
                'profile_picture': 'Profilbild',
                'change': 'Ändern',
                'upload_image': 'Bild hochladen',
                'remove': 'Entfernen',
                'display_name': 'Anzeigename',
                'display_name_placeholder': 'Dein Anzeigename',
                'display_name_hint': 'Dieser Name wird anderen Nutzern angezeigt',
                'user_information': 'Benutzer-Informationen',
                'email_label': 'E-Mail',
                'rank': 'Rang',
                'member_since': 'Mitglied seit',
                'save': 'Speichern',
                'not_available': 'Nicht verfügbar',
                'unknown': 'Unbekannt',
                
                // Ranks
                'rank_admin': 'Administrator',
                'rank_moderator': 'Moderator',
                'rank_premium': 'Premium',
                'rank_user': 'Mitglied',
                
                // Messages & Notifications
                'profile_updated': 'Profil erfolgreich aktualisiert!',
                'avatar_selected': 'Bild ausgewählt! Klicke "Speichern" um zu übernehmen.',
                'avatar_removed': 'Avatar entfernt! Klicke "Speichern" um zu übernehmen.',
                'display_name_required': 'Anzeigename darf nicht leer sein',
                'invalid_file': 'Bitte wähle eine gültige Bilddatei aus',
                'file_too_large': 'Bild ist zu groß. Maximum: 5MB',
                'profile_save_error': 'Fehler beim Speichern des Profils',
                'post_created': 'Beitrag erfolgreich erstellt!',
                'post_create_error': 'Fehler beim Erstellen des Beitrags',
                'login_required': 'Bitte melde dich an, um Beiträge zu erstellen',
                
                // Coming Soon
                'dm_coming_soon': 'Direktnachrichten kommen bald...',
                'friends_coming_soon': 'Freundesliste kommt bald...',
                'servers_coming_soon': 'Server-Entdeckung kommt bald...',
                'settings_coming_soon': 'Einstellungen kommen bald!',
                'theme_editor_coming_soon': 'Theme-Editor kommt bald!',

                // Friends System
                'all_friends': 'Alle Freunde',
                'online_friends': 'Online',
                'pending_requests': 'Ausstehend',
                'add_friend': 'Freund hinzufügen',
                'no_friends_yet': 'Noch keine Freunde',
                'add_friends_to_chat': 'Füge Freunde hinzu, um hier zu chatten!',
                'add_friends_button': 'Freunde hinzufügen',
                'no_friends_online': 'Keine Freunde online',
                'friends_not_online': 'Deine Freunde sind gerade nicht online.',
                'no_pending_requests': 'Keine ausstehenden Anfragen',
                'no_open_requests': 'Du hast keine offenen Freundschaftsanfragen.',
                'received_requests': 'Empfangene Anfragen',
                'sent_requests': 'Gesendete Anfragen',
                'friend_request': 'Freundschaftsanfrage',
                'request_sent': 'Anfrage gesendet',
                'accept': 'Annehmen',
                'decline': 'Ablehnen',
                'withdraw': 'Zurückziehen',
                'remove_friend': 'Freund entfernen',
                'send_message': 'Nachricht senden',
                'view_profile': 'Profil anzeigen',
                'add_friends_title': 'Freunde hinzufügen',
                'enter_username': 'Benutzername eingeben:',
                'search': 'Suchen',
                'username_hint': 'Gib den Benutzernamen ohne @ ein (z.B. ropehx)',
                'searching_for': 'Suche nach',
                'user_not_found': 'Benutzer nicht gefunden',
                'username_not_exist': 'Der Benutzername @{0} existiert nicht.',
                'thats_you': 'Das bist du!',
                'cannot_add_yourself': 'Du kannst dich nicht selbst als Freund hinzufügen.',
                'request_withdrawn': 'Freundschaftsanfrage zurückgezogen',
                'error_withdrawing_request': 'Fehler beim Zurückziehen der Anfrage',
                'error_loading_friends': 'Fehler beim Laden der Freunde',
                'anonymous': 'Anonym',
                'user': 'benutzer',
                'already_friends': 'Bereits befreundet',
                'request_received': 'Anfrage erhalten',
                'not_friends': 'Nicht befreundet',
                'add_as_friend': 'Als Freund hinzufügen',
                'wants_to_be_friends': 'Möchte befreundet sein',
                'awaiting_response': 'Wartet auf Antwort',
                
                // Settings
                'language': 'Sprache',
                'language_description': 'Wähle deine bevorzugte Sprache',
                'appearance': 'Erscheinungsbild',
                'appearance_description': 'Personalisiere das Aussehen der App',
                'notifications': 'Benachrichtigungen',
                'notifications_description': 'Verwalte deine Benachrichtigungseinstellungen',
                'privacy_security': 'Privatsphäre & Sicherheit',
                'privacy_security_desc': 'Verwalte deine Konto-Sicherheit',
                'danger_zone': 'Gefahrenbereich',
                'danger_zone_desc': 'Irreversible Aktionen',
                
                'dark_mode': 'Dark Mode',
                'dark_mode_desc': 'Dunkles Design für die Augen',
                'all_notifications': 'Alle Benachrichtigungen',
                'all_notifications_desc': 'Push-Nachrichten, Sounds und Browser-Benachrichtigungen',
                
                'change_password': 'Passwort ändern',
                'change_password_desc': 'Aktualisiere dein Passwort',
                'export_data': 'Daten exportieren',
                'export_data_desc': 'Lade deine Daten herunter',
                'delete_account': 'Konto löschen',
                'delete_account_desc': 'Lösche dein Konto permanent',
                
                'current_password': 'Aktuelles Passwort',
                'new_password': 'Neues Passwort',
                'confirm_password': 'Passwort bestätigen',
                'confirm_password_delete': 'Passwort zur Bestätigung',
                'type_delete': 'Tippe "LÖSCHEN" um zu bestätigen',
                'delete_warning': 'Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Daten werden permanent gelöscht.',
                
                'setting_saved': 'Einstellung gespeichert!',
                'password_changed': 'Passwort erfolgreich geändert!',
                'account_deleted': 'Konto wurde gelöscht',
                'data_exported': 'Daten erfolgreich exportiert!',
                'fill_all_fields': 'Bitte fülle alle Felder aus',
                'passwords_dont_match': 'Passwörter stimmen nicht überein',
                'password_too_short': 'Passwort muss mindestens 6 Zeichen haben',
                'password_change_error': 'Fehler beim Ändern des Passworts',
                'account_delete_error': 'Fehler beim Löschen des Kontos',
                'delete_confirmation_wrong': 'Bitte tippe "LÖSCHEN" zur Bestätigung',
                
                // General
                'close': 'Schließen',
                'loading': 'Lädt...',
                'error': 'Fehler',
                'success': 'Erfolgreich',
                'info': 'Information',
                'warning': 'Warnung',
                'members': 'Mitglieder',
                'members_directory': 'Mitgliederverzeichnis',
                'discover_community': 'Entdecke unsere Community',
                'search_members': 'Nach Mitgliedern suchen...',
                'all_members': 'Alle',
                'online_members': 'Online',
                'new_members': 'Neu',
                'my_friends': 'Freunde',
                'friends': 'Freunde',
                'search_users': 'Benutzer suchen',
                'search_hint': 'Suche nach Name oder @username (nicht case-sensitive)',
                'searching': 'Suche',
                'no_users_found': 'Keine Benutzer gefunden',
                'try_different_search': 'Versuche einen anderen Suchbegriff',
                'users_found': 'Benutzer gefunden',
                'search_error': 'Fehler bei der Suche',
                'accept_request': 'Anfrage annehmen'
            },
            en: {
                // Auth & Login
                'welcome_back': 'Welcome Back',
                'join_ropehub': 'Join RopeHub',
                'email': 'Email',
                'password': 'Password',
                'full_name': 'Full Name',
                'sign_in': 'Sign In',
                'create_account': 'Create Account',
                'no_account': "Don't have an account?",
                'create_one': 'Create one',
                'have_account': 'Already have an account?',
                'sign_in_link': 'Sign in',
                'connect_share': 'Connect & Share Like Never Before',
                
                // Navigation
                'feed': 'Feed',
                'messages': 'Messages',
                'friends': 'Friends',
                'servers': 'Servers',
                'logout': 'Logout',
                'search_placeholder': 'Search...',
                'online': 'Online',
                
                // User Menu
                'edit_profile': 'Edit Profile',
                'settings': 'Settings',
                'appearance': 'Appearance',
                'logout_menu': 'Logout',
                
                // Feed
                'create_post': 'Create Post',
                'whats_on_mind': "What's on your mind?",
                'cancel': 'Cancel',
                'post': 'Post',
                'no_posts_yet': 'No posts yet',
                'be_first_share': 'Be the first to share something!',
                'just_now': 'Just now',
                'minutes_ago': '{0}m ago',
                'hours_ago': '{0}h ago',
                'days_ago': '{0} day(s) ago',
                
                // Profile Modal
                'edit_profile_title': 'Edit Profile',
                'profile_picture': 'Profile Picture',
                'change': 'Change',
                'upload_image': 'Upload Image',
                'remove': 'Remove',
                'display_name': 'Display Name',
                'display_name_placeholder': 'Your display name',
                'display_name_hint': 'This name will be shown to other users',
                'user_information': 'User Information',
                'email_label': 'Email',
                'rank': 'Rank',
                'member_since': 'Member since',
                'save': 'Save',
                'not_available': 'Not available',
                'unknown': 'Unknown',
                
                // Ranks
                'rank_admin': 'Administrator',
                'rank_moderator': 'Moderator',
                'rank_premium': 'Premium',
                'rank_user': 'Member',
                
                // Messages & Notifications
                'profile_updated': 'Profile updated successfully!',
                'avatar_selected': 'Image selected! Click "Save" to apply.',
                'avatar_removed': 'Avatar removed! Click "Save" to apply.',
                'display_name_required': 'Display name cannot be empty',
                'invalid_file': 'Please select a valid image file',
                'file_too_large': 'Image is too large. Maximum: 5MB',
                'profile_save_error': 'Error saving profile',
                'post_created': 'Post created successfully!',
                'post_create_error': 'Error creating post',
                'login_required': 'Please log in to create posts',
                
                // Coming Soon
                'dm_coming_soon': 'Direct messages coming soon...',
                'friends_coming_soon': 'Friends list coming soon...',
                'servers_coming_soon': 'Server discovery coming soon...',
                'settings_coming_soon': 'Settings coming soon!',
                'theme_editor_coming_soon': 'Theme editor coming soon!',

                // Friends System
                'all_friends': 'All Friends',
                'online_friends': 'Online',
                'pending_requests': 'Pending',
                'add_friend': 'Add Friend',
                'no_friends_yet': 'No friends yet',
                'add_friends_to_chat': 'Add friends to chat here!',
                'add_friends_button': 'Add Friends',
                'no_friends_online': 'No friends online',
                'friends_not_online': 'Your friends are currently not online.',
                'no_pending_requests': 'No pending requests',
                'no_open_requests': 'You have no open friend requests.',
                'received_requests': 'Received Requests',
                'sent_requests': 'Sent Requests',
                'friend_request': 'Friend Request',
                'request_sent': 'Request Sent',
                'accept': 'Accept',
                'decline': 'Decline',
                'withdraw': 'Withdraw',
                'remove_friend': 'Remove Friend',
                'send_message': 'Send Message',
                'view_profile': 'View Profile',
                'add_friends_title': 'Add Friends',
                'enter_username': 'Enter username:',
                'search': 'Search',
                'username_hint': 'Enter username without @ (e.g. ropehx)',
                'searching_for': 'Searching for',
                'user_not_found': 'User not found',
                'username_not_exist': 'The username @{0} does not exist.',
                'thats_you': "That's you!",
                'cannot_add_yourself': 'You cannot add yourself as a friend.',
                'request_withdrawn': 'Friend request withdrawn',
                'error_withdrawing_request': 'Error withdrawing request',
                'error_loading_friends': 'Error loading friends',
                'anonymous': 'Anonymous',
                'user': 'user',
                'already_friends': 'Already friends',
                'request_received': 'Request received',
                'not_friends': 'Not friends',
                'add_as_friend': 'Add as friend',
                'wants_to_be_friends': 'Wants to be friends',
                'awaiting_response': 'Awaiting response',
                
                // Settings
                'language': 'Language',
                'language_description': 'Choose your preferred language',
                'german': 'German',
                'english': 'English',
                'language_changed': 'Language has been changed!',

                // General
                'close': 'Close',
                'loading': 'Loading...',
                'error': 'Error',
                'success': 'Success',
                'info': 'Information',
                'warning': 'Warning',
                'members': 'Members',
                'members_directory': 'Members Directory',
                'discover_community': 'Discover our Community',
                'search_members': 'Search members...',
                'all_members': 'All',
                'online_members': 'Online',
                'new_members': 'New',
                'my_friends': 'Friends',
                'friends': 'Friends',
                'search_users': 'Search users',
                'search_hint': 'Search by name or @username (case-insensitive)',
                'searching': 'Searching',
                'no_users_found': 'No users found',
                'try_different_search': 'Try a different search term',
                'users_found': 'users found',
                'search_error': 'Search error',
                'accept_request': 'Accept request'
            }
        };
    }

    t(key, ...args) {
        let text = this.translations[this.currentLanguage]?.[key] || key;
        
        // Replace placeholders {0}, {1}, etc.
        args.forEach((arg, index) => {
            text = text.replace(`{${index}}`, arg);
        });
        
        return text;
    }

    setLanguage(lang) {
        if (!this.translations[lang]) return;
        
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        this.updateAllTexts();
        
        // Show notification
        if (window.app?.authManager) {
            window.app.authManager.showToast(this.t('language_changed'), 'success');
        }
    }

    updateAllTexts() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Update titles
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
    }

    init() {
        console.log(`🌍 I18n initialized with language: ${this.currentLanguage}`);
        this.updateAllTexts();
    }
}

// Global instance
window.i18n = new I18nManager();







