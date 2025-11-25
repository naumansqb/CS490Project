'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Import, CheckCircle2, XCircle } from 'lucide-react';
import { importGoogleContacts, type GoogleContactImport } from '@/lib/contacts.api';

interface GoogleContactsImportProps {
    onImport: () => void;
    onCancel: () => void;
}

export default function GoogleContactsImport({
    onImport,
    onCancel,
}: GoogleContactsImportProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [importResult, setImportResult] = useState<{
        imported: number;
        errors: number;
        contacts: any[];
        errorsList: Array<{ contact: GoogleContactImport; error: string }>;
    } | null>(null);

    const handleManualImport = async () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.csv';
        fileInput.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                setLoading(true);
                setError('');

                const text = await file.text();
                let contacts: GoogleContactImport[] = [];

                if (file.name.endsWith('.json')) {
                    const data = JSON.parse(text);
                    const rawContacts = Array.isArray(data) ? data : data.contacts || [];
                    contacts = rawContacts.map((contact: any) => ({
                        firstName: contact.firstName || contact.first_name || contact.firstname || '',
                        lastName: contact.lastName || contact.last_name || contact.lastname || '',
                        email: contact.email || '',
                        phone: contact.phone || contact.phone_number || '',
                        company: contact.company || contact.organization || contact.organisation || '',
                        jobTitle: contact.jobTitle || contact.job_title || contact.jobtitle || contact.title || '',
                        linkedinUrl: contact.linkedinUrl || contact.linkedin_url || contact.linkedin || '',
                    }));
                } else if (file.name.endsWith('.csv')) {
                    const lines = text.split('\n').filter((line: string) => line.trim());
                    if (lines.length < 2) {
                        setError('CSV file must have a header row and at least one data row');
                        setLoading(false);
                        return;
                    }

                    const parseCSVLine = (line: string): string[] => {
                        const result: string[] = [];
                        let current = '';
                        let inQuotes = false;

                        for (let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if (char === '"') {
                                inQuotes = !inQuotes;
                            } else if (char === ',' && !inQuotes) {
                                result.push(current.trim());
                                current = '';
                            } else {
                                current += char;
                            }
                        }
                        result.push(current.trim());
                        return result;
                    };

                    const headers = parseCSVLine(lines[0]).map((h: string) => h.replace(/^"|"$/g, '').trim().toLowerCase());

                    contacts = lines.slice(1)
                        .filter((line: string) => line.trim())
                        .map((line: string) => {
                            const values = parseCSVLine(line).map((v: string) => v.replace(/^"|"$/g, '').trim());
                            const contact: any = {};
                            headers.forEach((header: string, index: number) => {
                                contact[header] = values[index] || '';
                            });

                            const firstName = contact.firstname || contact['first name'] || contact.first_name || '';
                            const lastName = contact.lastname || contact['last name'] || contact.last_name || '';
                            const fullName = contact.fullname || contact.name || contact['full name'] || contact.full_name || '';

                            let parsedFirstName = firstName;
                            let parsedLastName = lastName;

                            if (fullName && !firstName && !lastName) {
                                const nameParts = fullName.trim().split(/\s+/);
                                parsedFirstName = nameParts[0] || '';
                                parsedLastName = nameParts.slice(1).join(' ') || '';
                            }

                            return {
                                firstName: parsedFirstName,
                                lastName: parsedLastName,
                                email: contact.email || '',
                                phone: contact.phone || contact.phone_number || contact['phone number'] || '',
                                company: contact.company || contact.organization || contact.organisation || '',
                                jobTitle: contact.jobtitle || contact['job title'] || contact.job_title || contact.title || '',
                                linkedinUrl: contact.linkedin || contact.linkedinurl || contact['linkedin url'] || contact.linkedin_url || '',
                            };
                        })
                        .filter((contact: any) => contact.firstName || contact.lastName || contact.email);
                }

                if (contacts.length === 0) {
                    setError('No contacts found in file');
                    return;
                }

                const result = await importGoogleContacts(contacts);
                setImportResult(result);

                if (result.imported > 0) {
                    setTimeout(() => {
                        onImport();
                    }, 2000);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to import contacts');
            } finally {
                setLoading(false);
            }
        };
        fileInput.click();
    };

    return (
        <div className="space-y-6 p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={onCancel}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Import Contacts</h1>
                    <p className="text-muted-foreground mt-1">
                        Import contacts from your Google account
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Import className="h-5 w-5" />
                        Import Contacts from Google
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Export your Google Contacts as a CSV file and upload it here to import them.
                    </p>

                    <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900">How to export from Google Contacts:</p>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Go to <a href="https://contacts.google.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">contacts.google.com</a></li>
                            <li>Click the settings icon (⚙️) in the top right</li>
                            <li>Click "Export"</li>
                            <li>Select "Google CSV" format</li>
                            <li>Click "Export" and download the file</li>
                            <li>Click the button below to upload the file</li>
                        </ol>
                    </div>

                    <Button
                        onClick={handleManualImport}
                        disabled={loading}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                    >
                        <Import className="h-4 w-4 mr-2" />
                        {loading ? 'Importing...' : 'Upload Google Contacts File (CSV)'}
                    </Button>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-2 text-destructive">
                            <XCircle className="h-5 w-5 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold mb-2">Import Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {loading && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <span className="ml-3">Importing contacts...</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {importResult && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="h-5 w-5" />
                            Import Complete
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Imported</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {importResult.imported}
                                </p>
                            </div>
                            {importResult.errors > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Errors</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {importResult.errors}
                                    </p>
                                </div>
                            )}
                        </div>
                        <Button onClick={onImport} className="w-full">
                            View Contacts
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

