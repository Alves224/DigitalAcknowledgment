// Mock SharePoint Service for Testing
class SharePointMockService {
    constructor() {
        this.isTestMode = true;
        this.currentUser = null;
        this.adminUsers = [
            'admin@company.com',
            'manager@company.com',
            'supervisor@company.com'
        ];
        this.mockUsers = [
            { email: 'admin@company.com', displayName: 'John Admin', isAdmin: true },
            { email: 'manager@company.com', displayName: 'Sarah Manager', isAdmin: true },
            { email: 'employee1@company.com', displayName: 'Mike Employee', isAdmin: false },
            { email: 'employee2@company.com', displayName: 'Lisa Worker', isAdmin: false },
            { email: 'test@company.com', displayName: 'Test User', isAdmin: false }
        ];
        this.mockLists = {};
        this.init();
    }

    init() {
        // Initialize with some test data
        this.mockLists = {
            'AdminStaff': {
                id: 'admin-staff-list',
                title: 'Admin Staff',
                items: this.adminUsers.map((email, index) => ({
                    Id: index + 1,
                    Title: email,
                    Email: email
                }))
            },
            'SafetyAcknowledgments': {
                id: 'safety-ack-list',
                title: 'Safety Acknowledgments',
                items: []
            },
            'TrainingAcknowledgments': {
                id: 'training-ack-list',
                title: 'Training Acknowledgments',
                items: []
            }
        };

        // Simulate user login
        this.simulateUserLogin();
    }

    // Simulate different user logins for testing
    simulateUserLogin(userEmail = 'employee1@company.com') {
        this.currentUser = this.mockUsers.find(user => user.email === userEmail);
        if (!this.currentUser) {
            this.currentUser = this.mockUsers[2]; // Default to employee1
        }
        console.log(`🧪 Mock SharePoint: Logged in as ${this.currentUser.displayName} (${this.currentUser.email})`);
        this.showTestControls();
    }

    // Show test controls in the UI
    showTestControls() {
        if (document.getElementById('test-controls')) return;

        const testControls = document.createElement('div');
        testControls.id = 'test-controls';
        testControls.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: #f0f0f0;
                border: 2px solid #007acc;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: monospace;
                font-size: 12px;
                max-width: 300px;
            ">
                <div style="font-weight: bold; margin-bottom: 10px; color: #007acc;">
                    🧪 SharePoint Test Mode
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>Current User:</strong><br>
                    ${this.currentUser.displayName}<br>
                    <small>${this.currentUser.email}</small><br>
                    <span style="color: ${this.currentUser.isAdmin ? '#28a745' : '#6c757d'};">
                        ${this.currentUser.isAdmin ? '👑 Admin' : '👤 Employee'}
                    </span>
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>Switch User:</strong><br>
                    <select id="user-switch" style="width: 100%; margin-top: 5px;">
                        ${this.mockUsers.map(user => `
                            <option value="${user.email}" ${user.email === this.currentUser.email ? 'selected' : ''}>
                                ${user.displayName} (${user.isAdmin ? 'Admin' : 'Employee'})
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="test-connection" style="width: 100%; padding: 5px; background: #007acc; color: white; border: none; border-radius: 4px;">
                        Test Connection
                    </button>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="view-lists" style="width: 100%; padding: 5px; background: #28a745; color: white; border: none; border-radius: 4px;">
                        View Mock Data
                    </button>
                </div>
                <div>
                    <button id="close-test-controls" style="width: 100%; padding: 5px; background: #dc3545; color: white; border: none; border-radius: 4px;">
                        Hide Controls
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(testControls);

        // Add event listeners
        document.getElementById('user-switch').addEventListener('change', (e) => {
            this.simulateUserLogin(e.target.value);
            window.location.reload(); // Reload to apply role changes
        });

        document.getElementById('test-connection').addEventListener('click', () => {
            this.testConnection();
        });

        document.getElementById('view-lists').addEventListener('click', () => {
            this.showMockData();
        });

        document.getElementById('close-test-controls').addEventListener('click', () => {
            testControls.style.display = 'none';
        });
    }

    // Test connection method
    async testConnection() {
        try {
            const user = await this.getCurrentUser();
            const isAdmin = await this.isUserAdmin();
            alert(`✅ Connection Test Successful!\n\nUser: ${user.displayName}\nEmail: ${user.email}\nRole: ${isAdmin ? 'Admin' : 'Employee'}\n\nMock API is working correctly.`);
        } catch (error) {
            alert(`❌ Connection Test Failed!\n\nError: ${error.message}`);
        }
    }

    // Show mock data in console
    showMockData() {
        console.log('🧪 Mock SharePoint Data:');
        console.log('Current User:', this.currentUser);
        console.log('Admin Users:', this.adminUsers);
        console.log('Mock Lists:', this.mockLists);
        alert('Mock data logged to console. Press F12 to view.');
    }

    // Mock SharePoint REST API methods
    async getCurrentUser() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    Id: this.currentUser.email === 'admin@company.com' ? 1 : 2,
                    Title: this.currentUser.displayName,
                    Email: this.currentUser.email,
                    LoginName: this.currentUser.email
                });
            }, 100); // Simulate network delay
        });
    }

    async isUserAdmin() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.currentUser.isAdmin);
            }, 100);
        });
    }

    async getListItems(listName) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.mockLists[listName]) {
                    resolve(this.mockLists[listName].items);
                } else {
                    reject(new Error(`List '${listName}' not found`));
                }
            }, 200);
        });
    }

    async addListItem(listName, item) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.mockLists[listName]) {
                    const newItem = {
                        ...item,
                        Id: this.mockLists[listName].items.length + 1,
                        Created: new Date().toISOString(),
                        CreatedBy: this.currentUser.displayName
                    };
                    this.mockLists[listName].items.push(newItem);
                    console.log(`🧪 Added item to ${listName}:`, newItem);
                    resolve(newItem);
                } else {
                    reject(new Error(`List '${listName}' not found`));
                }
            }, 300);
        });
    }

    async createList(listName, description = '') {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (!this.mockLists[listName]) {
                    this.mockLists[listName] = {
                        id: listName.toLowerCase().replace(/\s+/g, '-'),
                        title: listName,
                        description: description,
                        items: []
                    };
                    console.log(`🧪 Created new list: ${listName}`);
                }
                resolve(this.mockLists[listName]);
            }, 500);
        });
    }

    async deleteList(listName) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.mockLists[listName]) {
                    delete this.mockLists[listName];
                    console.log(`🧪 Deleted list: ${listName}`);
                    resolve(true);
                } else {
                    reject(new Error(`List '${listName}' not found`));
                }
            }, 300);
        });
    }

    async searchLists(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const results = Object.keys(this.mockLists).filter(listName =>
                    listName.toLowerCase().includes(query.toLowerCase())
                );
                resolve(results.map(name => this.mockLists[name]));
            }, 200);
        });
    }

    // Utility methods for testing
    reset() {
        this.init();
        console.log('🧪 Mock SharePoint data reset');
    }

    addTestData(listName, items) {
        if (this.mockLists[listName]) {
            items.forEach(item => {
                this.mockLists[listName].items.push({
                    ...item,
                    Id: this.mockLists[listName].items.length + 1,
                    Created: new Date().toISOString(),
                    CreatedBy: 'Test System'
                });
            });
            console.log(`🧪 Added test data to ${listName}:`, items);
        }
    }

    getTestSummary() {
        return {
            currentUser: this.currentUser,
            listsCount: Object.keys(this.mockLists).length,
            totalItems: Object.values(this.mockLists).reduce((sum, list) => sum + list.items.length, 0),
            isTestMode: this.isTestMode
        };
    }
}

// Create global instance
window.SharePointMock = new SharePointMockService();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharePointMockService;
}