// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.init();
    }

    init() {
        // Load saved theme or use system preference
        const savedTheme = Storage.getTheme();
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'system') {
            this.currentTheme = systemPrefersDark ? 'dark' : 'light';
        } else {
            this.currentTheme = savedTheme;
        }

        this.applyTheme(this.currentTheme);
        this.setupEventListeners();

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (Storage.getTheme() === 'system') {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(this.currentTheme);
            }
        });
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        Storage.setTheme(theme);
    }

    applyTheme(theme) {
        const root = document.documentElement;

        // Remove existing theme classes
        root.classList.remove('light', 'dark');

        // Add new theme class
        root.classList.add(theme);

        // Update theme toggle icon visibility
        this.updateThemeToggleIcon(theme);
    }

    updateThemeToggleIcon(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        const sunIcon = themeToggle.querySelector('.sun-icon');
        const moonIcon = themeToggle.querySelector('.moon-icon');

        if (theme === 'dark') {
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        } else {
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDarkMode() {
        return this.currentTheme === 'dark';
    }
}

// Make class available globally
window.ThemeManagerClass = ThemeManager;

const createThemeManager = () => {
    const instance = new ThemeManager();
    window.ThemeManager = instance;
    window.ThemeManagerInstance = instance;
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createThemeManager);
} else {
    createThemeManager();
} 