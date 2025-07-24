// Forms Management
class FormsManager {
    constructor() {
        this.currentSections = [''];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add Type button
        const addTypeBtn = document.getElementById('add-type-btn');
        if (addTypeBtn) {
            addTypeBtn.addEventListener('click', () => {
                this.openAddTypeModal();
            });
        }

        // Add Type form submission
        const addTypeForm = document.getElementById('add-type-form');
        if (addTypeForm) {
            addTypeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddTypeSubmission();
            });
        }

        // Add section button
        const addSectionBtn = document.getElementById('add-section-btn');
        if (addSectionBtn) {
            addSectionBtn.addEventListener('click', () => {
                this.addSection();
            });
        }

        // Cancel buttons for modals
        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                if (modalId && window.UIManager && typeof window.UIManager.closeModal === 'function') {
                    window.UIManager.closeModal(modalId);
                }
            });
        });
    }

    openAddTypeModal() {
        this.resetAddTypeForm();
        if (window.UIManager && typeof window.UIManager.openModal === 'function') {
            window.UIManager.openModal('add-type-modal');
        }
    }

    resetAddTypeForm() {
        // Reset form fields
        document.getElementById('type-title').value = '';
        document.getElementById('type-description').value = '';
        document.getElementById('type-content').value = '';

        // Reset sections
        this.currentSections = [''];
        this.renderSections();
    }

    handleAddTypeSubmission() {
        const title = document.getElementById('type-title').value.trim();
        const description = document.getElementById('type-description').value.trim();
        const content = document.getElementById('type-content').value.trim();

        if (!title || !description) {
            if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                window.UIManager.showToast('Missing Information', 'Please fill in all required fields.', 'error');
            }
            return;
        }

        // Get all section values
        const sections = [];
        document.querySelectorAll('.section-input').forEach(input => {
            const value = input.value.trim();
            if (value) {
                sections.push(value);
            }
        });

        const typeData = {
            title,
            description,
            content,
            sections
        };

        try {
            window.AcknowledgmentData.addAcknowledgmentType(typeData);
            if (window.UIManager) {
                if (typeof window.UIManager.closeModal === 'function') {
                    window.UIManager.closeModal('add-type-modal');
                }
                if (typeof window.UIManager.renderAcknowledgmentCards === 'function') {
                    window.UIManager.renderAcknowledgmentCards();
                }
                if (typeof window.UIManager.showToast === 'function') {
                    window.UIManager.showToast('Acknowledgment Type Added', 'New acknowledgment type has been created successfully.', 'success');
                }
            }
        } catch (error) {
            console.error('Error adding acknowledgment type:', error);
            if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                window.UIManager.showToast('Error', 'Failed to add acknowledgment type. Please try again.', 'error');
            }
        }
    }

    addSection() {
        this.currentSections.push('');
        this.renderSections();
    }

    removeSection(index) {
        if (this.currentSections.length > 1) {
            this.currentSections.splice(index, 1);
            this.renderSections();
        }
    }

    renderSections() {
        const container = document.getElementById('sections-container');
        if (!container) return;

        container.innerHTML = this.currentSections.map((section, index) => `
            <div class="section-item">
                <span class="section-number">${index + 1}.</span>
                <textarea 
                    class="section-input" 
                    placeholder="Enter section ${index + 1} content" 
                    rows="2"
                    data-index="${index}"
                >${section}</textarea>
                ${this.currentSections.length > 1 ? `
                    <button type="button" class="btn-remove" data-index="${index}">Remove</button>
                ` : ''}
            </div>
        `).join('');

        // Add event listeners to new inputs
        container.querySelectorAll('.section-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.currentSections[index] = e.target.value;
            });
        });

        // Add event listeners to remove buttons
        container.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.removeSection(index);
            });
        });

        // Show/hide remove buttons based on section count
        const removeButtons = container.querySelectorAll('.btn-remove');
        removeButtons.forEach(btn => {
            btn.style.display = this.currentSections.length > 1 ? 'block' : 'none';
        });
    }

    validateForm(formData) {
        const errors = [];

        if (!formData.title || !formData.title.trim()) {
            errors.push('Title is required');
        }

        if (!formData.description || !formData.description.trim()) {
            errors.push('Description is required');
        }

        if (formData.title && formData.title.length > 100) {
            errors.push('Title must be less than 100 characters');
        }

        if (formData.description && formData.description.length > 200) {
            errors.push('Description must be less than 200 characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return '';

        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 1000); // Limit length
    }

    formatFormData(rawData) {
        return {
            title: this.sanitizeInput(rawData.title),
            description: this.sanitizeInput(rawData.description),
            content: this.sanitizeInput(rawData.content),
            sections: rawData.sections
                .map(section => this.sanitizeInput(section))
                .filter(section => section.length > 0)
        };
    }

    // Helper method to get form data
    getAddTypeFormData() {
        const title = document.getElementById('type-title').value;
        const description = document.getElementById('type-description').value;
        const content = document.getElementById('type-content').value;

        const sections = [];
        document.querySelectorAll('.section-input').forEach(input => {
            const value = input.value.trim();
            if (value) {
                sections.push(value);
            }
        });

        return {
            title,
            description,
            content,
            sections
        };
    }

    // Clear all form data
    clearFormData() {
        const form = document.getElementById('add-type-form');
        if (form) {
            form.reset();
        }
        this.currentSections = [''];
        this.renderSections();
    }

    // Show validation errors
    showValidationErrors(errors) {
        const errorMessage = errors.join('\n');
        if (window.UIManager && typeof window.UIManager.showToast === 'function') {
            window.UIManager.showToast('Validation Error', errorMessage, 'error');
        }
    }
}

// Make class available globally
window.FormsManagerClass = FormsManager;

const createFormsManager = () => {
    const instance = new FormsManager();
    window.FormsManager = instance;
    window.FormsManagerInstance = instance;
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFormsManager);
} else {
    createFormsManager();
} 