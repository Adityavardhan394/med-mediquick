// Theme Management System
class ThemeManager {
    constructor() {
        this.themes = {
            light: {
                primary: '#00b386',
                primaryDark: '#009973',
                primaryLight: 'rgba(0, 179, 134, 0.1)',
                secondary: '#4a90e2',
                textDark: '#2c3e50',
                textLight: '#718096',
                background: '#f8fafb',
                white: '#ffffff',
                shadow: '0 2px 8px rgba(0,0,0,0.1)',
                gradient: 'linear-gradient(135deg, var(--primary), var(--secondary))'
            },
            dark: {
                primary: '#00d4a0',
                primaryDark: '#00b386',
                primaryLight: 'rgba(0, 212, 160, 0.1)',
                textDark: '#e2e8f0',
                textLight: '#a0aec0',
                background: '#1a202c',
                white: '#2d3748',
                shadow: '0 2px 8px rgba(0,0,0,0.2)',
                gradient: 'linear-gradient(135deg, var(--primary), var(--secondary))'
            }
        };

        this.accents = {
            green: {
                primary: '#00b386',
                secondary: '#4a90e2'
            },
            blue: {
                primary: '#2196F3',
                secondary: '#6C63FF'
            },
            purple: {
                primary: '#9C27B0',
                secondary: '#E91E63'
            }
        };

        this.init();
    }

    init() {
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedAccent = localStorage.getItem('accent') || 'green';
        
        // Apply saved theme and accent
        this.applyTheme(savedTheme);
        this.applyAccent(savedAccent);

        // Listen for system theme changes if using system theme
        if (savedTheme === 'system') {
            this.setupSystemThemeListener();
        }

        // Dispatch initial theme event
        this.dispatchThemeEvent();
    }

    applyTheme(theme) {
        const root = document.documentElement;
        const themeColors = this.themes[theme === 'system' ? this.getSystemTheme() : theme];

        // Apply theme colors to CSS variables
        Object.entries(themeColors).forEach(([key, value]) => {
            root.style.setProperty(`--${this.camelToKebab(key)}`, value);
        });

        // Set theme attribute on body
        document.body.setAttribute('data-theme', theme);

        // Save theme preference
        localStorage.setItem('theme', theme);

        // Dispatch theme change event
        this.dispatchThemeEvent();
    }

    applyAccent(accent) {
        const root = document.documentElement;
        const accentColors = this.accents[accent];

        if (accentColors) {
            root.style.setProperty('--primary', accentColors.primary);
            root.style.setProperty('--secondary', accentColors.secondary);
            localStorage.setItem('accent', accent);
        }

        // Dispatch theme change event
        this.dispatchThemeEvent();
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setupSystemThemeListener() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (localStorage.getItem('theme') === 'system') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    dispatchThemeEvent() {
        const theme = localStorage.getItem('theme') || 'light';
        const accent = localStorage.getItem('accent') || 'green';
        
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: {
                theme,
                accent,
                colors: this.themes[theme === 'system' ? this.getSystemTheme() : theme]
            }
        }));
    }

    camelToKebab(string) {
        return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }
}

// Initialize theme manager
window.themeManager = new ThemeManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
} 