// Main Application Initialization
class App {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeApp();
            });
        } else {
            this.initializeApp();
        }
    }

    async initializeApp() {
        try {
            this.checkDependencies();
            await this.initializeSharePoint();
            await this.initializeComponents();
            this.setupErrorHandling();
            this.setupKeyboardShortcuts();
            this.setupAdminPanel();

            this.initialized = true;
            this.showWelcomeMessage();

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showInitializationError(error);
        }
    }

    checkDependencies() {
        const requiredModules = ['Storage', 'AcknowledgmentData', 'PDFExporter'];
        const requiredClasses = ['ThemeManagerClass', 'UIManagerClass', 'FormsManagerClass'];

        const missingModules = requiredModules.filter(module => !window[module]);
        const missingClasses = requiredClasses.filter(className => !window[className]);

        if (missingModules.length > 0) {
            throw new Error(`Missing required modules: ${missingModules.join(', ')}`);
        }

        if (missingClasses.length > 0) {
            throw new Error(`Missing required classes: ${missingClasses.join(', ')}`);
        }

        // Setup jsPDF if available under alternative name
        if (!PDFExporter.isSupported() && typeof window.jspdf !== 'undefined') {
            window.jsPDF = window.jspdf.jsPDF;
        }
    }

    async initializeSharePoint() {
        try {
            if (window.SharePointService) {
                console.log('Initializing SharePoint service...');
                this.updateSharePointStatus('connecting', 'Connecting to SharePoint...');
                
                const initialized = await window.SharePointService.initialize();
                
                if (initialized) {
                    console.log('SharePoint service initialized successfully');
                    this.updateSharePointStatus('connected', 'SharePoint Connected');
                    // Attempt to sync existing localStorage data to SharePoint
                    await Storage.syncToSharePoint();
                } else {
                    console.log('SharePoint service initialization failed, using fallback');
                    this.updateSharePointStatus('disconnected', 'SharePoint Unavailable');
                }
            } else {
                console.log('SharePoint service not available');
                this.updateSharePointStatus('disconnected', 'SharePoint Not Available');
            }
        } catch (error) {
            console.error('Error initializing SharePoint:', error);
            this.updateSharePointStatus('disconnected', 'SharePoint Connection Failed');
            // Continue with localStorage fallback
        }
    }

    updateSharePointStatus(status, message) {
        const statusElement = document.getElementById('sharepoint-status');
        const statusText = document.getElementById('sharepoint-status-text');
        
        if (statusElement && statusText) {
            statusElement.style.display = 'inline-flex';
            statusElement.className = `sharepoint-status ${status}`;
            statusText.textContent = message;
        }
    }

    setupAdminPanel() {
        // Add admin panel if user is admin
        if (Storage.isCurrentUserAdmin()) {
            this.createAdminPanel();
        }
    }

    createAdminPanel() {
        const container = document.querySelector('.container');
        if (!container) return;

        const adminPanel = document.createElement('div');
        adminPanel.id = 'admin-panel';
        adminPanel.className = 'card admin-panel';
        adminPanel.style.marginTop = '2rem';
        adminPanel.innerHTML = `
            <div class="card-header">
                <h2 class="card-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 1l3 6h6l-3 9-6-3-6 3-3-9h6z"/>
                    </svg>
                    Admin Panel
                </h2>
            </div>
            <div class="card-content">
                <div class="admin-section">
                    <h3>SharePoint List Selection</h3>
                    <p>Choose which SharePoint list to use for storing acknowledgment submissions:</p>
                    <div class="list-selection">
                        <select id="submission-list-select" class="form-control">
                            <option value="">Loading available lists...</option>
                        </select>
                        <button id="create-new-list-btn" class="btn btn-outline btn-sm">Create New List</button>
                    </div>
                </div>
                
                <div class="admin-section">
                    <h3>Admin Management</h3>
                    <p>Manage users who can add/delete acknowledgment types:</p>
                    <div class="admin-actions">
                        <input type="email" id="admin-email-input" placeholder="Enter user email" class="form-control">
                        <button id="add-admin-btn" class="btn btn-primary btn-sm">Add Admin</button>
                    </div>
                </div>

                <div class="admin-section">
                    <h3>Data Management</h3>
                    <div class="data-actions">
                        <button id="sync-data-btn" class="btn btn-outline btn-sm">Sync Local Data to SharePoint</button>
                        <button id="export-data-btn" class="btn btn-outline btn-sm">Export All Data</button>
                    </div>
                </div>
            </div>
        `;

        // Insert before the submissions section
        const submissionsSection = document.getElementById('submissions-section');
        if (submissionsSection) {
            container.insertBefore(adminPanel, submissionsSection);
        } else {
            container.appendChild(adminPanel);
        }

        this.setupAdminPanelListeners();
        this.loadAvailableLists();
    }

    setupAdminPanelListeners() {
        // List selection change
        const listSelect = document.getElementById('submission-list-select');
        if (listSelect) {
            listSelect.addEventListener('change', (e) => {
                const selectedList = e.target.value;
                if (selectedList) {
                    Storage.setSelectedSubmissionList(selectedList);
                    if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                        window.UIManager.showToast('List Selected', `Now using "${selectedList}" for submissions.`, 'success');
                    }
                }
            });
        }

        // Create new list
        const createListBtn = document.getElementById('create-new-list-btn');
        if (createListBtn) {
            createListBtn.addEventListener('click', () => {
                this.createNewSubmissionList();
            });
        }

        // Add admin
        const addAdminBtn = document.getElementById('add-admin-btn');
        if (addAdminBtn) {
            addAdminBtn.addEventListener('click', () => {
                this.addNewAdmin();
            });
        }

        // Sync data
        const syncDataBtn = document.getElementById('sync-data-btn');
        if (syncDataBtn) {
            syncDataBtn.addEventListener('click', async () => {
                try {
                    const success = await Storage.syncToSharePoint();
                    if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                        if (success) {
                            window.UIManager.showToast('Sync Complete', 'Local data has been synced to SharePoint.', 'success');
                        } else {
                            window.UIManager.showToast('Sync Failed', 'Unable to sync data to SharePoint.', 'error');
                        }
                    }
                } catch (error) {
                    console.error('Sync error:', error);
                    if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                        window.UIManager.showToast('Sync Error', 'An error occurred during sync.', 'error');
                    }
                }
            });
        }

        // Export data
        const exportDataBtn = document.getElementById('export-data-btn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportAllData();
            });
        }
    }

    async loadAvailableLists() {
        const listSelect = document.getElementById('submission-list-select');
        if (!listSelect) return;

        try {
            const lists = await Storage.getAvailableSubmissionLists();
            const currentSelection = Storage.getSelectedSubmissionList();

            listSelect.innerHTML = `
                <option value="AcknowledgmentSubmissions" ${currentSelection === 'AcknowledgmentSubmissions' ? 'selected' : ''}>
                    AcknowledgmentSubmissions (Default)
                </option>
                ${lists.map(list => `
                    <option value="${list.title}" ${currentSelection === list.title ? 'selected' : ''}>
                        ${list.title}
                    </option>
                `).join('')}
            `;
        } catch (error) {
            console.error('Error loading available lists:', error);
            listSelect.innerHTML = '<option value="AcknowledgmentSubmissions">AcknowledgmentSubmissions (Default)</option>';
        }
    }

    async createNewSubmissionList() {
        const listName = prompt('Enter name for the new submission list:');
        if (!listName || !listName.trim()) return;

        try {
            if (window.SharePointService && window.SharePointService.isInitialized()) {
                await window.SharePointService.createSubmissionList(listName.trim());
                await this.loadAvailableLists();
                Storage.setSelectedSubmissionList(listName.trim());
                
                if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                    window.UIManager.showToast('List Created', `"${listName}" has been created and selected.`, 'success');
                }
            } else {
                if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                    window.UIManager.showToast('SharePoint Error', 'SharePoint service not available.', 'error');
                }
            }
        } catch (error) {
            console.error('Error creating list:', error);
            if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                window.UIManager.showToast('Creation Failed', 'Failed to create new list.', 'error');
            }
        }
    }

    async addNewAdmin() {
        const emailInput = document.getElementById('admin-email-input');
        if (!emailInput) return;

        const email = emailInput.value.trim();
        if (!email) {
            if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                window.UIManager.showToast('Email Required', 'Please enter a valid email address.', 'error');
            }
            return;
        }

        try {
            if (window.SharePointService && window.SharePointService.isInitialized()) {
                await window.SharePointService.addAdmin(email, email.split('@')[0]);
                emailInput.value = '';
                
                if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                    window.UIManager.showToast('Admin Added', `${email} has been added as an admin.`, 'success');
                }
            } else {
                if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                    window.UIManager.showToast('SharePoint Error', 'SharePoint service not available.', 'error');
                }
            }
        } catch (error) {
            console.error('Error adding admin:', error);
            if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                window.UIManager.showToast('Add Admin Failed', 'Failed to add admin user.', 'error');
            }
        }
    }

    initializeComponents() {
        // Wait for all component instances to be ready
        const waitForComponents = () => {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 50;

                const checkInstances = () => {
                    attempts++;
                    const uiReady = !!window.UIManager;
                    const themeReady = !!window.ThemeManager;
                    const formsReady = !!window.FormsManager;

                    if (uiReady && themeReady && formsReady) {
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        // Force create missing instances
                        if (!uiReady && window.UIManagerClass) {
                            const uiInstance = new window.UIManagerClass();
                            window.UIManager = uiInstance;
                            window.UIManagerInstance = uiInstance;
                        }
                        if (!themeReady && window.ThemeManagerClass) {
                            const themeInstance = new window.ThemeManagerClass();
                            window.ThemeManager = themeInstance;
                            window.ThemeManagerInstance = themeInstance;
                        }
                        if (!formsReady && window.FormsManagerClass) {
                            const formsInstance = new window.FormsManagerClass();
                            window.FormsManager = formsInstance;
                            window.FormsManagerInstance = formsInstance;
                        }

                        if (window.UIManager && window.ThemeManager && window.FormsManager) {
                            resolve();
                        } else {
                            reject(new Error('Failed to initialize component instances'));
                        }
                    } else {
                        setTimeout(checkInstances, 20);
                    }
                };
                checkInstances();
            });
        };

        return waitForComponents().then(() => {
            // Ensure we have instances, not constructors
            let UIManager = window.UIManager;
            let ThemeManager = window.ThemeManager;

            if (typeof UIManager === 'function') {
                UIManager = window.UIManagerInstance || new window.UIManagerClass();
                window.UIManager = UIManager;
                window.UIManagerInstance = UIManager;
            }

            if (typeof ThemeManager === 'function') {
                ThemeManager = window.ThemeManagerInstance || new window.ThemeManagerClass();
                window.ThemeManager = ThemeManager;
                window.ThemeManagerInstance = ThemeManager;
            }

            // Initialize UI
            if (typeof UIManager.initializeUI === 'function') {
                UIManager.initializeUI();
            } else {
                // Fallback
                if (typeof UIManager.renderAcknowledgmentCards === 'function') {
                    UIManager.renderAcknowledgmentCards();
                }
                if (typeof UIManager.updateSubmissionsSection === 'function') {
                    UIManager.updateSubmissionsSection();
                }
            }

            // Apply theme
            if (typeof ThemeManager.applyTheme === 'function') {
                const savedTheme = Storage.getTheme();
                ThemeManager.applyTheme(savedTheme);
            }
        });
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // ESC key to close modals
            if (event.key === 'Escape') {
                this.closeAllModals();
            }

            // Ctrl/Cmd + K to focus search
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Ctrl/Cmd + N to add new acknowledgment type
            if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
                event.preventDefault();
                const addTypeBtn = document.getElementById('add-type-btn');
                if (addTypeBtn) {
                    addTypeBtn.click();
                }
            }

            // Ctrl/Cmd + D to toggle dark mode
            if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
                event.preventDefault();
                if (window.ThemeManager) {
                    ThemeManager.toggleTheme();
                }
            }
        });
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    handleError(error) {
        // Only log if error is meaningful
        if (error && error !== null) {
            console.error('Application error:', error);
        }

        // Show user-friendly error message
        if (window.UIManager && typeof window.UIManager.showToast === 'function') {
            window.UIManager.showToast(
                'Application Error',
                'An unexpected error occurred. Please refresh the page if the problem persists.',
                'error'
            );
        }

        // In a production environment, you might want to send error reports to a logging service
        this.reportError(error);
    }

    reportError(error) {
        // This is where you would send error reports to your logging service
        // For now, we'll just log it locally
        const errorReport = {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getCurrentUserId() // If you have user identification
        };

        // Store error locally for debugging
        try {
            const errors = Storage.get('applicationErrors') || [];
            errors.push(errorReport);
            // Keep only last 50 errors
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }
            Storage.set('applicationErrors', errors);
        } catch (e) {
            console.error('Failed to store error report:', e);
        }
    }

    getCurrentUserId() {
        // This would return the current user ID if you have user authentication
        // For now, we'll return a simple identifier
        return Storage.get('userId') || 'anonymous';
    }

    showWelcomeMessage() {
        // Check if this is the first visit
        const isFirstVisit = !Storage.get('hasVisited');

        if (isFirstVisit) {
            Storage.set('hasVisited', true);

            if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                setTimeout(() => {
                    window.UIManager.showToast(
                        'Welcome!',
                        'Welcome to YSOD Digital Acknowledgment Form Hub. Click on any acknowledgment type to get started.',
                        'success'
                    );
                }, 1000);
            }
        }
    }

    showInitializationError(error) {
        const container = document.body;
        container.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 2rem;
                text-align: center;
                background: #f5f5f5;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 3rem;
                    border-radius: 1rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    max-width: 500px;
                ">
                    <h1 style="color: #dc2626; margin-bottom: 1rem;">
                        ⚠️ Initialization Error
                    </h1>
                    <p style="color: #374151; margin-bottom: 2rem; line-height: 1.6;">
                        The application failed to initialize properly. This might be due to missing dependencies or a browser compatibility issue.
                    </p>
                    <details style="text-align: left; margin-bottom: 2rem;">
                        <summary style="cursor: pointer; color: #6b7280;">Show technical details</summary>
                        <pre style="
                            background: #f3f4f6;
                            padding: 1rem;
                            border-radius: 0.5rem;
                            overflow-x: auto;
                            font-size: 0.75rem;
                            margin-top: 1rem;
                        ">${error.message}</pre>
                    </details>
                    <button 
                        onclick="window.location.reload()" 
                        style="
                            background: #3b82f6;
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 0.5rem;
                            cursor: pointer;
                            font-size: 1rem;
                        "
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }

    // Utility methods
    getVersion() {
        return '1.0.0';
    }

    getEnvironmentInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            localStorage: typeof Storage !== 'undefined',
            jsPDF: PDFExporter.isSupported()
        };
    }

    // Debug methods
    debugInfo() {
        const info = {
            version: this.getVersion(),
            initialized: this.initialized,
            acknowledgmentTypes: window.AcknowledgmentData.getAcknowledgmentTypes().length,
            submissions: Storage.getSubmissions().length,
            theme: Storage.getTheme()
        };
        console.table(info);
        return info;
    }

    // Export method for data backup
    exportAllData() {
        const data = {
            acknowledgmentTypes: window.AcknowledgmentData.getAcknowledgmentTypes(),
            submissions: Storage.getSubmissions(),
            theme: Storage.getTheme(),
            version: this.getVersion(),
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `ysod_acknowledgment_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (window.UIManager && typeof window.UIManager.showToast === 'function') {
            window.UIManager.showToast('Data Exported', 'All data has been exported successfully.', 'success');
        }
    }
}

// Initialize the application
window.App = new App();

// Debug methods for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugApp = () => App.debugInfo();
    window.exportData = () => App.exportAllData();
} 