// Simple PDF Export Test
function testSimplePDF() {
    console.log('Testing simple PDF export...');
    
    try {
        // Check what's available
        console.log('window.jsPDF:', typeof window.jsPDF, window.jsPDF);
        
        // Try to create a simple PDF
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text('Test PDF Export', 20, 20);
        doc.text('If you can see this, jsPDF is working!', 20, 40);
        doc.text('Date: ' + new Date().toLocaleString(), 20, 60);
        
        doc.save('simple-test.pdf');
        console.log('Simple PDF export successful!');
        return true;
        
    } catch (error) {
        console.error('Simple PDF export failed:', error);
        return false;
    }
}

// Export a submission with minimal code
function exportSubmissionSimple(submission) {
    console.log('Exporting submission (simple):', submission);
    
    try {
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        // Simple content
        doc.setFontSize(16);
        doc.text('YSOD Acknowledgment Export', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Type: ${submission.type || 'N/A'}`, 20, 40);
        doc.text(`Request No: ${submission.requestNo || 'N/A'}`, 20, 55);
        doc.text(`Employee: ${submission.employeeName || 'N/A'}`, 20, 70);
        doc.text(`Date: ${submission.date || 'N/A'}`, 20, 85);
        doc.text(`Status: ${submission.acknowledged ? 'Acknowledged' : 'Not Acknowledged'}`, 20, 100);
        
        // Save with simple filename
        const filename = `ack_${Date.now()}.pdf`;
        doc.save(filename);
        
        console.log('Simple submission export successful!');
        return true;
        
    } catch (error) {
        console.error('Simple submission export failed:', error);
        return false;
    }
}

// Make functions globally available
window.testSimplePDF = testSimplePDF;
window.exportSubmissionSimple = exportSubmissionSimple;