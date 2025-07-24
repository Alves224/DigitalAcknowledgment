// LocalStorage Management
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

    // Submissions specific methods
    static getSubmissions() {
        return this.get('acknowledgmentSubmissions') || [];
    }

    static addSubmission(submission) {
        const submissions = this.getSubmissions();
        submissions.push(submission);
        return this.set('acknowledgmentSubmissions', submissions);
    }

    static searchSubmissions(searchTerm) {
        const submissions = this.getSubmissions();
        if (!searchTerm.trim()) {
            return submissions;
        }

        return submissions.filter(submission =>
            submission.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Theme specific methods
    static getTheme() {
        return this.get('acknowledgment-theme') || 'light';
    }

    static setTheme(theme) {
        return this.set('acknowledgment-theme', theme);
    }
}

// Make Storage available globally
window.Storage = Storage; 