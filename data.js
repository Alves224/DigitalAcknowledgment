// Acknowledgment Types and Data Management
class AcknowledgmentData {
    constructor() {
        this.defaultTypes = [
            {
                id: 'remote-work',
                title: 'Remote Area Working Acknowledgement',
                description: 'إقرار إلتزام بتعليمات العمل في المناطق النائية',
                icon: 'laptop',
                content: {
                    arabic: 'إقرار إلتزام بتعليمات العمل في المناطق النائية',
                    subtitle: 'Remote Area Working Acknowledgement',
                    description: `أقر بأنني تقدمت بناءاً على رغبتي واختياري بطلب الأنتقال للعمل في المنطقة النائية لمدة سنتين او في اي وقت يحدد حسب مايتطلبه العمل إستناداً إلى أنظمة التنقل في إدارة الأمن الصناعي

كما أنني أوافق على الشروط الواردة أدناه الخاصة بالعمل في المناطق النائية:-`,
                    rules: [
                        'إستخدام السكن الموفر من قبل الشركة طيلة فترة النوبة الأسبوعية.',
                        'إستخدام المواصلات الموفرة من قبل الشركة وعدم إستخدام المركبة الشخصية للتنقل للعمل',
                        'الإلتزام واتباع جميع أنظمة وتعليمات السلامة وفق سياسات وأنظمة الشركة.'
                    ]
                }
            },
            {
                id: 'transfer',
                title: 'Transfer Acknowledgment',
                description: 'Acknowledge transfer policies and procedures',
                icon: 'file-text'
            },
            {
                id: 'safety',
                title: 'Safety Acknowledgment',
                description: 'Acknowledge safety protocols and guidelines',
                icon: 'shield'
            },
            {
                id: 'security',
                title: 'Security Acknowledgment',
                description: 'Acknowledge security policies and data protection',
                icon: 'alert-triangle'
            },
            {
                id: 'training',
                title: 'Training Acknowledgment',
                description: 'Acknowledge completion of mandatory training',
                icon: 'users'
            }
        ];
    }

    // Get all acknowledgment types
    getAcknowledgmentTypes() {
        if (typeof Storage !== 'undefined') {
            const stored = Storage.get('acknowledgmentTypes');
            return stored || [...this.defaultTypes];
        }
        return [...this.defaultTypes];
    }

    // Add new acknowledgment type
    addAcknowledgmentType(typeData) {
        const types = this.getAcknowledgmentTypes();
        const newType = {
            id: `custom-${Date.now()}`,
            title: typeData.title,
            description: typeData.description,
            icon: 'file-text',
            content: {
                description: typeData.content,
                rules: typeData.sections.filter(section => section.trim() !== '')
            }
        };

        types.push(newType);
        if (typeof Storage !== 'undefined') {
            Storage.set('acknowledgmentTypes', types);
        }
        return newType;
    }

    // Delete acknowledgment type
    deleteAcknowledgmentType(typeId) {
        const types = this.getAcknowledgmentTypes();
        const filtered = types.filter(type => type.id !== typeId);
        if (typeof Storage !== 'undefined') {
            Storage.set('acknowledgmentTypes', filtered);
        }
        return filtered;
    }

    // Get acknowledgment type by ID
    getAcknowledgmentType(typeId) {
        const types = this.getAcknowledgmentTypes();
        return types.find(type => type.id === typeId);
    }

    // Generate request number
    generateRequestNumber() {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000000);
        return `${year}/${random}`;
    }

    // Get icon SVG
    getIconSVG(iconName) {
        const icons = {
            'laptop': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>`,
            'file-text': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
            </svg>`,
            'shield': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>`,
            'alert-triangle': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>`,
            'users': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>`
        };

        return icons[iconName] || icons['file-text'];
    }
}

// Create global instance
window.AcknowledgmentData = new AcknowledgmentData(); 