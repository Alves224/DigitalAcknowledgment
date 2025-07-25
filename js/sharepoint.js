// SharePoint Integration Module
class SharePointService {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.adminList = null;
        this.sharepointUrl = '';
        this.initialized = false;
    }

    async initialize() {
        try {
            await this.loadSharePointContext();
            await this.getCurrentUser();
            await this.checkAdminRole();
            this.initialized = true;
            console.log('SharePoint service initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize SharePoint service:', error);
            this.showFallbackMessage();
            return false;
        }
    }

    async loadSharePointContext() {
        // Check if we're running in SharePoint context
        if (typeof _spPageContextInfo !== 'undefined') {
            this.sharepointUrl = _spPageContextInfo.webAbsoluteUrl;
            this.siteUrl = _spPageContextInfo.siteAbsoluteUrl;
        } else {
            throw new Error('SharePoint context not available');
        }
    }

    async getCurrentUser() {
        try {
            const response = await fetch(`${this.sharepointUrl}/_api/web/currentuser`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'X-RequestDigest': await this.getRequestDigest()
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.currentUser = {
                id: data.d.Id,
                loginName: data.d.LoginName,
                title: data.d.Title,
                email: data.d.Email
            };

            console.log('Current user loaded:', this.currentUser);
            return this.currentUser;
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    }

    async checkAdminRole() {
        try {
            // First, check if admin list exists
            const adminListResponse = await fetch(`${this.sharepointUrl}/_api/web/lists/getbytitle('AcknowledgmentAdmins')`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                }
            });

            if (!adminListResponse.ok) {
                console.log('Admin list not found, creating...');
                await this.createAdminList();
            }

            // Check if current user is in admin list
            const response = await fetch(`${this.sharepointUrl}/_api/web/lists/getbytitle('AcknowledgmentAdmins')/items?$filter=UserEmail eq '${this.currentUser.email}'`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.isAdmin = data.d.results.length > 0;

            console.log('Admin check completed:', this.isAdmin);
            return this.isAdmin;
        } catch (error) {
            console.error('Error checking admin role:', error);
            // Default to false if we can't check
            this.isAdmin = false;
            return false;
        }
    }

    async createAdminList() {
        try {
            const listMetadata = {
                __metadata: { type: 'SP.List' },
                Title: 'AcknowledgmentAdmins',
                Description: 'List of users who can manage acknowledgment types',
                BaseTemplate: 100
            };

            const response = await fetch(`${this.sharepointUrl}/_api/web/lists`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': await this.getRequestDigest()
                },
                body: JSON.stringify(listMetadata)
            });

            if (!response.ok) {
                throw new Error(`Failed to create admin list: ${response.status}`);
            }

            // Add fields to the list
            await this.addAdminListFields();
            console.log('Admin list created successfully');
        } catch (error) {
            console.error('Error creating admin list:', error);
            throw error;
        }
    }

    async addAdminListFields() {
        const fields = [
            {
                __metadata: { type: 'SP.Field' },
                FieldTypeKind: 2, // Text
                Title: 'UserEmail',
                Required: true
            },
            {
                __metadata: { type: 'SP.Field' },
                FieldTypeKind: 2, // Text
                Title: 'UserName',
                Required: true
            }
        ];

        for (const field of fields) {
            try {
                await fetch(`${this.sharepointUrl}/_api/web/lists/getbytitle('AcknowledgmentAdmins')/fields`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=verbose',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-RequestDigest': await this.getRequestDigest()
                    },
                    body: JSON.stringify(field)
                });
            } catch (error) {
                console.error(`Error adding field ${field.Title}:`, error);
            }
        }
    }

    async getRequestDigest() {
        try {
            const response = await fetch(`${this.sharepointUrl}/_api/contextinfo`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.d.GetContextWebInformation.FormDigestValue;
        } catch (error) {
            console.error('Error getting request digest:', error);
            throw error;
        }
    }

    async createSubmissionList(listName) {
        try {
            const listMetadata = {
                __metadata: { type: 'SP.List' },
                Title: listName,
                Description: 'Acknowledgment submissions storage',
                BaseTemplate: 100
            };

            const response = await fetch(`${this.sharepointUrl}/_api/web/lists`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': await this.getRequestDigest()
                },
                body: JSON.stringify(listMetadata)
            });

            if (!response.ok) {
                throw new Error(`Failed to create submission list: ${response.status}`);
            }

            // Add custom fields
            await this.addSubmissionListFields(listName);
            console.log(`Submission list '${listName}' created successfully`);
            return true;
        } catch (error) {
            console.error('Error creating submission list:', error);
            throw error;
        }
    }

    async addSubmissionListFields(listName) {
        const fields = [
            {
                __metadata: { type: 'SP.Field' },
                FieldTypeKind: 2, // Text
                Title: 'AcknowledgmentType',
                Required: true
            },
            {
                __metadata: { type: 'SP.Field' },
                FieldTypeKind: 2, // Text
                Title: 'EmployeeName',
                Required: true
            },
            {
                __metadata: { type: 'SP.Field' },
                FieldTypeKind: 2, // Text
                Title: 'RequestNo',
                Required: true
            },
            {
                __metadata: { type: 'SP.Field' },
                FieldTypeKind: 8, // Boolean
                Title: 'Acknowledged',
                Required: true
            },
            {
                __metadata: { type: 'SP.Field' },
                FieldTypeKind: 4, // DateTime
                Title: 'SubmissionDate',
                Required: true
            }
        ];

        for (const field of fields) {
            try {
                await fetch(`${this.sharepointUrl}/_api/web/lists/getbytitle('${listName}')/fields`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=verbose',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-RequestDigest': await this.getRequestDigest()
                    },
                    body: JSON.stringify(field)
                });
            } catch (error) {
                console.error(`Error adding field ${field.Title}:`, error);
            }
        }
    }

    async addSubmission(submission, listName = 'AcknowledgmentSubmissions') {
        try {
            // Ensure the list exists
            await this.ensureSubmissionListExists(listName);

            const itemData = {
                __metadata: { type: `SP.Data.${listName}ListItem` },
                Title: `${submission.type} - ${submission.employeeName}`,
                AcknowledgmentType: submission.type,
                EmployeeName: submission.employeeName,
                RequestNo: submission.requestNo,
                Acknowledged: submission.acknowledged,
                SubmissionDate: new Date().toISOString()
            };

            const response = await fetch(`${this.sharepointUrl}/_api/web/lists/getbytitle('${listName}')/items`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': await this.getRequestDigest()
                },
                body: JSON.stringify(itemData)
            });

            if (!response.ok) {
                throw new Error(`Failed to add submission: ${response.status}`);
            }

            const data = await response.json();
            console.log('Submission added to SharePoint:', data.d);
            return data.d;
        } catch (error) {
            console.error('Error adding submission to SharePoint:', error);
            throw error;
        }
    }

    async getSubmissions(listName = 'AcknowledgmentSubmissions', employeeName = null) {
        try {
            let url = `${this.sharepointUrl}/_api/web/lists/getbytitle('${listName}')/items?$orderby=SubmissionDate desc`;
            
            if (employeeName) {
                url += `&$filter=EmployeeName eq '${employeeName}'`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // List doesn't exist yet
                    return [];
                }
                throw new Error(`Failed to get submissions: ${response.status}`);
            }

            const data = await response.json();
            return data.d.results.map(item => ({
                id: item.Id.toString(),
                type: item.AcknowledgmentType,
                employeeName: item.EmployeeName,
                requestNo: item.RequestNo,
                acknowledged: item.Acknowledged,
                date: new Date(item.SubmissionDate).toLocaleDateString()
            }));
        } catch (error) {
            console.error('Error getting submissions from SharePoint:', error);
            return [];
        }
    }

    async ensureSubmissionListExists(listName) {
        try {
            const response = await fetch(`${this.sharepointUrl}/_api/web/lists/getbytitle('${listName}')`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                }
            });

            if (!response.ok && response.status === 404) {
                await this.createSubmissionList(listName);
            }
        } catch (error) {
            console.error('Error ensuring submission list exists:', error);
            throw error;
        }
    }

    async getAvailableLists() {
        try {
            const response = await fetch(`${this.sharepointUrl}/_api/web/lists?$filter=Hidden eq false and BaseTemplate eq 100`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get lists: ${response.status}`);
            }

            const data = await response.json();
            return data.d.results.map(list => ({
                title: list.Title,
                id: list.Id
            }));
        } catch (error) {
            console.error('Error getting available lists:', error);
            return [];
        }
    }

    // Admin management methods
    async addAdmin(userEmail, userName) {
        if (!this.isAdmin) {
            throw new Error('Only admins can add other admins');
        }

        try {
            const itemData = {
                __metadata: { type: 'SP.Data.AcknowledgmentAdminsListItem' },
                Title: userName,
                UserEmail: userEmail,
                UserName: userName
            };

            const response = await fetch(`${this.sharepointUrl}/_api/web/lists/getbytitle('AcknowledgmentAdmins')/items`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': await this.getRequestDigest()
                },
                body: JSON.stringify(itemData)
            });

            if (!response.ok) {
                throw new Error(`Failed to add admin: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding admin:', error);
            throw error;
        }
    }

    async removeAdmin(userEmail) {
        if (!this.isAdmin) {
            throw new Error('Only admins can remove other admins');
        }

        try {
            // Get the item ID first
            const getResponse = await fetch(`${this.sharepointUrl}/_api/web/lists/getbytitle('AcknowledgmentAdmins')/items?$filter=UserEmail eq '${userEmail}'`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                }
            });

            if (!getResponse.ok) {
                throw new Error(`Failed to find admin: ${getResponse.status}`);
            }

            const data = await getResponse.json();
            if (data.d.results.length === 0) {
                throw new Error('Admin not found');
            }

            const itemId = data.d.results[0].Id;

            // Delete the item
            const deleteResponse = await fetch(`${this.sharepointUrl}/_api/web/lists/getbytitle('AcknowledgmentAdmins')/items(${itemId})`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'X-RequestDigest': await this.getRequestDigest(),
                    'If-Match': '*'
                }
            });

            if (!deleteResponse.ok) {
                throw new Error(`Failed to remove admin: ${deleteResponse.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error removing admin:', error);
            throw error;
        }
    }

    showFallbackMessage() {
        console.warn('SharePoint integration not available, falling back to localStorage');
        if (window.UIManager && typeof window.UIManager.showToast === 'function') {
            window.UIManager.showToast(
                'SharePoint Integration',
                'SharePoint features not available. Using local storage as fallback.',
                'info'
            );
        }
    }

    // Utility methods
    isInitialized() {
        return this.initialized;
    }

    getCurrentUserInfo() {
        return this.currentUser;
    }

    getIsAdmin() {
        return this.isAdmin;
    }

    getEmployeeName() {
        return this.currentUser ? this.currentUser.title : '';
    }
}

// Make SharePoint service available globally
window.SharePointService = new SharePointService();