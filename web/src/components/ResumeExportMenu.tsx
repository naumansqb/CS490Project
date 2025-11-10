'use client';

import React, { useState } from 'react';
import { Download, FileText, FileType, Loader2 } from 'lucide-react';

interface ResumeExportMenuProps {
    resumeName: string;
    htmlContent: string;
    className?: string;
}

function generateFilename(resumeName: string, format: string): string {
    const cleanName = resumeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    return `${cleanName}_${timestamp}.${format}`;
}

// Convert list items to visible bullets for PDF export
function convertListsToBullets(element: HTMLElement): void {
    // Find all list items
    const listItems = element.querySelectorAll('li');

    listItems.forEach((li) => {
        const parentList = li.parentElement;
        if (!parentList) return;

        const isOrdered = parentList.tagName === 'OL';
        const currentStyle = window.getComputedStyle(li);
        const listStyleType = currentStyle.listStyleType;

        // Skip if already has text content starting with bullet
        const firstTextNode = li.childNodes[0];
        if (firstTextNode?.textContent?.trim().startsWith('•')) return;

        // Create bullet or number based on list type
        let bulletText = '• ';
        if (isOrdered) {
            const index = Array.from(parentList.children).indexOf(li) + 1;
            bulletText = `${index}. `;
        } else if (listStyleType === 'circle') {
            bulletText = '○ ';
        } else if (listStyleType === 'square') {
            bulletText = '▪ ';
        }

        // Add bullet as text content
        const bulletSpan = document.createElement('span');
        bulletSpan.textContent = bulletText;
        bulletSpan.style.marginRight = '0.5em';
        li.insertBefore(bulletSpan, li.firstChild);

        // Remove list styling
        li.style.listStyleType = 'none';
        li.style.paddingLeft = '0';
    });

    // Reset list padding
    const lists = element.querySelectorAll('ul, ol');
    lists.forEach((list) => {
        if (list instanceof HTMLElement) {
            list.style.listStyleType = 'none';
            list.style.paddingLeft = '0';
        }
    });
}

// Export to PDF using html2canvas-pro and jspdf
async function exportToPDF(htmlContent: string, resumeName: string): Promise<void> {
    const html2canvas = (await import('html2canvas-pro')).default;
    const { jsPDF } = await import('jspdf');

    // Create a temporary div with the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '8.5in';
    tempDiv.style.padding = '0.5in';
    tempDiv.style.background = 'white';
    tempDiv.style.fontSize = '12px';

    // Append to body temporarily (needed for rendering)
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    try {
        // Convert list bullets to text so they show in PDF
        convertListsToBullets(tempDiv);

        // Render the HTML to canvas using html2canvas-pro (supports OKLCH natively)
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Create PDF with letter size (8.5 x 11 inches)
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'in',
            format: 'letter'
        });

        // Calculate dimensions
        const imgWidth = 8.5;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageHeight = 11;

        let heightLeft = imgHeight;
        let position = 0;

        // Add image to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add new pages if content is longer than one page
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Save the PDF
        pdf.save(generateFilename(resumeName, 'pdf'));
    } finally {
        // Clean up the temporary div
        document.body.removeChild(tempDiv);
    }
}

function exportToWord(htmlContent: string, filename: string, resumeName: string): void {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const flexDivs = tempDiv.querySelectorAll('div[style*="display: flex"], div[style*="display:flex"]');
    flexDivs.forEach(flexDiv => {
        const style = flexDiv.getAttribute('style') || '';
        if (style.includes('space-between') || style.includes('justify-content')) {
            const children = Array.from(flexDiv.children);
            if (children.length === 2) {
                const table = document.createElement('table');
                table.setAttribute('style', 'width:100%;border-collapse:collapse;margin-bottom:16px;border:0');

                const tr = document.createElement('tr');
                const td1 = document.createElement('td');
                td1.setAttribute('style', 'width:50%;text-align:left;vertical-align:top;padding:0;border:0');
                td1.innerHTML = children[0].innerHTML;

                const td2 = document.createElement('td');
                td2.setAttribute('style', 'width:50%;text-align:right;vertical-align:top;padding:0;border:0');
                td2.innerHTML = children[1].innerHTML;

                tr.appendChild(td1);
                tr.appendChild(td2);
                table.appendChild(tr);

                flexDiv.parentNode?.replaceChild(table, flexDiv);
            }
        }
    });

    const wordHTML = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head><meta charset='utf-8'><title>${resumeName}</title>
<style>body{margin:0.5in;padding:0}table{border:none !important}td{border:none !important;padding:0}</style>
</head><body>${tempDiv.innerHTML}</body></html>`;

    const blob = new Blob(['\ufeff', wordHTML], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportToHTML(htmlContent: string, filename: string, resumeName: string): void {
    const fullHTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${resumeName}</title>
<style>body{max-width:8.5in;margin:0 auto;padding:0.5in;background:white}</style>
</head><body>${htmlContent}</body></html>`;

    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export default function ResumeExportMenu({
    resumeName,
    htmlContent,
    className = '',
}: ResumeExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExport = async (format: 'pdf' | 'docx' | 'html') => {
        try {
            setExporting(true);

            switch (format) {
                case 'pdf':
                    await exportToPDF(htmlContent, resumeName);
                    break;
                case 'docx':
                    exportToWord(htmlContent, generateFilename(resumeName, 'doc'), resumeName);
                    break;
                case 'html':
                    exportToHTML(htmlContent, generateFilename(resumeName, 'html'), resumeName);
                    break;
            }

            setTimeout(() => {
                setIsOpen(false);
                setExporting(false);
            }, 500);
        } catch (error: any) {
            console.error('Export failed:', error);
            alert(error?.message || 'Export failed. Please try again.');
            setExporting(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium shadow-md transition-all disabled:opacity-50"
            >
                {exporting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exporting...
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4" />
                        Export
                    </>
                )}
            </button>

            {isOpen && !exporting && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                        <div className="p-2">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                                Export Format
                            </div>

                            <button
                                onClick={() => handleExport('pdf')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="font-medium">PDF Document</span>
                            </button>

                            <button
                                onClick={() => handleExport('docx')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                            >
                                <FileType className="w-4 h-4" />
                                <span className="font-medium">Word Document</span>
                            </button>

                            <button
                                onClick={() => handleExport('html')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-md transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="font-medium">HTML File</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
