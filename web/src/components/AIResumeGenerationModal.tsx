'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, Check, Loader2, Briefcase, Lightbulb } from 'lucide-react';
import { TailoredResumeContent } from '@/lib/ai.api';
import { getJobOpportunitiesByUserId } from '@/lib/jobs.api';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface AIResumeGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    resumeId: string;
    userId: string;
    resumeTemplate: string;
    currentResumeContent?: any;
    onApplyContent: (content: TailoredResumeContent, selectedSections: SelectedSections) => void;
}

interface SelectedSections {
    summary: boolean;
    workExperience: boolean;
    skills: boolean;
    certifications: boolean;
    projects: boolean;
    education: boolean;
}

interface Job {
    id: string;
    title: string;
    company: string;
    location?: string;
    description?: string;
}

export default function AIResumeGenerationModal({
    isOpen,
    onClose,
    resumeId,
    userId,
    resumeTemplate,
    currentResumeContent,
    onApplyContent,
}: AIResumeGenerationModalProps) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [generatedContent, setGeneratedContent] = useState<TailoredResumeContent | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'feedback'>('content');

    // Section selection state (what to apply)
    const [selectedSections, setSelectedSections] = useState<SelectedSections>({
        summary: true,
        workExperience: true,
        skills: true,
        certifications: true,
        projects: true,
        education: false, // Usually keep existing education
    });

    const isHybrid = resumeTemplate.toLowerCase().includes('hybrid');
    const isFunctional = resumeTemplate.toLowerCase().includes('functional');
    const canRegenerateSummary = !isHybrid; // Chronological and Functional can regenerate summary

    // Individual skill selection after generation
    const [selectedGeneratedSkills, setSelectedGeneratedSkills] = useState<{
        relevant: string[];
        technical: string[];
        soft: string[];
    }>({
        relevant: [],
        technical: [],
        soft: [],
    });

    useEffect(() => {
        if (isOpen) {
            loadJobs();
        }
    }, [isOpen, userId]);

    const loadJobs = async () => {
        try {
            setLoadingJobs(true);
            const jobsData = await getJobOpportunitiesByUserId(userId);
            setJobs(jobsData as Job[]);
        } catch (err) {
            console.error('Failed to load jobs:', err);
            setError('Failed to load your job opportunities');
        } finally {
            setLoadingJobs(false);
        }
    };


    const toggleSection = (section: keyof SelectedSections) => {
        setSelectedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const toggleGeneratedSkill = (category: 'relevant' | 'technical' | 'soft', skillName: string) => {
        setSelectedGeneratedSkills(prev => {
            const categorySkills = prev[category];
            const isSelected = categorySkills.includes(skillName);

            return {
                ...prev,
                [category]: isSelected
                    ? categorySkills.filter(s => s !== skillName)
                    : [...categorySkills, skillName],
            };
        });
    };

    const handleGenerate = async () => {
        if (!selectedJobId) {
            setError('Please select a job opportunity');
            return;
        }

        // Check job description quality
        const selectedJob = jobs.find(j => j.id === selectedJobId);
        const hasGoodDescription = selectedJob?.description && selectedJob.description.length > 50;

        try {
            setLoading(true);
            setError(null);
            setWarning(null);

            // Call API with current resume content
            const response = await apiClient.fetch<{ success: boolean; data: TailoredResumeContent }>(
                `/ai/resume/${resumeId}/tailor-to-job`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        jobId: selectedJobId,
                        userId,
                        currentResumeContent,
                    }),
                }
            );

            setGeneratedContent(response.data);
            setActiveTab('content');

            // Reset section selections to all true by default
            setSelectedSections({
                summary: !isHybrid, // Hybrid doesn't have separate summary section
                workExperience: true,
                skills: true,
                certifications: !!(response.data.certifications && response.data.certifications.length > 0),
                projects: !!(response.data.projects && response.data.projects.length > 0),
                education: false,
            });

            // Initialize all generated skills as selected
            setSelectedGeneratedSkills({
                relevant: response.data.skills.relevant.map(s => s.name),
                technical: response.data.skills.technical.map(s => s.name),
                soft: response.data.skills.soft.map(s => s.name),
            });

            // Show warning if job description is poor
            if (!hasGoodDescription) {
                setWarning('Will fix current resume but your job description needs to be improved for better accuracy.');
            }
        } catch (err: any) {
            console.error('Failed to generate tailored resume:', err);
            setError(err?.message || 'Failed to generate tailored resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateBullets = async (expIndex: number) => {
        if (!generatedContent) return;

        setLoading(true);
        try {
            const response = await apiClient.fetch<{ success: boolean; data: TailoredResumeContent }>(
                `/ai/resume/${resumeId}/tailor-to-job`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        jobId: selectedJobId,
                        userId,
                        currentResumeContent,
                    }),
                }
            );

            const updatedContent = { ...generatedContent };
            updatedContent.workExperiences[expIndex] = response.data.workExperiences[expIndex];
            setGeneratedContent(updatedContent);
        } catch (err) {
            console.error('Failed to regenerate:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateSummary = async () => {
        if (!generatedContent) return;

        setLoading(true);
        try {
            const response = await apiClient.fetch<{ success: boolean; data: TailoredResumeContent }>(
                `/ai/resume/${resumeId}/tailor-to-job`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        jobId: selectedJobId,
                        userId,
                        currentResumeContent,
                    }),
                }
            );

            const updatedContent = { ...generatedContent };
            updatedContent.summary = response.data.summary;
            setGeneratedContent(updatedContent);
        } catch (err) {
            console.error('Failed to regenerate summary:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (generatedContent) {
            // Filter skills based on user selection
            const filteredContent = {
                ...generatedContent,
                skills: {
                    relevant: generatedContent.skills.relevant.filter(s => selectedGeneratedSkills.relevant.includes(s.name)),
                    technical: generatedContent.skills.technical.filter(s => selectedGeneratedSkills.technical.includes(s.name)),
                    soft: generatedContent.skills.soft.filter(s => selectedGeneratedSkills.soft.includes(s.name)),
                },
            };

            onApplyContent(filteredContent, selectedSections);
            onClose();
        }
    };

    const handleRegenerate = () => {
        setGeneratedContent(null);
        setActiveTab('content');
        setWarning(null);
    };

    const handleClose = () => {
        setGeneratedContent(null);
        setSelectedJobId('');
        setError(null);
        setWarning(null);
        setActiveTab('content');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col my-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-500">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-white" />
                        <div>
                            <h2 className="text-xl font-bold text-white">AI Resume Tailoring</h2>
                            <p className="text-sm text-white/90">
                                {generatedContent ? 'Select what to add to your resume' : 'Generate ATS-optimized content'}
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
                <div className="flex-1 overflow-y-auto p-6">
                    {!generatedContent ? (
                        // Job Selection & Configuration View
                        <div className="space-y-6">
                            {/* Job Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    1. Select Job Opportunity
                                </label>
                                {loadingJobs ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                                        <span className="ml-2 text-gray-600">Loading jobs...</span>
                                    </div>
                                ) : jobs.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Briefcase className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                        <p>No job opportunities found.</p>
                                        <p className="text-sm mt-1">Add some jobs first to use AI tailoring.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2">
                                        {jobs.map((job) => (
                                            <button
                                                key={job.id}
                                                onClick={() => setSelectedJobId(job.id)}
                                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedJobId === job.id
                                                    ? 'border-cyan-500 bg-cyan-50'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                                                        <p className="text-sm text-gray-600">{job.company}</p>
                                                        {job.location && (
                                                            <p className="text-xs text-gray-500 mt-1">{job.location}</p>
                                                        )}
                                                    </div>
                                                    {selectedJobId === job.id && (
                                                        <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>


                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Generated Content View with Selection Checkboxes
                        <div className="space-y-4">
                            {/* Job Info */}
                            {generatedContent.jobInfo && (
                                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200">
                                    <div className="flex items-center gap-2 text-cyan-700 font-medium mb-1">
                                        <Briefcase className="w-4 h-4" />
                                        Tailored for:
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">{generatedContent.jobInfo.title}</span> at{' '}
                                        {generatedContent.jobInfo.company}
                                    </p>
                                    {generatedContent.templateInfo && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            Template: {generatedContent.templateInfo.name || generatedContent.templateInfo.type}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Warning Message */}
                            {warning && (
                                <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800 text-sm">
                                    ⚠️ {warning}
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex gap-2 border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('content')}
                                    className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'content'
                                        ? 'text-cyan-600 border-b-2 border-cyan-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Generated Content
                                </button>
                                <button
                                    onClick={() => setActiveTab('feedback')}
                                    className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'feedback'
                                        ? 'text-cyan-600 border-b-2 border-cyan-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Lightbulb className="w-4 h-4" />
                                    AI Feedback
                                </button>
                            </div>

                            {activeTab === 'feedback' && generatedContent.feedback && (
                                <div className="space-y-4">
                                    {/* Strengths */}
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="text-green-700 font-semibold mb-3">
                                            Strengths
                                        </div>
                                        <ul className="list-disc list-inside space-y-2">
                                            {generatedContent.feedback.strengths.map((item, idx) => (
                                                <li key={idx} className="text-sm text-green-800">{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Improvements */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="text-red-700 font-semibold mb-3">
                                            Improvements That Can Be Made
                                        </div>
                                        <ul className="list-disc list-inside space-y-2">
                                            {generatedContent.feedback.improvements.map((item, idx) => (
                                                <li key={idx} className="text-sm text-red-800">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'content' && (
                                <div className="space-y-4">
                                    {/* Summary - Hide for Hybrid */}
                                    {!isHybrid && (
                                        <div className="border-2 rounded-lg p-4 transition-all" style={{
                                            borderColor: selectedSections.summary ? '#06b6d4' : '#e5e7eb',
                                            backgroundColor: selectedSections.summary ? '#ecfeff' : '#f9fafb'
                                        }}>
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSections.summary}
                                                    onChange={() => toggleSection('summary')}
                                                    className="mt-1 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            Professional Summary
                                                        </h3>
                                                        {canRegenerateSummary && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={handleRegenerateSummary}
                                                                disabled={loading}
                                                                className="text-xs"
                                                            >
                                                                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                                                                Regenerate
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="bg-white p-3 rounded border border-gray-200">
                                                        <p className="text-gray-700 text-sm leading-relaxed">{generatedContent.summary}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Work Experience - Hide for Functional */}
                                    {!isFunctional && (
                                        <div className="border-2 rounded-lg p-4 transition-all" style={{
                                            borderColor: selectedSections.workExperience ? '#06b6d4' : '#e5e7eb',
                                            backgroundColor: selectedSections.workExperience ? '#ecfeff' : '#f9fafb'
                                        }}>
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSections.workExperience}
                                                    onChange={() => toggleSection('workExperience')}
                                                    className="mt-1 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                        Tailored Work Experience
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {generatedContent.workExperiences.map((exp, idx) => {
                                                            // Find relevance score for this experience
                                                            const relevanceData = generatedContent.matchScore?.experienceRelevance?.find(
                                                                (rel) => rel.positionTitle === exp.positionTitle && rel.companyName === exp.companyName
                                                            );
                                                            const relevanceScore = relevanceData?.relevanceScore || 0;

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="bg-white p-3 rounded border border-gray-200"
                                                                >
                                                                    <div className="flex items-start justify-between mb-2">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="font-semibold text-gray-900 text-sm">{exp.positionTitle}</p>
                                                                                {/* Relevance Score Badge */}
                                                                                {relevanceScore > 0 && (
                                                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${relevanceScore >= 80 ? 'bg-green-100 text-green-700' :
                                                                                        relevanceScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                                                            'bg-orange-100 text-orange-700'
                                                                                        }`}>
                                                                                        {Math.round(relevanceScore)}% relevant
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs text-gray-600">{exp.companyName}</p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {exp.startDate} - {exp.endDate || 'Present'}
                                                                            </p>
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleRegenerateBullets(idx)}
                                                                            disabled={loading}
                                                                            className="text-xs"
                                                                        >
                                                                            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                                                                            Regenerate
                                                                        </Button>
                                                                    </div>
                                                                    <ul className="list-disc list-inside space-y-1">
                                                                        {exp.bulletPoints.map((point, pointIdx) => (
                                                                            <li key={pointIdx} className="text-xs text-gray-700">
                                                                                {point}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    )}

                                    {/* Skills - With Individual Selection */}
                                    <div className="border-2 rounded-lg p-4 transition-all" style={{
                                        borderColor: selectedSections.skills ? '#06b6d4' : '#e5e7eb',
                                        backgroundColor: selectedSections.skills ? '#ecfeff' : '#f9fafb'
                                    }}>
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedSections.skills}
                                                onChange={() => toggleSection('skills')}
                                                className="mt-1 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                                            />
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    Highlighted Skills
                                                    <span className="text-sm font-normal text-gray-600 ml-2">
                                                        (Check individual skills to include)
                                                    </span>
                                                </h3>
                                                <div className="space-y-3 bg-white p-3 rounded border border-gray-200">
                                                    {/* Relevant Skills */}
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-700 mb-2">Most Relevant for This Job</p>
                                                        <div className="space-y-1">
                                                            {generatedContent.skills.relevant.map((skill, idx) => (
                                                                <label
                                                                    key={idx}
                                                                    className="flex items-start gap-2 p-2 hover:bg-cyan-50 rounded cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedGeneratedSkills.relevant.includes(skill.name)}
                                                                        onChange={() => toggleGeneratedSkill('relevant', skill.name)}
                                                                        disabled={!selectedSections.skills}
                                                                        className="mt-1 w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="font-semibold text-sm text-cyan-900">{skill.name}</div>
                                                                            {skill.matchesJob && (
                                                                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">
                                                                                    ✓ Matches Job
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {skill.description && (
                                                                            <div className="text-xs text-cyan-700 mt-1">{skill.description}</div>
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Technical Skills */}
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-700 mb-2">Technical Skills</p>
                                                        <div className="space-y-1">
                                                            {generatedContent.skills.technical.map((skill, idx) => (
                                                                <label
                                                                    key={idx}
                                                                    className="flex items-start gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedGeneratedSkills.technical.includes(skill.name)}
                                                                        onChange={() => toggleGeneratedSkill('technical', skill.name)}
                                                                        disabled={!selectedSections.skills}
                                                                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="font-semibold text-sm text-blue-900">{skill.name}</div>
                                                                            {skill.matchesJob && (
                                                                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">
                                                                                    ✓ Matches Job
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {skill.description && (
                                                                            <div className="text-xs text-blue-700 mt-1">{skill.description}</div>
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Soft Skills */}
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-700 mb-2">Soft Skills</p>
                                                        <div className="space-y-1">
                                                            {generatedContent.skills.soft.map((skill, idx) => (
                                                                <label
                                                                    key={idx}
                                                                    className="flex items-start gap-2 p-2 hover:bg-green-50 rounded cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedGeneratedSkills.soft.includes(skill.name)}
                                                                        onChange={() => toggleGeneratedSkill('soft', skill.name)}
                                                                        disabled={!selectedSections.skills}
                                                                        className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="font-semibold text-sm text-green-900">{skill.name}</div>
                                                                            {skill.matchesJob && (
                                                                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">
                                                                                    ✓ Matches Job
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {skill.description && (
                                                                            <div className="text-xs text-green-700 mt-1">{skill.description}</div>
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Certifications */}
                                    {generatedContent.certifications && generatedContent.certifications.length > 0 && (
                                        <div className="border-2 rounded-lg p-4 transition-all" style={{
                                            borderColor: selectedSections.certifications ? '#06b6d4' : '#e5e7eb',
                                            backgroundColor: selectedSections.certifications ? '#ecfeff' : '#f9fafb'
                                        }}>
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSections.certifications}
                                                    onChange={() => toggleSection('certifications')}
                                                    className="mt-1 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Relevant Certifications</h3>
                                                    <div className="bg-white p-3 rounded border border-gray-200">
                                                        <ul className="space-y-2">
                                                            {generatedContent.certifications.map((cert, idx) => (
                                                                <li key={idx} className="text-sm text-gray-700">
                                                                    <span className="font-semibold">{cert.name}</span> - {cert.organization} ({cert.date})
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    )}

                                    {/* Projects */}
                                    {generatedContent.projects && generatedContent.projects.length > 0 && (
                                        <div className="border-2 rounded-lg p-4 transition-all" style={{
                                            borderColor: selectedSections.projects ? '#06b6d4' : '#e5e7eb',
                                            backgroundColor: selectedSections.projects ? '#ecfeff' : '#f9fafb'
                                        }}>
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSections.projects}
                                                    onChange={() => toggleSection('projects')}
                                                    className="mt-1 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Relevant Projects</h3>
                                                    <div className="space-y-3">
                                                        {generatedContent.projects.map((proj, idx) => (
                                                            <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                                                                <p className="font-semibold text-gray-900 text-sm">{proj.name}</p>
                                                                <p className="text-xs text-gray-700 mt-1">{proj.description}</p>
                                                                {proj.technologies && proj.technologies.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                                        {proj.technologies.map((tech, techIdx) => (
                                                                            <span
                                                                                key={techIdx}
                                                                                className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded"
                                                                            >
                                                                                {tech}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <Button
                            onClick={handleClose}
                            variant="outline"
                            className="px-4 py-2"
                        >
                            Cancel
                        </Button>

                        <div className="flex gap-2">
                            {!generatedContent ? (
                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading || !selectedJobId}
                                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate AI Content
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleRegenerate}
                                        variant="outline"
                                        className="px-4 py-2"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Try Another Job
                                    </Button>
                                    <Button
                                        onClick={handleApply}
                                        disabled={!Object.values(selectedSections).some(v => v)}
                                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Apply Selected to Resume
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {generatedContent && (
                        <div className="mt-3 text-xs text-center text-gray-600">
                            {Object.values(selectedSections).filter(v => v).length} of {Object.keys(selectedSections).length} sections selected
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
