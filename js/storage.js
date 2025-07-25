// Storage Management with SharePoint Integration
class Storage {
    static get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error getting from localStorage:', error);
            return null;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting to localStorage:', error);
            return false;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    // Check if SharePoint is available and initialized
    static isSharePointAvailable() {
        return window.SharePointService && window.SharePointService.isInitialized();
    }

    // Submissions specific methods with SharePoint integration
    static async getSubmissions() {
        if (this.isSharePointAvailable()) {
            try {
                const listName = this.getSelectedSubmissionList();
                return await window.SharePointService.getSubmissions(listName);
            } catch (error) {
                console.error('Error getting submissions from SharePoint, falling back to localStorage:', error);
                return this.get('acknowledgmentSubmissions') || [];
            }
        }
        return this.get('acknowledgmentSubmissions') || [];
    }

    static async addSubmission(submission) {
        if (this.isSharePointAvailable()) {
            try {
                const listName = this.getSelectedSubmissionList();
                await window.SharePointService.addSubmission(submission, listName);
                return true;
            } catch (error) {
                console.error('Error adding submission to SharePoint, falling back to localStorage:', error);
                // Fallback to localStorage
                const submissions = this.get('acknowledgmentSubmissions') || [];
                submissions.push(submission);
                return this.set('acknowledgmentSubmissions', submissions);
            }
        } else {
            // Use localStorage as fallback
            const submissions = this.get('acknowledgmentSubmissions') || [];
            submissions.push(submission);
            return this.set('acknowledgmentSubmissions', submissions);
        }
    }

    static async searchSubmissions(searchTerm) {
        const submissions = await this.getSubmissions();
        if (!searchTerm.trim()) {
            return submissions;
        }

        return submissions.filter(submission =>
            submission.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // SharePoint List Management
    static getSelectedSubmissionList() {
        return this.get('selectedSubmissionList') || 'AcknowledgmentSubmissions';
    }

    static setSelectedSubmissionList(listName) {
        return this.set('selectedSubmissionList', listName);
    }

    static async getAvailableSubmissionLists() {
        if (this.isSharePointAvailable()) {
            try {
                return await window.SharePointService.getAvailableLists();
            } catch (error) {
                console.error('Error getting available lists:', error);
                return [];
            }
        }
        return [];
    }

    // Admin role checking
    static isCurrentUserAdmin() {
        if (this.isSharePointAvailable()) {
            return window.SharePointService.getIsAdmin();
        }
        // Fallback: check localStorage (for testing/demo purposes)
        return this.get('isAdmin') || false;
    }

    static setAdminRole(isAdmin) {
        // This is for fallback/testing purposes only
        // In production, admin role should only be managed through SharePoint
        return this.set('isAdmin', isAdmin);
    }

    // User information
    static getCurrentUserName() {
        if (this.isSharePointAvailable()) {
            return window.SharePointService.getEmployeeName();
        }
        // Fallback: try to get from localStorage or return empty
        return this.get('currentUserName') || '';
    }

    static setCurrentUserName(userName) {
        // This is for fallback/testing purposes only
        return this.set('currentUserName', userName);
    }

    // Theme specific methods (still use localStorage)
    static getTheme() {
        return this.get('acknowledgment-theme') || 'light';
    }

    static setTheme(theme) {
        return this.set('acknowledgment-theme', theme);
    }

    // Sync method to handle data migration from localStorage to SharePoint
    static async syncToSharePoint() {
        if (!this.isSharePointAvailable()) {
            console.log('SharePoint not available for sync');
            return false;
        }

        try {
            const localSubmissions = this.get('acknowledgmentSubmissions') || [];
            if (localSubmissions.length === 0) {
                console.log('No local submissions to sync');
                return true;
            }

            console.log(`Syncing ${localSubmissions.length} submissions to SharePoint...`);
            const listName = this.getSelectedSubmissionList();

            for (const submission of localSubmissions) {
                try {
                    await window.SharePointService.addSubmission(submission, listName);
                } catch (error) {
                    console.error('Error syncing submission:', submission, error);
                }
            }

            // Clear local submissions after successful sync
            this.remove('acknowledgmentSubmissions');
            console.log('Sync completed successfully');
            return true;
        } catch (error) {
            console.error('Error during sync to SharePoint:', error);
            return false;
        }
    }
}

// Make Storage available globally
window.Storage = Storage; 