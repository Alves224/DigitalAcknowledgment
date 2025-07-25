// SharePoint Service - Real Implementation with Mock Fallback
class SharePointService {
    constructor() {
        this.baseUrl = this._getSharePointBaseUrl();
        this.isOnline = false;
        this.useMockService = false;
        this.currentUser = null;
        this.adminEmails = [];
        this.init();
    }

    async init() {
        try {
            await this._detectEnvironment();
            if (this.useMockService) {
                console.log('🧪 Using Mock SharePoint Service for testing');
                this.mockService = window.SharePointMock;
            } else {
                console.log('🌐 Using Real SharePoint Service');
                await this._loadSharePointContext();
            }
        } catch (error) {
            console.warn('SharePoint service initialization failed, falling back to mock:', error);
            this.useMockService = true;
            this.mockService = window.SharePointMock;
        }
    }

    // Environment Detection
    async _detectEnvironment() {
        // Check if we're in SharePoint Online
        if (window.location.hostname.includes('sharepoint.com')) {
            this.isOnline = true;
            return;
        }

        // Check if we're in SharePoint on-premises
        if (window._spPageContextInfo || window.SP) {
            this.isOnline = false;
            return;
        }

        // Check if we can access SharePoint REST API
        try {
            const testUrl = `${this.baseUrl}/_api/web`;
            const response = await fetch(testUrl, {
                headers: {
                    'Accept': 'application/json;odata=verbose'
                }
            });
            if (response.ok) {
                this.isOnline = true;
                return;
            }
        } catch (error) {
            // Fall back to mock
        }

        // Default to mock if no SharePoint detected
        this.useMockService = true;
    }

    _getSharePointBaseUrl() {
        if (window._spPageContextInfo) {
            return window._spPageContextInfo.webAbsoluteUrl;
        }
        
        if (window.location.hostname.includes('sharepoint.com')) {
            return window.location.origin + window.location.pathname.split('/')[1];
        }

        // Default for testing
        return window.location.origin;
    }

    async _loadSharePointContext() {
        if (window.SP && window.SP.ClientContext) {
            // SharePoint JavaScript Client Object Model is available
            this.clientContext = new window.SP.ClientContext(this.baseUrl);
            this.web = this.clientContext.get_web();
        }
    }

    // User Methods
    async getCurrentUser() {
        if (this.useMockService) {
            return await this.mockService.getCurrentUser();
        }

        try {
            const response = await fetch(`${this.baseUrl}/_api/web/currentuser`, {
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.currentUser = data.d;
            return this.currentUser;
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    }

    async isUserAdmin() {
        if (this.useMockService) {
            return await this.mockService.isUserAdmin();
        }

        try {
            // First, get current user if not already loaded
            if (!this.currentUser) {
                await this.getCurrentUser();
            }

            // Check if user is in admin list
            const adminItems = await this.getListItems('AdminStaff');
            const userEmail = this.currentUser.Email.toLowerCase();
            
            return adminItems.some(item => 
                item.Email && item.Email.toLowerCase() === userEmail
            );
        } catch (error) {
            console.error('Error checking admin status:', error);
            // Default to false if error occurs
            return false;
        }
    }

    // List Methods
    async getListItems(listName, select = '', filter = '', orderBy = '') {
        if (this.useMockService) {
            return await this.mockService.getListItems(listName);
        }

        try {
            let url = `${this.baseUrl}/_api/web/lists/getbytitle('${listName}')/items`;
            
            const params = [];
            if (select) params.push(`$select=${select}`);
            if (filter) params.push(`$filter=${filter}`);
            if (orderBy) params.push(`$orderby=${orderBy}`);
            
            if (params.length > 0) {
                url += '?' + params.join('&');
            }

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.d.results;
        } catch (error) {
            console.error(`Error getting list items from ${listName}:`, error);
            throw error;
        }
    }

    async addListItem(listName, item) {
        if (this.useMockService) {
            return await this.mockService.addListItem(listName, item);
        }

        try {
            // Get form digest for authentication
            const digestResponse = await fetch(`${this.baseUrl}/_api/contextinfo`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });

            const digestData = await digestResponse.json();
            const formDigest = digestData.d.GetContextWebInformation.FormDigestValue;

            // Add the item
            const response = await fetch(`${this.baseUrl}/_api/web/lists/getbytitle('${listName}')/items`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': formDigest
                },
                credentials: 'include',
                body: JSON.stringify(item)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.d;
        } catch (error) {
            console.error(`Error adding item to ${listName}:`, error);
            throw error;
        }
    }

    async createList(listName, description = '', templateType = 100) {
        if (this.useMockService) {
            return await this.mockService.createList(listName, description);
        }

        try {
            // Get form digest
            const digestResponse = await fetch(`${this.baseUrl}/_api/contextinfo`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });

            const digestData = await digestResponse.json();
            const formDigest = digestData.d.GetContextWebInformation.FormDigestValue;

            // Create the list
            const listCreationInfo = {
                '__metadata': { 'type': 'SP.ListCreationInformation' },
                'Title': listName,
                'Description': description,
                'TemplateType': templateType
            };

            const response = await fetch(`${this.baseUrl}/_api/web/lists`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': formDigest
                },
                credentials: 'include',
                body: JSON.stringify(listCreationInfo)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.d;
        } catch (error) {
            console.error(`Error creating list ${listName}:`, error);
            throw error;
        }
    }

    async deleteList(listName) {
        if (this.useMockService) {
            return await this.mockService.deleteList(listName);
        }

        try {
            // Get form digest
            const digestResponse = await fetch(`${this.baseUrl}/_api/contextinfo`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });

            const digestData = await digestResponse.json();
            const formDigest = digestData.d.GetContextWebInformation.FormDigestValue;

            // Delete the list
            const response = await fetch(`${this.baseUrl}/_api/web/lists/getbytitle('${listName}')`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': formDigest,
                    'IF-MATCH': '*'
                },
                credentials: 'include'
            });

            if (!response.ok && response.status !== 404) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error(`Error deleting list ${listName}:`, error);
            throw error;
        }
    }

    async searchLists(query) {
        if (this.useMockService) {
            return await this.mockService.searchLists(query);
        }

        try {
            const response = await fetch(`${this.baseUrl}/_api/web/lists?$filter=substringof('${query}',Title)`, {
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.d.results;
        } catch (error) {
            console.error('Error searching lists:', error);
            throw error;
        }
    }

    // Utility Methods
    getEnvironmentInfo() {
        return {
            baseUrl: this.baseUrl,
            isOnline: this.isOnline,
            useMockService: this.useMockService,
            currentUser: this.currentUser,
            hasSharePointContext: !!window._spPageContextInfo
        };
    }

    async testConnection() {
        try {
            if (this.useMockService) {
                return await this.mockService.testConnection();
            }

            const user = await this.getCurrentUser();
            const isAdmin = await this.isUserAdmin();
            
            return {
                success: true,
                user: user,
                isAdmin: isAdmin,
                environment: this.getEnvironmentInfo()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                environment: this.getEnvironmentInfo()
            };
        }
    }

    // Error Handling
    _handleSharePointError(error) {
        if (error.message && error.message.includes('403')) {
            return new Error('Access denied. Please check your SharePoint permissions.');
        }
        if (error.message && error.message.includes('404')) {
            return new Error('SharePoint resource not found.');
        }
        if (error.message && error.message.includes('401')) {
            return new Error('Authentication required. Please log in to SharePoint.');
        }
        return error;
    }
}

// Create global instance
window.SharePointService = new SharePointService();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharePointService;
}