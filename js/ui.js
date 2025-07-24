// UI Management and Components
class UIManager {
    constructor() {
        this.currentSelectedType = null;
        this.currentFormData = {
            requestNo: '',
            employeeName: '',
            acknowledged: false
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Don't render cards immediately - wait for explicit initialization
        // this.renderAcknowledgmentCards();
        // this.updateSubmissionsSection();
    }

    // Initialize UI after all dependencies are ready
    initializeUI() {
        this.renderAcknowledgmentCards();
        this.updateSubmissionsSection();
    }

    setupEventListeners() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                if (modalId) {
                    this.closeModal(modalId);
                }
            });
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
    }

    renderAcknowledgmentCards() {
        const grid = document.getElementById('acknowledgment-grid');
        if (!grid) return;

        if (!window.AcknowledgmentData || typeof window.AcknowledgmentData.getAcknowledgmentTypes !== 'function') {
            console.error('AcknowledgmentData not available');
            return;
        }

        const types = window.AcknowledgmentData.getAcknowledgmentTypes();

        grid.innerHTML = types.map(type => {
            const isCustom = type.id.startsWith('custom-');
            const iconSVG = window.AcknowledgmentData.getIconSVG(type.icon);

            return `
                <div class="card acknowledgment-card" data-type-id="${type.id}">
                    <div class="card-header">
                        ${isCustom ? `
                            <button class="delete-btn" data-type-id="${type.id}" title="Delete acknowledgment type">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3,6 5,6 21,6"></polyline>
                                    <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        ` : ''}
                        <div class="icon-container">
                            ${iconSVG}
                        </div>
                        <h3 class="card-title">${type.title}</h3>
                        <p>${type.description}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to cards
        grid.querySelectorAll('.acknowledgment-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if delete button was clicked
                if (e.target.closest('.delete-btn')) return;

                const typeId = card.getAttribute('data-type-id');
                this.openAcknowledgmentModal(typeId);
            });
        });

        // Add event listeners to delete buttons
        grid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const typeId = btn.getAttribute('data-type-id');
                this.deleteAcknowledgmentType(typeId);
            });
        });
    }

    openAcknowledgmentModal(typeId) {
        const type = window.AcknowledgmentData.getAcknowledgmentType(typeId);
        if (!type) return;

        this.currentSelectedType = typeId;
        this.currentFormData = {
            requestNo: window.AcknowledgmentData.generateRequestNumber(),
            employeeName: '',
            acknowledged: false
        };

        const modal = document.getElementById('acknowledgment-modal');
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = this.generateAcknowledgmentContent(type);
        this.setupAcknowledgmentFormListeners();

        this.openModal('acknowledgment-modal');
    }

    generateAcknowledgmentContent(type) {
        const isRemoteWork = type.id === 'remote-work';

        return `
            <div class="acknowledgment-content">
                ${isRemoteWork && type.content ? `
                    <!-- Header with Arabic title -->
                    <div class="acknowledgment-header">
                        <h1 dir="rtl">${type.content.arabic}</h1>
                        <h2>${type.content.subtitle}</h2>
                    </div>

                    <!-- Content -->
                    <div class="acknowledgment-text" dir="rtl">
                        <p>${type.content.description}</p>
                    </div>

                    ${type.content.rules ? `
                        <div class="acknowledgment-rules" dir="rtl">
                            <ol>
                                ${type.content.rules.map(rule => `<li>${rule}</li>`).join('')}
                            </ol>
                        </div>
                    ` : ''}
                ` : `
                    <div class="acknowledgment-header">
                        <h1>${type.title}</h1>
                    </div>

                    ${type.content?.description ? `
                        <div class="acknowledgment-text" dir="rtl">
                            <p style="white-space: pre-line;">${type.content.description}</p>
                        </div>
                    ` : ''}

                    ${type.content?.rules && type.content.rules.length > 0 ? `
                        <div class="acknowledgment-rules" dir="rtl">
                            <ol>
                                ${type.content.rules.map(rule => `<li>${rule}</li>`).join('')}
                            </ol>
                        </div>
                    ` : ''}
                `}

                <!-- Notice -->
                <div class="notice-box">
                    <div class="notice-dot"></div>
                    <p class="notice-text">
                        The content of this item will be sent as an e-mail message to the person or group assigned to the item.
                    </p>
                </div>

                <!-- Form -->
                <div class="request-info">
                    <h3>Request Information</h3>
                    
                    <div class="info-grid">
                        <div class="info-row">
                            <label class="info-label">Request No:</label>
                            <input type="text" class="info-input" id="modal-request-no" value="${this.currentFormData.requestNo}">
                        </div>
                        
                        <div class="info-row">
                            <label class="info-label">Employee Name:</label>
                            <input type="text" class="info-input" id="modal-employee-name" placeholder="Enter employee name" value="${this.currentFormData.employeeName}">
                        </div>

                        <div class="info-row" style="align-items: flex-start;">
                            <label class="info-label">Acknowledgment *</label>
                            <div class="checkbox-container">
                                <input type="checkbox" id="modal-acknowledged" class="checkbox" ${this.currentFormData.acknowledged ? 'checked' : ''}>
                                <label for="modal-acknowledged" class="checkbox-label">
                                    I acknowledge that I have read, understood and agree to the above policies and procedures
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Buttons -->
                <div class="form-actions">
                    <button id="submit-acknowledgment" class="btn btn-success">Submit</button>
                    <button id="cancel-acknowledgment" class="btn btn-destructive">Cancel</button>
                </div>
            </div>
        `;
    }

    setupAcknowledgmentFormListeners() {
        // Form inputs
        const requestNoInput = document.getElementById('modal-request-no');
        const employeeNameInput = document.getElementById('modal-employee-name');
        const acknowledgedCheckbox = document.getElementById('modal-acknowledged');

        if (requestNoInput) {
            requestNoInput.addEventListener('input', (e) => {
                this.currentFormData.requestNo = e.target.value;
            });
        }

        if (employeeNameInput) {
            employeeNameInput.addEventListener('input', (e) => {
                this.currentFormData.employeeName = e.target.value;
            });
        }

        if (acknowledgedCheckbox) {
            acknowledgedCheckbox.addEventListener('change', (e) => {
                this.currentFormData.acknowledged = e.target.checked;
            });
        }

        // Submit button
        const submitBtn = document.getElementById('submit-acknowledgment');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitAcknowledgment();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancel-acknowledgment');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal('acknowledgment-modal');
            });
        }
    }

    submitAcknowledgment() {
        if (!this.currentFormData.acknowledged) {
            this.showToast('Acknowledgment Required', 'Please check the acknowledgment box to continue.', 'error');
            return;
        }

        if (!this.currentFormData.employeeName.trim()) {
            this.showToast('Employee Name Required', 'Please enter the employee name.', 'error');
            return;
        }

        const type = window.AcknowledgmentData.getAcknowledgmentType(this.currentSelectedType);
        const submission = {
            id: Date.now().toString(),
            type: type.title,
            employeeName: this.currentFormData.employeeName,
            requestNo: this.currentFormData.requestNo,
            date: new Date().toLocaleDateString(),
            acknowledged: this.currentFormData.acknowledged
        };

        Storage.addSubmission(submission);
        this.closeModal('acknowledgment-modal');
        this.updateSubmissionsSection();
        this.showToast('Acknowledgment Submitted', 'Your acknowledgment has been successfully recorded.', 'success');
    }

    deleteAcknowledgmentType(typeId) {
        if (confirm('Are you sure you want to delete this acknowledgment type?')) {
            window.AcknowledgmentData.deleteAcknowledgmentType(typeId);
            this.renderAcknowledgmentCards();
            this.showToast('Acknowledgment Deleted', 'Acknowledgment type has been deleted successfully.', 'success');
        }
    }

    updateSubmissionsSection() {
        const submissionsSection = document.getElementById('submissions-section');
        const submissionsList = document.getElementById('submissions-list');
        const submissions = Storage.getSubmissions();

        if (submissions.length === 0) {
            submissionsSection.style.display = 'none';
            return;
        }

        submissionsSection.style.display = 'block';
        this.renderSubmissions(submissions);
    }

    renderSubmissions(submissions = null) {
        const submissionsList = document.getElementById('submissions-list');
        if (!submissionsList) return;

        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput ? searchInput.value : '';

        const filteredSubmissions = submissions || Storage.searchSubmissions(searchTerm);

        if (filteredSubmissions.length === 0) {
            submissionsList.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <p>${searchTerm ? `No submissions found for "${searchTerm}"` : 'Enter an employee name to search for submissions'}</p>
                    ${searchTerm ? '<p style="font-size: 0.875rem;">Try searching with a different employee name</p>' : ''}
                </div>
            `;
            return;
        }

        submissionsList.innerHTML = filteredSubmissions.map(submission => `
            <div class="submission-item" data-submission-id="${submission.id}">
                <div class="submission-info">
                    <h3>${submission.type}</h3>
                    <p>Request No: ${submission.requestNo}</p>
                    <p>Employee: ${submission.employeeName}</p>
                </div>
                <div class="submission-status">
                    <p>${submission.date}</p>
                    <span class="status-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                        Acknowledged
                    </span>
                </div>
            </div>
        `).join('');

        // Add click listeners to submission items
        submissionsList.querySelectorAll('.submission-item').forEach(item => {
            item.addEventListener('click', () => {
                const submissionId = item.getAttribute('data-submission-id');
                this.openSubmissionModal(submissionId);
            });
        });
    }

    handleSearch(searchTerm) {
        this.renderSubmissions();
    }

    openSubmissionModal(submissionId) {
        const submissions = Storage.getSubmissions();
        const submission = submissions.find(s => s.id === submissionId);
        if (!submission) return;

        const types = window.AcknowledgmentData.getAcknowledgmentTypes();
        const type = types.find(t => t.title === submission.type);

        const modal = document.getElementById('submission-modal');
        const modalBody = document.getElementById('submission-modal-body');

        modalBody.innerHTML = this.generateSubmissionContent(submission, type);
        this.setupSubmissionModalListeners(submission);

        this.openModal('submission-modal');
    }

    generateSubmissionContent(submission, type) {
        return `
            <div class="acknowledgment-content">
                <div class="acknowledgment-header">
                    <h1>${submission.type}</h1>
                </div>
                
                <!-- Submission Info -->
                <div class="request-info">
                    <h3>Submission Information</h3>
                    
                    <div class="info-grid" style="grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <label class="info-label">Request No:</label>
                            <p style="margin: 0; color: #111;">${submission.requestNo}</p>
                        </div>
                        <div>
                            <label class="info-label">Employee Name:</label>
                            <p style="margin: 0; color: #111;">${submission.employeeName}</p>
                        </div>
                        <div>
                            <label class="info-label">Date:</label>
                            <p style="margin: 0; color: #111;">${submission.date}</p>
                        </div>
                        <div>
                            <label class="info-label">Status:</label>
                            <span class="status-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 12l2 2 4-4"/>
                                    <circle cx="12" cy="12" r="10"/>
                                </svg>
                                Acknowledged
                            </span>
                        </div>
                    </div>
                </div>

                ${type?.content ? `
                    ${type.content.arabic ? `
                        <div class="acknowledgment-header">
                            <h1 dir="rtl" style="color: #dc2626;">${type.content.arabic}</h1>
                            ${type.content.subtitle ? `<h2>${type.content.subtitle}</h2>` : ''}
                        </div>
                    ` : ''}

                    ${type.content.description ? `
                        <div class="acknowledgment-text" dir="rtl">
                            <p style="white-space: pre-line;">${type.content.description}</p>
                        </div>
                    ` : ''}

                    ${type.content.rules && type.content.rules.length > 0 ? `
                        <div class="acknowledgment-rules" dir="rtl">
                            <ol>
                                ${type.content.rules.map(rule => `<li>${rule}</li>`).join('')}
                            </ol>
                        </div>
                    ` : ''}
                ` : ''}

                <div class="notice-box">
                    <div class="notice-dot"></div>
                    <p class="notice-text">
                        This acknowledgment has been digitally signed and recorded in the system.
                    </p>
                </div>

                <div class="form-actions">
                    <button id="export-pdf" class="btn btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export PDF
                    </button>
                    <button id="close-submission" class="btn btn-outline">Close</button>
                </div>
            </div>
        `;
    }

    setupSubmissionModalListeners(submission) {
        const exportBtn = document.getElementById('export-pdf');
        const closeBtn = document.getElementById('close-submission');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                PDFExporter.exportSubmission(submission);
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal('submission-modal');
            });
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    showToast(title, message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-description">${message}</div>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }
}

// Make class available globally
window.UIManagerClass = UIManager;

const createUIManager = () => {
    try {
        const instance = new UIManager();
        window.UIManager = instance;
        window.UIManagerInstance = instance;

        // Fallback method if not in prototype
        if (typeof instance.initializeUI !== 'function') {
            instance.initializeUI = function () {
                this.renderAcknowledgmentCards();
                this.updateSubmissionsSection();
            };
        }
    } catch (error) {
        console.error('Error creating UIManager:', error);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUIManager);
} else {
    createUIManager();
}

window.createUIManagerManually = createUIManager; 