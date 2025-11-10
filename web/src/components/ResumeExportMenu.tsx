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

// Export to PDF using browser's print dialog
function exportToPDF(htmlContent: string, resumeName: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) throw new Error('Popup blocked. Please allow popups to export as PDF.');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${resumeName}</title>
<style>@page{size:letter;margin:0.5in}body{margin:0.5in;padding:0;background:white}section{page-break-inside:avoid}</style>
</head><body>${htmlContent}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
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

    const handleExport = (format: 'pdf' | 'docx' | 'html') => {
        try {
            setExporting(true);

            switch (format) {
                case 'pdf':
                    exportToPDF(htmlContent, resumeName);
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