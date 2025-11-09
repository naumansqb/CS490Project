'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileText, Check, ZoomIn } from 'lucide-react';
import { resumeApi, ResumeTemplate } from '@/lib/resume.api';

export default function NewResumePage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [resumeName, setResumeName] = useState('');
    const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const data = await resumeApi.getTemplates();
            setTemplates(data);
            const defaultTemplate = data.find((t) => t.isDefault);
            if (defaultTemplate) {
                setSelectedTemplateId(defaultTemplate.id);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
            alert('Failed to load templates. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!selectedTemplateId) {
            alert('Please select a template');
            return;
        }

        if (!resumeName.trim()) {
            alert('Please enter a resume name');
            return;
        }

        setCreating(true);
        try {
            const newResume = await resumeApi.createResume(
                resumeName.trim(),
                selectedTemplateId
            );
            router.push(`/dashboard/resumes/${newResume.id}/edit`);
        } catch (error: any) {
            console.error('Failed to create resume:', error);
            alert(
                error?.message || 'Failed to create resume. Please try again.'
            );
        } finally {
            setCreating(false);
        }
    };

    const getSimpleTypeName = (type: string): string => {
        const lower = type.toLowerCase();
        if (lower.includes('chrono')) return 'Chronological';
        if (lower.includes('function')) return 'Functional';
        if (lower.includes('hybrid')) return 'Hybrid';
        return type;
    };

    const getSimpleDisplayName = (name: string): string => {
        const lower = name.toLowerCase();
        if (lower.includes('chrono')) return 'Chronological';
        if (lower.includes('function')) return 'Functional';
        if (lower.includes('hybrid')) return 'Hybrid';
        return name;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <>
            <div className="bg-white text-black p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href="/dashboard/resumes"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Resumes
                        </Link>

                        <div>
                            <h1 className="text-3xl font-bold text-black mb-2">
                                Create New Resume
                            </h1>
                            <p className="text-gray-600">
                                Choose a template and give your resume a name
                            </p>
                        </div>
                    </div>

                    {/* Resume Name Input */}
                    <div className="mb-8">
                        <label
                            htmlFor="resumeName"
                            className="block text-sm font-semibold text-black mb-2"
                        >
                            Resume Name *
                        </label>
                        <input
                            id="resumeName"
                            type="text"
                            value={resumeName}
                            onChange={(e) => setResumeName(e.target.value)}
                            placeholder="e.g., Software Engineer Resume"
                            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                    </div>

                    {/* Template Selection */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-black mb-4">
                            Select Template *
                        </h2>

                        {templates.length === 0 ? (
                            <div className="bg-gray-100 border border-gray-200 rounded-xl p-8 text-center">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600">
                                    No templates available
                                </p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-6">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() =>
                                            setSelectedTemplateId(template.id)
                                        }
                                        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${selectedTemplateId === template.id
                                            ? 'border-cyan-500 bg-cyan-50'
                                            : 'border-gray-200 bg-white hover:border-cyan-300'
                                            }`}
                                    >
                                        {selectedTemplateId === template.id && (
                                            <div className="absolute top-3 right-3 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center z-10">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        <div className="relative mb-4 bg-gray-100 rounded-lg overflow-hidden aspect-[8.5/11] group">
                                            {template.preview ? (
                                                <img
                                                    src={template.preview}
                                                    alt={getSimpleDisplayName(template.name)}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileText className="w-12 h-12 text-gray-400" />
                                                </div>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewTemplate(template);
                                                }}
                                                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                                                title="Click to preview"
                                            >
                                                <ZoomIn className="w-4 h-4 text-gray-800" />
                                            </button>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-black mb-1">
                                                {getSimpleDisplayName(template.name)}
                                                {template.isDefault && (
                                                    <span className="ml-2 text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </h3>
                                            {template.description && (
                                                <p className="text-sm text-gray-600">
                                                    {template.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-2">
                                                {getSimpleTypeName(template.type)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Create Button */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleCreate}
                            disabled={
                                creating ||
                                !selectedTemplateId ||
                                !resumeName.trim()
                            }
                            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    Create Resume
                                </>
                            )}
                        </button>

                        <Link
                            href="/dashboard/resumes"
                            className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-black rounded-lg font-medium transition-all"
                        >
                            Cancel
                        </Link>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewTemplate && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setPreviewTemplate(null)}
                >
                    <div
                        className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewTemplate(null)}
                            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-800" />
                        </button>

                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-black mb-2">
                                {getSimpleDisplayName(previewTemplate.name)}
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                {previewTemplate.description}
                            </p>

                            <div className="bg-gray-100 rounded-lg overflow-auto max-h-[calc(90vh-200px)]">
                                {previewTemplate.preview ? (
                                    <img
                                        src={previewTemplate.preview}
                                        alt={getSimpleDisplayName(previewTemplate.name)}
                                        className="w-full h-auto"
                                    />
                                ) : (
                                    <div className="w-full h-96 flex items-center justify-center">
                                        <FileText className="w-24 h-24 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedTemplateId(previewTemplate.id);
                                        setPreviewTemplate(null);
                                    }}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all shadow-md"
                                >
                                    Select This Template
                                </button>
                                <button
                                    onClick={() => setPreviewTemplate(null)}
                                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-black rounded-lg font-medium transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}