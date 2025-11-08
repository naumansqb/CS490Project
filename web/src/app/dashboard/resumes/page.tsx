'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    FileText,
    Edit,
    Trash2,
    Star,
    Loader2,
    ArrowLeft,
    Eye,
    Upload,
    Edit2,
    Check,
    X as XIcon,
} from 'lucide-react';
import { resumeApi } from '@/lib/resume.api';
import { useAuth } from '@/contexts/AuthContext';
import ImportResumeModal from '@/components/ImportResumeModal';

export default function ResumesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [resumes, setResumes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        loadResumes();
    }, []);

    const loadResumes = async () => {
        try {
            const data = await resumeApi.getResumes();
            setResumes(data);
        } catch (error) {
            console.error('Failed to load resumes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        try {
            await resumeApi.setDefaultResume(id);
            loadResumes();
        } catch (error) {
            console.error('Failed to set default:', error);
            alert('Failed to set default resume');
        }
    };

    const handleDelete = async (
        id: string,
        name: string,
        e: React.MouseEvent
    ) => {
        e.stopPropagation(); // Prevent card click
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await resumeApi.deleteResume(id);
            loadResumes();
        } catch (error) {
            console.error('Failed to delete resume:', error);
            alert('Failed to delete resume');
        }
    };

    const startEditing = (resume: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(resume.id);
        setEditingName(resume.name);
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditingName('');
    };

    const saveRename = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editingName.trim()) {
            alert('Resume name cannot be empty');
            return;
        }
        try {
            await resumeApi.updateResume(id, { name: editingName.trim() });
            setEditingId(null);
            setEditingName('');
            loadResumes();
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            successMsg.textContent = '✓ Resume renamed successfully';
            document.body.appendChild(successMsg);
            setTimeout(() => successMsg.remove(), 3000);
        } catch (error) {
            console.error('Failed to rename resume:', error);
            alert('Failed to rename resume');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="bg-white text-black p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-black mb-2">
                            My Resumes
                        </h1>
                        <p className="text-gray-600">
                            Manage your resume versions
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/dashboard"
                            className="px-5 py-2.5 bg-black text-white hover:bg-gray-800 rounded-lg font-medium flex items-center gap-2 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>

                        <button
                            onClick={() => setShowImportModal(true)}
                            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-all shadow-md"
                        >
                            <Upload className="w-5 h-5" />
                            Import Resume
                        </button>

                        <Link
                            href="/dashboard/resumes/new"
                            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-all shadow-md"
                        >
                            <Plus className="w-5 h-5" />
                            New Resume
                        </Link>
                    </div>
                </div>

                {/* Resumes Grid */}
                {resumes.length === 0 ? (
                    <div className="bg-gray-100 border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                        <FileText className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                            No resumes yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Create your first resume to get started
                        </p>
                        <Link
                            href="/dashboard/resumes/new"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-all shadow-md"
                        >
                            <Plus className="w-5 h-5" />
                            Create Resume
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {resumes.map((resume) => (
                            <div
                                key={resume.id}
                                onClick={() =>
                                    router.push(
                                        `/dashboard/resumes/${resume.id}`
                                    )
                                }
                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer hover:border-cyan-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-cyan-500" />
                                        {resume.isDefault && (
                                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                        )}
                                    </div>

                                    {/* set default star */}
                                    <button
                                        onClick={(e) =>
                                            handleSetDefault(resume.id, e)
                                        }
                                        className="text-gray-400 hover:text-yellow-500 transition-colors"
                                        title={
                                            resume.isDefault
                                                ? 'Default resume'
                                                : 'Set as default'
                                        }
                                    >
                                        <Star
                                            className={`w-5 h-5 ${resume.isDefault
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : ''
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Resume Name - Editable */}
                                {editingId === resume.id ? (
                                    <div className="mb-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="flex-1 px-2 py-1 border border-cyan-500 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-semibold"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveRename(resume.id, e as any);
                                                if (e.key === 'Escape') cancelEditing(e as any);
                                            }}
                                        />
                                        <button
                                            onClick={(e) => saveRename(resume.id, e)}
                                            className="p-1 text-green-600 hover:text-green-700 transition-colors"
                                            title="Save"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => cancelEditing(e)}
                                            className="p-1 text-gray-600 hover:text-gray-700 transition-colors"
                                            title="Cancel"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-black flex-1">
                                            {resume.name}
                                        </h3>
                                        <button
                                            onClick={(e) => startEditing(resume, e)}
                                            className="p-1 text-gray-400 hover:text-cyan-600 transition-colors"
                                            title="Rename"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <p className="text-sm text-gray-600 mb-4">
                                    <span className="capitalize">
                                        {resume.template.type.toLowerCase().includes('chrono') ? 'Chronological' :
                                         resume.template.type.toLowerCase().includes('function') ? 'Functional' :
                                         resume.template.type.toLowerCase().includes('hybrid') ? 'Hybrid' :
                                         resume.template.type}
                                    </span>
                                </p>

                                <p className="text-xs text-gray-500 mb-4">
                                    Last modified:{' '}
                                    {new Date(
                                        resume.lastModified
                                    ).toLocaleDateString()}
                                </p>

                                <div className="flex gap-2">
                                    {/* VIEW */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(
                                                `/dashboard/resumes/${resume.id}`
                                            );
                                        }}
                                        className="flex-1 px-4 py-2 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg text-sm font-medium text-cyan-600 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>

                                    {/* EDIT */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(
                                                `/dashboard/resumes/${resume.id}/edit`
                                            );
                                        }}
                                        className="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-600 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>

                                    {/* DELETE */}
                                    <button
                                        onClick={(e) =>
                                            handleDelete(
                                                resume.id,
                                                resume.name,
                                                e
                                            )
                                        }
                                        className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium text-red-600 flex items-center gap-2 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Import Resume Modal */}
            {user && (
                <ImportResumeModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    userId={user.uid}
                />
            )}
        </div>
    );
}