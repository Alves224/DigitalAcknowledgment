// Test Automation Script for SharePoint Integration
// Run with: node test-automation.js

const fs = require('fs');
const path = require('path');

class TestAutomation {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    async runTests() {
        console.log('🚀 Starting SharePoint Integration Test Automation\n');
        
        // File structure tests
        await this.testFileStructure();
        
        // Code quality tests
        await this.testCodeQuality();
        
        // Generate report
        this.generateReport();
    }

    async testFileStructure() {
        console.log('📁 Testing File Structure...');
        
        const requiredFiles = [
            'index.html',
            'test.html',
            'js/sharepoint-mock.js',
            'js/sharepoint-service.js',
            'js/storage.js',
            'js/data.js',
            'js/ui.js',
            'js/forms.js',
            'js/main.js',
            'css/styles.css'
        ];

        for (const file of requiredFiles) {
            const exists = fs.existsSync(file);
            this.addTestResult(`File exists: ${file}`, exists, exists ? 'Required file found' : 'Required file missing');
        }

        console.log('✅ File structure tests completed\n');
    }

    async testCodeQuality() {
        console.log('🔍 Testing Code Quality...');

        // Test SharePoint Mock Service
        await this.testJavaScriptFile('js/sharepoint-mock.js', [
            { pattern: /class SharePointMockService/, description: 'SharePointMockService class defined' },
            { pattern: /getCurrentUser/, description: 'getCurrentUser method exists' },
            { pattern: /isUserAdmin/, description: 'isUserAdmin method exists' },
            { pattern: /getListItems/, description: 'getListItems method exists' },
            { pattern: /addListItem/, description: 'addListItem method exists' },
            { pattern: /createList/, description: 'createList method exists' }
        ]);

        // Test SharePoint Service
        await this.testJavaScriptFile('js/sharepoint-service.js', [
            { pattern: /class SharePointService/, description: 'SharePointService class defined' },
            { pattern: /_detectEnvironment/, description: 'Environment detection method exists' },
            { pattern: /fetch.*_api\/web/, description: 'SharePoint REST API calls implemented' },
            { pattern: /X-RequestDigest/, description: 'SharePoint authentication headers included' }
        ]);

        // Test HTML structure
        await this.testHTMLFile('test.html', [
            { pattern: /SharePoint Integration Testing/, description: 'Test page title correct' },
            { pattern: /test-controls/, description: 'Test controls present' },
            { pattern: /TestFramework/, description: 'Test framework class defined' }
        ]);

        console.log('✅ Code quality tests completed\n');
    }

    async testJavaScriptFile(filename, patterns) {
        if (!fs.existsSync(filename)) {
            this.addTestResult(`${filename} exists`, false, 'File not found');
            return;
        }

        const content = fs.readFileSync(filename, 'utf8');
        
        for (const { pattern, description } of patterns) {
            const matches = pattern.test(content);
            this.addTestResult(`${filename}: ${description}`, matches, matches ? 'Pattern found' : 'Pattern missing');
        }
    }

    async testHTMLFile(filename, patterns) {
        if (!fs.existsSync(filename)) {
            this.addTestResult(`${filename} exists`, false, 'File not found');
            return;
        }

        const content = fs.readFileSync(filename, 'utf8');
        
        for (const { pattern, description } of patterns) {
            const matches = pattern.test(content);
            this.addTestResult(`${filename}: ${description}`, matches, matches ? 'Pattern found' : 'Pattern missing');
        }
    }

    addTestResult(testName, passed, details) {
        this.totalTests++;
        if (passed) {
            this.passedTests++;
            console.log(`✅ ${testName}`);
        } else {
            this.failedTests++;
            console.log(`❌ ${testName} - ${details}`);
        }

        this.testResults.push({
            name: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
    }

    generateReport() {
        console.log('\n📊 Test Report');
        console.log('=' .repeat(50));
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`Passed: ${this.passedTests} (${Math.round(this.passedTests / this.totalTests * 100)}%)`);
        console.log(`Failed: ${this.failedTests} (${Math.round(this.failedTests / this.totalTests * 100)}%)`);
        console.log('=' .repeat(50));

        if (this.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.name}: ${r.details}`));
        }

        // Generate JSON report
        const report = {
            summary: {
                total: this.totalTests,
                passed: this.passedTests,
                failed: this.failedTests,
                successRate: Math.round(this.passedTests / this.totalTests * 100)
            },
            results: this.testResults,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
        console.log('\n💾 Detailed report saved to test-report.json');

        // Exit with appropriate code
        process.exit(this.failedTests > 0 ? 1 : 0);
    }
}

// Browser simulation tests
function createBrowserTests() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Automated Browser Tests</title>
    <script>
        // Mock browser environment for testing
        window.testResults = [];
        
        function addTestResult(name, passed, details) {
            window.testResults.push({ name, passed, details, timestamp: Date.now() });
            console.log(passed ? '✅' : '❌', name, details || '');
        }

        async function runBrowserTests() {
            console.log('🧪 Running browser-based tests...');
            
            try {
                // Test if SharePoint services can be instantiated
                if (typeof SharePointMockService !== 'undefined') {
                    const mockService = new SharePointMockService();
                    addTestResult('SharePointMockService instantiation', true, 'Mock service created successfully');
                    
                    // Test mock service methods
                    const user = await mockService.getCurrentUser();
                    addTestResult('Mock getCurrentUser', !!user, user ? 'User returned' : 'No user returned');
                    
                    const isAdmin = await mockService.isUserAdmin();
                    addTestResult('Mock isUserAdmin', typeof isAdmin === 'boolean', 'Admin status checked');
                    
                } else {
                    addTestResult('SharePointMockService availability', false, 'SharePointMockService not found');
                }

                if (typeof SharePointService !== 'undefined') {
                    addTestResult('SharePointService availability', true, 'SharePointService class found');
                } else {
                    addTestResult('SharePointService availability', false, 'SharePointService not found');
                }

                // Test storage functionality
                if (typeof Storage !== 'undefined') {
                    Storage.set('test', 'value');
                    const retrieved = Storage.get('test');
                    addTestResult('Storage functionality', retrieved === 'value', 'Storage works correctly');
                    Storage.remove('test');
                } else {
                    addTestResult('Storage availability', false, 'Storage class not found');
                }

                // Generate results
                const passed = window.testResults.filter(r => r.passed).length;
                const total = window.testResults.length;
                console.log(\`✅ Browser tests completed: \${passed}/\${total} passed\`);
                
                return { passed, total, results: window.testResults };
                
            } catch (error) {
                console.error('❌ Browser test error:', error);
                addTestResult('Browser test execution', false, error.message);
                return { passed: 0, total: 1, results: window.testResults, error: error.message };
            }
        }

        // Auto-run tests when DOM is ready
        document.addEventListener('DOMContentLoaded', runBrowserTests);
    </script>
</head>
<body>
    <h1>Automated Browser Tests</h1>
    <p>Check console for test results...</p>
    
    <!-- Include required scripts -->
    <script src="js/storage.js"></script>
    <script src="js/sharepoint-mock.js"></script>
    <script src="js/sharepoint-service.js"></script>
</body>
</html>
    `;
}

// Performance tests
function createPerformanceTests() {
    return {
        testMockServicePerformance: async function() {
            console.log('⚡ Testing mock service performance...');
            const iterations = 100;
            const startTime = performance.now();
            
            const mockService = new SharePointMockService();
            
            for (let i = 0; i < iterations; i++) {
                await mockService.getCurrentUser();
                await mockService.isUserAdmin();
                await mockService.getListItems('AdminStaff');
            }
            
            const endTime = performance.now();
            const avgTime = (endTime - startTime) / iterations;
            
            console.log(`✅ Average operation time: ${avgTime.toFixed(2)}ms`);
            return avgTime < 10; // Should complete in under 10ms on average
        },

        testMemoryUsage: function() {
            console.log('🧠 Testing memory usage...');
            if (performance.memory) {
                const used = performance.memory.usedJSHeapSize / 1024 / 1024;
                const total = performance.memory.totalJSHeapSize / 1024 / 1024;
                console.log(`📊 Memory usage: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB`);
                return used < 50; // Should use less than 50MB
            }
            return true; // Can't test in environments without performance.memory
        }
    };
}

// Main execution
if (require.main === module) {
    const automation = new TestAutomation();
    automation.runTests().catch(console.error);
}

module.exports = TestAutomation;