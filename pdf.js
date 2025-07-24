// PDF Export Functionality
class PDFExporter {
    static exportSubmission(submission) {
        try {
            console.log('Starting PDF export for submission:', submission);
            
            // Check if jsPDF is available with multiple possible locations
            let jsPDF;
            if (window.jsPDF) {
                jsPDF = window.jsPDF.jsPDF || window.jsPDF;
            } else if (window.jspdf) {
                jsPDF = window.jspdf.jsPDF || window.jspdf;
            }
            
            if (!jsPDF) {
                console.error('jsPDF library not found. Available:', {
                    jsPDF: typeof window.jsPDF,
                    jspdf: typeof window.jspdf
                });
                if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                    window.UIManager.showToast('PDF Library Error', 'PDF generation library is not available. Please refresh the page.', 'error');
                }
                return;
            }
            
            console.log('jsPDF found, creating document...');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            let yPosition = 30;

            // Header
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('YSOD Digital Acknowledgment Form Hub', pageWidth / 2, yPosition, {
                align: 'center'
            });

            yPosition += 20;

            // Submission details title
            doc.setFontSize(16);
            doc.text('Acknowledgment Submission', pageWidth / 2, yPosition, {
                align: 'center'
            });

            yPosition += 20;

            // Submission details
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');

            const details = [
                `Type: ${submission.type}`,
                `Request No: ${submission.requestNo}`,
                `Employee Name: ${submission.employeeName}`,
                `Date: ${submission.date}`,
                `Status: ${submission.acknowledged ? 'Acknowledged' : 'Not Acknowledged'}`
            ];

            details.forEach(detail => {
                doc.text(detail, margin, yPosition);
                yPosition += 15;
            });

            // Find the acknowledgment type details
            const types = window.AcknowledgmentData.getAcknowledgmentTypes();
            const ackType = types.find(type => type.title === submission.type);

            if (ackType?.content) {
                yPosition += 15;
                doc.setFont('helvetica', 'bold');
                doc.text('Content:', margin, yPosition);
                yPosition += 15;
                doc.setFont('helvetica', 'normal');

                // Add Arabic content if available
                if (ackType.content.arabic) {
                    yPosition += 10;
                    doc.setFont('helvetica', 'bold');
                    doc.text('Arabic Title:', margin, yPosition);
                    yPosition += 10;
                    doc.setFont('helvetica', 'normal');
                    doc.text(ackType.content.arabic, margin, yPosition);
                    yPosition += 15;
                }

                // Add description
                if (ackType.content.description) {
                    const lines = doc.splitTextToSize(ackType.content.description, pageWidth - (margin * 2));

                    // Check if we need a new page
                    if (yPosition + (lines.length * 8) > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }

                    doc.text(lines, margin, yPosition);
                    yPosition += lines.length * 8 + 10;
                }

                // Add rules/sections
                if (ackType.content.rules && ackType.content.rules.length > 0) {
                    yPosition += 10;

                    // Check if we need a new page
                    if (yPosition > pageHeight - 100) {
                        doc.addPage();
                        yPosition = margin;
                    }

                    doc.setFont('helvetica', 'bold');
                    doc.text('Rules/Sections:', margin, yPosition);
                    yPosition += 15;
                    doc.setFont('helvetica', 'normal');

                    ackType.content.rules.forEach((rule, index) => {
                        const ruleText = `${index + 1}. ${rule}`;
                        const lines = doc.splitTextToSize(ruleText, pageWidth - (margin * 2));

                        // Check if we need a new page
                        if (yPosition + (lines.length * 8) > pageHeight - margin) {
                            doc.addPage();
                            yPosition = margin;
                        }

                        doc.text(lines, margin, yPosition);
                        yPosition += lines.length * 8 + 5;
                    });
                }
            }

            // Footer
            yPosition += 30;

            // Check if we need a new page for footer
            if (yPosition > pageHeight - 50) {
                doc.addPage();
                yPosition = margin;
            }

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);

            // Digital signature note
            yPosition += 15;
            doc.setFont('helvetica', 'normal');
            doc.text('This document has been digitally generated and recorded in the system.', margin, yPosition);

            // Save the PDF
            const filename = `acknowledgment_${submission.requestNo.replace('/', '_')}.pdf`;
            doc.save(filename);

            if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                window.UIManager.showToast('PDF Exported', 'Acknowledgment has been exported successfully.', 'success');
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                window.UIManager.showToast('Export Error', 'Failed to export PDF. Please try again.', 'error');
            }
        }
    }

    static exportAllSubmissions() {
        try {
            const submissions = Storage.getSubmissions();

            if (submissions.length === 0) {
                if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                    window.UIManager.showToast('No Data', 'No submissions found to export.', 'error');
                }
                return;
            }

            // Check if jsPDF is available with multiple possible locations
            let jsPDF;
            if (window.jsPDF) {
                jsPDF = window.jsPDF.jsPDF || window.jsPDF;
            } else if (window.jspdf) {
                jsPDF = window.jspdf.jsPDF || window.jspdf;
            }
            
            if (!jsPDF) {
                if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                    window.UIManager.showToast('PDF Library Error', 'PDF generation library is not available.', 'error');
                }
                return;
            }
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            let yPosition = 30;

            // Header
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('YSOD Digital Acknowledgment Summary Report', pageWidth / 2, yPosition, {
                align: 'center'
            });

            yPosition += 20;

            // Summary info
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Submissions: ${submissions.length}`, margin, yPosition);
            yPosition += 10;
            doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
            yPosition += 20;

            // Table headers
            doc.setFont('helvetica', 'bold');
            doc.text('Request No', margin, yPosition);
            doc.text('Employee Name', margin + 60, yPosition);
            doc.text('Type', margin + 120, yPosition);
            doc.text('Date', margin + 160, yPosition);
            yPosition += 15;

            // Draw line under headers
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
            yPosition += 5;

            // Submissions data
            doc.setFont('helvetica', 'normal');
            submissions.forEach(submission => {
                // Check if we need a new page
                if (yPosition > pageHeight - 30) {
                    doc.addPage();
                    yPosition = margin;
                }

                doc.text(submission.requestNo, margin, yPosition);
                doc.text(submission.employeeName, margin + 60, yPosition);
                doc.text(submission.type.substring(0, 25) + (submission.type.length > 25 ? '...' : ''), margin + 120, yPosition);
                doc.text(submission.date, margin + 160, yPosition);
                yPosition += 12;
            });

            // Save the PDF
            const filename = `acknowledgment_summary_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);

            if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                window.UIManager.showToast('Summary Exported', 'Summary report has been exported successfully.', 'success');
            }

        } catch (error) {
            console.error('Error generating summary PDF:', error);
            if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                window.UIManager.showToast('Export Error', 'Failed to export summary. Please try again.', 'error');
            }
        }
    }

    // Utility method to handle Arabic text (basic support)
    static formatArabicText(text, doc, maxWidth) {
        // For better Arabic support, you might want to use a library like jsPDF-arabic
        // For now, we'll just split the text normally
        return doc.splitTextToSize(text, maxWidth);
    }

    // Method to add page numbers
    static addPageNumbers(doc) {
        const pageCount = doc.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        }
    }

    // Method to check if PDF generation is supported
    static isSupported() {
        return !!(window.jsPDF || window.jspdf);
    }
}

// Make PDFExporter available globally
window.PDFExporter = PDFExporter; 