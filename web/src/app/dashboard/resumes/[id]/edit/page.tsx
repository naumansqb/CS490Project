'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Save,
    Bold,
    Italic,
    List,
    Type,
    Sparkles,
} from 'lucide-react';
import { resumeApi, ResumeDetail } from '@/lib/resume.api';
import { useAuth } from '@/contexts/AuthContext';
import AIResumeGenerationModal from '@/components/AIResumeGenerationModal';
import { TailoredResumeContent } from '@/lib/ai.api';
import ResumeSectionCustomizer, { ResumeSection } from '@/components/ResumeSectionCustomizer';

// Default section configuration
const DEFAULT_SECTIONS: ResumeSection[] = [
    { id: 'personalInfo', name: 'personalInfo', label: 'Contact Information', enabled: true, order: 1, required: true },
    { id: 'summary', name: 'summary', label: 'Professional Summary', enabled: true, order: 2 },
    { id: 'workExperience', name: 'workExperience', label: 'Work Experience', enabled: true, order: 3 },
    { id: 'education', name: 'education', label: 'Education', enabled: true, order: 4 },
    { id: 'skills', name: 'skills', label: 'Skills', enabled: true, order: 5 },
    { id: 'certifications', name: 'certifications', label: 'Certifications', enabled: true, order: 6 },
    { id: 'projects', name: 'projects', label: 'Projects', enabled: true, order: 7 },
];

export default function EditResumePage() {
    const router = useRouter();
    const params = useParams();
    const resumeId = params?.id as string | undefined;
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resume, setResume] = useState<ResumeDetail | null>(null);
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [showAIModal, setShowAIModal] = useState(false);
    const [sections, setSections] = useState<ResumeSection[]>(DEFAULT_SECTIONS);

    const editorRef = useRef<HTMLDivElement>(null);

    // Generate HTML string from resume data (respecting section configuration)
    const generateHTML = (resumeData: any, sectionConfig?: ResumeSection[]): string => {
        const content = resumeData.content || {};
        const personalInfo = content.personalInfo || {};
        const templateType = (resumeData.template?.type || '').toLowerCase();
        const activeSections = sectionConfig || sections;

        // If already has saved HTML and we're not regenerating, use that
        if (content.htmlContent && !sectionConfig) {
            return content.htmlContent;
        }

        // Helper to check if section is enabled
        const isSectionEnabled = (sectionName: string) => {
            const section = activeSections.find(s => s.name === sectionName);
            return section ? section.enabled : true;
        };

        // Get section order
        const getSectionOrder = (sectionName: string) => {
            const section = activeSections.find(s => s.name === sectionName);
            return section ? section.order : 999;
        };

        // Generate individual section HTML blocks
        const sectionBlocks: { order: number; html: string; name: string }[] = [];

        // Otherwise generate HTML string
        const nameBlock = `
            <div style="text-align: center; margin-bottom: 8px;">
                <h1 style="font-size: 18pt; font-weight: bold; margin: 0;">
                    ${personalInfo.fullName || 'YOUR NAME'}
                </h1>
            </div>
        `;

        const twoColumnContacts = `
            <div style="display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 16px; border-bottom: 1px solid #000; padding-bottom: 4px;">
                <div style="text-align: left;">
                    <div>${personalInfo.location || 'City, State'}</div>
                    <div>${personalInfo.phone || 'Phone Number'}</div>
                </div>
                <div style="text-align: right;">
                    <div>${personalInfo.email || 'email@example.com'}</div>
                    <div>${personalInfo.linkedin || 'LinkedIn URL'}</div>
                </div>
            </div>
        `;

        const singleLineContacts = `
            <div style="text-align: center; font-size: 10pt; margin-bottom: 16px; border-bottom: 1px solid #000; padding-bottom: 6px;">
                ${personalInfo.phone || 'Phone'} | ${personalInfo.email || 'Email'} | ${personalInfo.location || 'City, State'} | ${personalInfo.portfolio || 'Portfolio'}
            </div>
        `;

        // Summary section (skip for hybrid template)
        if (isSectionEnabled('summary') && content.summary && !templateType.includes('hybrid')) {
            sectionBlocks.push({
                order: getSectionOrder('summary'),
                name: 'summary',
                html: `
                    <section style="margin-bottom: 16px;">
                        <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                            SUMMARY OF QUALIFICATIONS
                        </div>
                        <div style="font-size: 12pt; white-space: pre-line;">
                            ${content.summary}
                        </div>
                    </section>
                `
            });
        }

        // Work Experience section
        if (isSectionEnabled('workExperience') && Array.isArray(content.workExperience) && content.workExperience.length > 0) {
            // Removed formatting feature - using defaults('workExperience');
            sectionBlocks.push({
                order: getSectionOrder('workExperience'),
                name: 'workExperience',
                html: `
                    <section style="margin-bottom: 16px;">
                        <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                            ${templateType.includes('hybrid') ? 'EXPERIENCE' : 'PROFESSIONAL EXPERIENCE'}
                        </div>
                        ${content.workExperience.map((job: any) => `
                            <div style="margin-bottom: 12px;">
                                <div style="font-size: 12pt; font-weight: 600;">
                                    ${job.title}${job.company ? `, ${job.company}` : ''}${job.location ? `, ${job.location}` : ''}
                                </div>
                                <div style="font-size: 11pt; font-style: italic;">
                                    ${job.startDate} – ${job.endDate}
                                </div>
                                ${Array.isArray(job.bullets) && job.bullets.length > 0 ? `
                                    <ul style="font-size: 12pt; padding-left: 20px; margin: 4px 0 0 0;">
                                        ${job.bullets.map((b: string) => `<li style="margin-bottom: 2px;">${b}</li>`).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        `).join('')}
                    </section>
                `
            });
        }

        // Education section
        if (isSectionEnabled('education') && Array.isArray(content.education) && content.education.length > 0) {
            // Removed formatting feature - using defaults('education');
            sectionBlocks.push({
                order: getSectionOrder('education'),
                name: 'education',
                html: `
                    <section style="margin-bottom: 16px;">
                        <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                            EDUCATION
                        </div>
                        ${content.education.map((edu: any) => `
                            <div style="font-size: 12pt; margin-bottom: 8px;">
                                <div style="font-weight: 600;">
                                    ${edu.degree || edu.degreeType}${edu.fieldOfStudy || edu.major ? `, ${edu.fieldOfStudy || edu.major}` : ''}
                                </div>
                                <div>${edu.institution || edu.school || edu.institutionName}</div>
                                ${edu.graduationDate ? `<div style="font-size: 11pt;">Graduated: ${edu.graduationDate}</div>` : ''}
                            </div>
                        `).join('')}
                    </section>
                `
            });
        }

        // Certifications section
        if (isSectionEnabled('certifications') && Array.isArray(content.certifications) && content.certifications.length > 0) {
            // Removed formatting feature - using defaults('certifications');
            sectionBlocks.push({
                order: getSectionOrder('certifications'),
                name: 'certifications',
                html: `
                    <section style="margin-bottom: 16px;">
                        <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                            CERTIFICATIONS
                        </div>
                        ${content.certifications.map((cert: any) => `
                            <div style="font-size: 12pt; margin-bottom: 6px;">
                                <div style="font-weight: 600;">${cert.name}</div>
                                <div style="font-size: 11pt;">${cert.organization}${cert.date ? ` | ${cert.date}` : ''}</div>
                            </div>
                        `).join('')}
                    </section>
                `
            });
        }

        // Projects section
        if (isSectionEnabled('projects') && Array.isArray(content.projects) && content.projects.length > 0) {
            // Removed formatting feature - using defaults('projects');
            sectionBlocks.push({
                order: getSectionOrder('projects'),
                name: 'projects',
                html: `
                    <section style="margin-bottom: 16px;">
                        <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                            PROJECTS
                        </div>
                        ${content.projects.map((proj: any) => `
                            <div style="margin-bottom: 10px;">
                                <div style="font-size: 12pt; font-weight: 600;">${proj.name}</div>
                                <div style="font-size: 12pt; margin-top: 2px;">${proj.description}</div>
                                ${proj.technologies && proj.technologies.length > 0 ? `
                                    <div style="font-size: 11pt; font-style: italic; margin-top: 2px;">
                                        Technologies: ${proj.technologies.join(', ')}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </section>
                `
            });
        }

        // Skills section for Functional template
        if (templateType.includes('functional') && isSectionEnabled('skills')) {
            // Removed formatting feature - using defaults('skills');
            const skillsToRender = content.skillsWithDescriptions
                ? [
                    ...(content.skillsWithDescriptions.relevant || []),
                    ...(content.skillsWithDescriptions.technical || []),
                    ...(content.skillsWithDescriptions.soft || [])
                ]
                : Array.isArray(content.skills) && content.skills.length > 0 ? content.skills : [
                    { category: 'Skill Area #1', items: ['Add accomplishments...'] },
                    { category: 'Skill Area #2', items: ['Add accomplishments...'] }
                ];

            sectionBlocks.push({
                order: getSectionOrder('skills'),
                name: 'skills',
                html: `
                    <section style="margin-bottom: 16px;">
                        <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                            PROFESSIONAL EXPERIENCE
                        </div>
                        ${skillsToRender.map((skill: any) => `
                            <div style="margin-bottom: 10px;">
                                <div style="font-size: 12pt; font-weight: 600;">
                                    ${skill.name || skill.category || 'Skill Area'}
                                </div>
                                ${skill.description ? `
                                    <div style="font-size: 12pt; margin-top: 4px;">
                                        ${skill.description}
                                    </div>
                                ` : ''}
                                ${skill.items ? `
                                    <ul style="font-size: 12pt; padding-left: 20px; margin: 4px 0;">
                                        ${(skill.items || []).map((item: string) => `<li>${item}</li>`).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        `).join('')}
                    </section>
                `
            });
        }

        // Skills section for Hybrid template
        if (templateType.includes('hybrid') && isSectionEnabled('skills')) {
            // Removed formatting feature - using defaults('skills');
            const skillsToRender = content.skillsWithDescriptions
                ? [
                    ...(content.skillsWithDescriptions.relevant || []),
                    ...(content.skillsWithDescriptions.technical || []),
                    ...(content.skillsWithDescriptions.soft || [])
                ]
                : Array.isArray(content.skills) && content.skills.length > 0 ? content.skills : [
                    { category: 'Skill', items: ['Description...'] }
                ];

            sectionBlocks.push({
                order: getSectionOrder('skills'),
                name: 'skills',
                html: `
                    <section style="margin-bottom: 16px;">
                        <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                            SKILLS SUMMARY
                        </div>
                        ${skillsToRender.map((s: any) => `
                            <div style="margin-bottom: 10px;">
                                <div style="font-size: 12pt; font-weight: 600;">
                                    ${s.name || s.category || 'Skill'}
                                </div>
                                ${s.description ? `
                                    <div style="font-size: 12pt; margin-top: 4px;">
                                        ${s.description}
                                    </div>
                                ` : ''}
                                ${s.items || s.bullets ? `
                                    <ul style="font-size: 12pt; padding-left: 20px; margin: 4px 0;">
                                        ${(s.items || s.bullets || []).map((item: string) => `<li>${item}</li>`).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        `).join('')}
                    </section>
                `
            });
        }

        // Skills section for Chronological template
        if (templateType.includes('chronological') && isSectionEnabled('skills') && Array.isArray(content.skillsList) && content.skillsList.length > 0) {
            // Removed formatting feature - using defaults('skills');
            sectionBlocks.push({
                order: getSectionOrder('skills'),
                name: 'skills',
                html: `
                    <section style="margin-bottom: 16px;">
                        <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                            SKILLS
                        </div>
                        <div style="font-size: 12pt;">
                            ${content.skillsList.join(' • ')}
                        </div>
                    </section>
                `
            });
        }

        // Sort section blocks by order and concatenate
        const sortedBlocks = sectionBlocks.sort((a, b) => a.order - b.order);
        const sectionsHTML = sortedBlocks.map(block => block.html).join('');

        // Determine contact layout based on template
        const contactsBlock = templateType.includes('hybrid') ? singleLineContacts : twoColumnContacts;

        // Assemble final HTML
        return nameBlock + contactsBlock + sectionsHTML;
    };

    useEffect(() => {
        if (!resumeId) {
            setError('No resume ID provided');
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await resumeApi.getResume(resumeId);
                setResume(data);

                // Load section configuration if exists, otherwise use defaults based on template
                let sectionsToUse = DEFAULT_SECTIONS;
                const savedSections = data.content?.sectionConfig;
                if (savedSections && Array.isArray(savedSections)) {
                    sectionsToUse = savedSections;
                    setSections(savedSections);
                } else {
                    // Set default sections based on template type
                    const templateType = (data.template?.type || '').toLowerCase();
                    if (templateType.includes('hybrid')) {
                        // For Hybrid, disable summary by default
                        const hybridSections = DEFAULT_SECTIONS.map(s =>
                            s.name === 'summary' ? { ...s, enabled: false } : s
                        );
                        sectionsToUse = hybridSections;
                        setSections(hybridSections);
                    }
                }

                // Generate HTML once
                const html = generateHTML(data, sectionsToUse);
                setHtmlContent(html);
            } catch (err: any) {
                console.error('Failed to load resume:', err);
                setError(err?.message || 'Could not load this resume.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [resumeId]);

    const handleSave = async () => {
        if (!resumeId || !editorRef.current) return;

        setSaving(true);
        setError(null);

        try {
            const currentHTML = editorRef.current.innerHTML;

            await resumeApi.updateResume(resumeId, {
                content: {
                    ...resume?.content,
                    htmlContent: currentHTML,
                    sectionConfig: sections, // Save section configuration
                },
            });

            // Update the htmlContent state so subsequent edits work correctly
            setHtmlContent(currentHTML);

            const successMsg = document.createElement('div');
            successMsg.className =
                'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            successMsg.textContent = '✓ Resume saved successfully';
            document.body.appendChild(successMsg);
            setTimeout(() => successMsg.remove(), 3000);
        } catch (err) {
            console.error('Failed to save resume', err);
            setError('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Handle section configuration changes with real-time preview
    const handleSectionsChange = (newSections: ResumeSection[]) => {
        setSections(newSections);

        // Regenerate HTML with new section configuration
        if (resume) {
            const newResumeData = {
                ...resume,
                content: {
                    ...resume.content,
                    htmlContent: undefined, // Force regeneration
                    sectionConfig: newSections,
                }
            };
            const newHTML = generateHTML(newResumeData, newSections);
            setHtmlContent(newHTML);

            // Update the editor
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.innerHTML = newHTML;
                }
            }, 50);
        }
    };


    // Handle applying AI-generated content with user selection
    const handleApplyAIContent = (content: TailoredResumeContent, selectedSections: any) => {
        if (!editorRef.current || !resume) return;

        const templateType = (resume.template?.type || '').toLowerCase();
        const isHybrid = templateType.includes('hybrid');

        // Build updated content based on user selections
        const updatedContent: any = {
            ...resume.content,
        };

        // Only apply summary if selected (and not Hybrid template)
        if (selectedSections.summary && !isHybrid) {
            updatedContent.summary = content.summary;
        }

        // Only apply work experience if selected
        if (selectedSections.workExperience) {
            updatedContent.workExperience = content.workExperiences.map(exp => {
                // Handle date formatting safely
                let formattedStartDate = exp.startDate;
                let formattedEndDate = exp.endDate || 'Present';

                try {
                    if (exp.startDate && exp.startDate !== 'Present') {
                        const startDateObj = new Date(exp.startDate);
                        if (!isNaN(startDateObj.getTime())) {
                            formattedStartDate = startDateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        }
                    }

                    if (exp.endDate && exp.endDate !== 'Present') {
                        const endDateObj = new Date(exp.endDate);
                        if (!isNaN(endDateObj.getTime())) {
                            formattedEndDate = endDateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        }
                    }
                } catch (e) {
                    console.error('Date formatting error:', e);
                }

                return {
                    title: exp.positionTitle,
                    company: exp.companyName,
                    location: '',
                    startDate: formattedStartDate,
                    endDate: formattedEndDate,
                    bullets: exp.bulletPoints,
                };
            });
        }

        // Only apply education if selected
        if (selectedSections.education && content.education && content.education.length > 0) {
            updatedContent.education = content.education.map(edu => {
                let formattedGradDate = '';

                try {
                    if (edu.graduationDate) {
                        const gradDateObj = new Date(edu.graduationDate);
                        if (!isNaN(gradDateObj.getTime())) {
                            formattedGradDate = gradDateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        }
                    }
                } catch (e) {
                    console.error('Graduation date formatting error:', e);
                }

                return {
                    degree: edu.degreeType,
                    major: edu.major,
                    school: edu.institutionName,
                    graduationDate: formattedGradDate,
                };
            });
        }

        // Only apply skills if selected
        if (selectedSections.skills) {
            updatedContent.skillsList = [
                ...content.skills.relevant.map(s => s.name || s),
                ...content.skills.technical.map(s => s.name || s),
                ...content.skills.soft.map(s => s.name || s),
            ];
            updatedContent.skillsWithDescriptions = content.skills;
        } else {
            // Explicitly remove skills if unchecked
            updatedContent.skillsList = [];
            updatedContent.skillsWithDescriptions = null;
        }

        // Only apply certifications if selected
        if (selectedSections.certifications && content.certifications && content.certifications.length > 0) {
            updatedContent.certifications = content.certifications.map(cert => {
                let formattedDate = cert.date;

                // Format date if it's an ISO string
                try {
                    if (cert.date && cert.date.includes('T')) {
                        const dateObj = new Date(cert.date);
                        if (!isNaN(dateObj.getTime())) {
                            formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        }
                    }
                } catch (e) {
                    console.error('Certification date formatting error:', e);
                }

                return {
                    name: cert.name,
                    organization: cert.organization,
                    date: formattedDate,
                };
            });
        } else if (!selectedSections.certifications) {
            // Explicitly remove certifications if unchecked
            updatedContent.certifications = [];
        }

        // Only apply projects if selected
        if (selectedSections.projects && content.projects && content.projects.length > 0) {
            updatedContent.projects = content.projects.map(proj => ({
                name: proj.name,
                description: proj.description,
                technologies: proj.technologies || [],
            }));
        } else if (!selectedSections.projects) {
            // Explicitly remove projects if unchecked
            updatedContent.projects = [];
        }

        // Create new resume object without htmlContent so generateHTML creates fresh HTML
        const newResumeData = {
            ...resume,
            content: {
                ...updatedContent,
                htmlContent: undefined, // Force regeneration
            }
        };

        // Regenerate HTML with new content
        const newHTML = generateHTML(newResumeData);

        // Force update the state
        setResume(newResumeData);
        setHtmlContent(newHTML);

        // Use setTimeout to ensure state update completes before DOM manipulation
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.innerHTML = newHTML;
            }
        }, 100);

        // Show success message with count
        const appliedCount = Object.values(selectedSections).filter(v => v).length;
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMsg.innerHTML = `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span>Applied ${appliedCount} section(s)! Don't forget to save.</span>`;
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 4000);
    };

    // Simple formatting functions - no React interference
    const formatBold = () => document.execCommand('bold', false);
    const formatItalic = () => document.execCommand('italic', false);
    const formatBulletList = () => document.execCommand('insertUnorderedList', false);
    const formatColor = (color: string) => document.execCommand('foreColor', false, color);

    const formatFont = (font: string) => {
        // Get current selection to preserve color
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return;

        // Get the current color of selected text
        const tempSpan = document.createElement('span');
        try {
            const fragment = range.cloneContents();
            tempSpan.appendChild(fragment);
            const firstElement = tempSpan.querySelector('*') || tempSpan;
            const currentColor = window.getComputedStyle(firstElement).color;

            // Apply font
            document.execCommand('fontName', false, font);

            // Reapply color if it was set
            if (currentColor && currentColor !== 'rgb(0, 0, 0)') {
                setTimeout(() => {
                    document.execCommand('foreColor', false, currentColor);
                }, 10);
            }
        } catch (e) {
            // Fallback to just applying font
            document.execCommand('fontName', false, font);
        }
    };

    const formatFontSize = (size: string) => {
        document.execCommand('fontSize', false, '7');
        setTimeout(() => {
            if (!editorRef.current) return;
            const fontTags = editorRef.current.querySelectorAll('font[size="7"]');
            fontTags.forEach(tag => {
                const span = document.createElement('span');
                span.style.fontSize = `${size}pt`;
                span.innerHTML = tag.innerHTML;
                tag.parentNode?.replaceChild(span, tag);
            });
        }, 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    if (error || !resume) {
        return (
            <div className="bg-white p-8">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => router.push('/dashboard/resumes')} className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Resumes
                    </button>
                    <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                            <div className="font-semibold">Failed to load resume</div>
                            <div className="text-sm mt-1">{error || 'Resume not found'}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white text-black min-h-screen">
                <div className="max-w-full mx-auto">
                    {/* Header */}
                    <div className="border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
                        <div className="px-6 py-4 flex items-center justify-between">
                            <button onClick={() => router.push('/dashboard/resumes')} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Resumes
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowAIModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium shadow-md transition-all"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    AI Tailor
                                </button>
                                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white rounded-lg font-medium shadow-md transition-all">
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex">
                        {/* Section Customizer Sidebar */}
                        <div className="w-[400px] border-r border-gray-200 bg-gray-50 overflow-y-auto" style={{ height: 'calc(100vh - 73px)' }}>
                            <div className="p-4">
                                <ResumeSectionCustomizer
                                    sections={sections}
                                    onSectionsChange={handleSectionsChange}
                                />
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 73px)' }}>
                            <div className="p-6">
                                {/* Toolbar */}
                                <div className="bg-white border border-gray-300 rounded-lg p-3 mb-6 flex flex-wrap gap-3 items-center shadow-sm">
                                    <button onClick={formatBold} className="p-2 hover:bg-gray-100 rounded border transition-colors" title="Bold">
                                        <Bold className="w-4 h-4" />
                                    </button>
                                    <button onClick={formatItalic} className="p-2 hover:bg-gray-100 rounded border transition-colors" title="Italic">
                                        <Italic className="w-4 h-4" />
                                    </button>
                                    <button onClick={formatBulletList} className="p-2 hover:bg-gray-100 rounded border transition-colors" title="Bullet List">
                                        <List className="w-4 h-4" />
                                    </button>

                                    <div className="w-px h-6 bg-gray-300" />

                                    <div className="flex items-center gap-2">
                                        <Type className="w-4 h-4 text-gray-600" />
                                        <select onChange={(e) => formatFont(e.target.value)} className="px-2 py-1 border rounded text-sm hover:border-gray-400 transition-colors">
                                            <option value="Inter">Inter</option>
                                            <option value="Arial">Arial</option>
                                            <option value="Times New Roman">Times New Roman</option>
                                            <option value="Georgia">Georgia</option>
                                        </select>
                                    </div>

                                    <select onChange={(e) => formatFontSize(e.target.value)} className="px-2 py-1 border rounded text-sm hover:border-gray-400 transition-colors">
                                        <option value="10">10pt</option>
                                        <option value="12">12pt</option>
                                        <option value="14">14pt</option>
                                        <option value="16">16pt</option>
                                        <option value="18">18pt</option>
                                    </select>

                                    <input type="color" onChange={(e) => formatColor(e.target.value)} className="w-8 h-8 cursor-pointer rounded" title="Text Color" />

                                    <span className="text-xs text-gray-500 ml-auto">Select text then format</span>
                                </div>

                                {/* Resume Preview/Editor */}
                                <div className="bg-gray-100 p-8 rounded-xl">
                                    <style>{`
                                        .resume-editor { color: #000000; }
                                        .resume-editor ul { list-style-type: disc !important; list-style-position: outside !important; padding-left: 20px !important; }
                                        .resume-editor li { display: list-item !important; margin-bottom: 2px !important; }
                                    `}</style>
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        className="resume-editor w-full max-w-[8.5in] min-h-[11in] mx-auto bg-white border border-gray-300 shadow-lg p-8 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow"
                                        style={{ lineHeight: '1.4' }}
                                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Resume Generation Modal */}
            {user && resume && (
                <AIResumeGenerationModal
                    isOpen={showAIModal}
                    onClose={() => setShowAIModal(false)}
                    resumeId={resumeId || ''}
                    userId={user.uid}
                    resumeTemplate={resume.template?.type || 'chronological'}
                    currentResumeContent={resume.content}
                    onApplyContent={handleApplyAIContent}
                />
            )}
        </>
    );
}