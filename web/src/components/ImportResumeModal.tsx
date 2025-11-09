'use client';

import React, { useState } from 'react';
import { X, Upload, Loader2, FileText, Check } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { resumeApi } from '@/lib/resume.api';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ImportResumeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function ImportResumeModal({
    isOpen,
    onClose,
    userId,
}: ImportResumeModalProps) {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelection = (selectedFile: File) => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
        ];

        if (!validTypes.includes(selectedFile.type)) {
            setError('Invalid file type. Please upload a DOCX, DOC, or TXT file.');
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB.');
            return;
        }

        setFile(selectedFile);
        setError(null);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Please select a file to import.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Step 1: Parse the resume file using AI
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai/resume/parse`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to parse resume file');
            }

            const parseResponse = await response.json() as { success: boolean; data: any };

            if (!parseResponse.success || !parseResponse.data) {
                throw new Error('Failed to parse resume file - no data returned');
            }

            const parsedData = parseResponse.data;

            // Step 2: Get Chronological template
            const templates = await resumeApi.getTemplates();
            if (!templates || templates.length === 0) {
                throw new Error('No resume templates available');
            }

            // Find Chronological template (force this template for imports)
            const chronologicalTemplate = templates.find((t: any) => 
                t.type.toLowerCase().includes('chronological') || 
                t.name.toLowerCase().includes('chronological')
            ) || templates.find((t: any) => t.isDefault) || templates[0];

            // Step 3: Create a new resume
            const resumeName = `Imported Resume - ${file.name.replace(/\.[^/.]+$/, '')}`;
            const newResume = await resumeApi.createResume(resumeName, chronologicalTemplate.id);

            // Step 4: Update the resume with parsed content
            await resumeApi.updateResume(newResume.id, {
                content: {
                    personalInfo: parsedData?.personalInfo || {},
                    summary: parsedData?.summary || '',
                    workExperience: parsedData?.workExperience || [],
                    education: parsedData?.education || [],
                    skillsList: parsedData?.skills || [],
                    certifications: parsedData?.certifications || [],
                    projects: parsedData?.projects || [],
                },
            });

            // Step 5: Navigate to the edit page
            router.push(`/dashboard/resumes/${newResume.id}/edit`);
            onClose();
        } catch (err: any) {
            console.error('Failed to import resume:', err);
            setError(err?.message || 'Failed to import resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-500">
                    <div className="flex items-center gap-3">
                        <Upload className="w-6 h-6 text-white" />
                        <div>
                            <h2 className="text-xl font-bold text-white">Import Resume</h2>
                            <p className="text-sm text-white/90">
                                Upload your resume to create a Chronological resume
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* File Upload Area */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            dragActive
                                ? 'border-cyan-500 bg-cyan-50'
                                : 'border-gray-300 hover:border-cyan-400'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-10 h-10 text-cyan-500" />
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">{file.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                    <Check className="w-6 h-6 text-green-500" />
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                                >
                                    Choose different file
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-700 font-medium mb-2">
                                    Drag and drop your resume here
                                </p>
                                <p className="text-sm text-gray-500 mb-4">or</p>
                                <label className="cursor-pointer">
                                    <span className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium inline-block">
                                        Browse Files
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".doc,.docx,.txt"
                                        onChange={handleFileInput}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-4">
                                    Supported: DOCX, DOC, TXT (Max 5MB)
                                </p>
                            </>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <Button onClick={handleClose} variant="outline">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || loading}
                        className="px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Import Resume
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

