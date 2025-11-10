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
import ResumeExportMenu from '@/components/ResumeExportMenu';

// Helper: Format date strings consistently
function formatDate(dateString: string): string {
    if (!dateString || dateString === 'Present') return dateString;

    try {
        const dateObj = new Date(dateString);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
    } catch (e) {
        console.error('Date formatting error:', e);
    }

    return dateString;
}

// Helper: Show success message toast
function showSuccessMessage(message: string) {
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successMsg.textContent = message;
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
}

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

    const editorRef = useRef<HTMLDivElement>(null);

    // Generate HTML string from resume data
    const generateHTML = (resumeData: any): string => {
        const content = resumeData.content || {};
        const personalInfo = content.personalInfo || {};
        const templateType = (resumeData.template?.type || '').toLowerCase();

        // If already has saved HTML, use that
        if (content.htmlContent) {
            return content.htmlContent;
        }

        // Otherwise generate HTML string with Inter font
        const nameBlock = `
            <div style="text-align: center; margin-bottom: 8px; font-family: Inter, Arial, sans-serif;">
                <h1 style="font-size: 16pt; font-weight: bold; margin: 0; font-family: Inter, Arial, sans-serif;">
                    ${personalInfo.fullName || 'YOUR NAME'}
                </h1>
            </div>
        `;

        const twoColumnContacts = `
            <div style="display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 16px; border-bottom: 1px solid #000; padding-bottom: 4px; font-family: Inter, Arial, sans-serif;">
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
            <div style="text-align: center; font-size: 10pt; margin-bottom: 16px; border-bottom: 1px solid #000; padding-bottom: 6px; font-family: Inter, Arial, sans-serif;">
                ${personalInfo.phone || 'Phone'} | ${personalInfo.email || 'Email'} | ${personalInfo.location || 'City, State'} | ${personalInfo.portfolio || 'Portfolio'}
            </div>
        `;

        const summarySection = content.summary ? `
            <section style="margin-bottom: 16px; font-family: Inter, Arial, sans-serif;">
                <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                    SUMMARY OF QUALIFICATIONS
                </div>
                <div style="font-size: 10pt; white-space: pre-line;">
                    ${content.summary}
                </div>
            </section>
        ` : '';

        const workExperience = Array.isArray(content.workExperience) && content.workExperience.length > 0 ? `
            <section style="margin-bottom: 16px; font-family: Inter, Arial, sans-serif;">
                <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                    ${templateType.includes('hybrid') ? 'EXPERIENCE' : 'PROFESSIONAL EXPERIENCE'}
                </div>
                ${content.workExperience.map((job: any) => `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 10pt; font-weight: 600;">
                            ${job.title}${job.company ? `, ${job.company}` : ''}${job.location ? `, ${job.location}` : ''}
                        </div>
                        <div style="font-size: 10pt; font-style: italic;">
                            ${job.startDate} – ${job.endDate}
                        </div>
                        ${Array.isArray(job.bullets) && job.bullets.length > 0 ? `
                            <ul style="font-size: 10pt; padding-left: 20px; margin: 4px 0 0 0;">
                                ${job.bullets.map((b: string) => `<li style="margin-bottom: 2px;">${b}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
            </section>
        ` : '';

        const education = Array.isArray(content.education) && content.education.length > 0 ? `
            <section style="margin-bottom: 16px; font-family: Inter, Arial, sans-serif;">
                <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                    EDUCATION
                </div>
                ${content.education.map((edu: any) => `
                    <div style="font-size: 10pt; margin-bottom: 8px;">
                        <div style="font-weight: 600;">
                            ${edu.degree || edu.degreeType}${edu.fieldOfStudy || edu.major ? `, ${edu.fieldOfStudy || edu.major}` : ''}
                        </div>
                        <div>${edu.institution || edu.school || edu.institutionName}</div>
                        ${edu.graduationDate ? `<div style="font-size: 10pt;">Graduated: ${edu.graduationDate}</div>` : ''}
                    </div>
                `).join('')}
            </section>
        ` : '';

        // Certifications section
        const certifications = Array.isArray(content.certifications) && content.certifications.length > 0 ? `
            <section style="margin-bottom: 16px; font-family: Inter, Arial, sans-serif;">
                <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                    CERTIFICATIONS
                </div>
                ${content.certifications.map((cert: any) => `
                    <div style="font-size: 10pt; margin-bottom: 6px;">
                        <div style="font-weight: 600;">${cert.name}</div>
                        <div style="font-size: 10pt;">${cert.organization}${cert.date ? ` | ${cert.date}` : ''}</div>
                    </div>
                `).join('')}
            </section>
        ` : '';

        // Projects section
        const projects = Array.isArray(content.projects) && content.projects.length > 0 ? `
            <section style="margin-bottom: 16px; font-family: Inter, Arial, sans-serif;">
                <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                    PROJECTS
                </div>
                ${content.projects.map((proj: any) => `
                    <div style="margin-bottom: 10px;">
                        <div style="font-size: 10pt; font-weight: 600;">${proj.name}</div>
                        <div style="font-size: 10pt; margin-top: 2px;">${proj.description}</div>
                        ${proj.technologies && proj.technologies.length > 0 ? `
                            <div style="font-size: 10pt; font-style: italic; margin-top: 2px;">
                                Technologies: ${proj.technologies.join(', ')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </section>
        ` : '';

        // Functional template
        if (templateType.includes('functional')) {
            // Use skillsWithDescriptions if available (from AI), otherwise use old format
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

            const skillsSection = `
                <section style="margin-bottom: 16px; font-family: Inter, Arial, sans-serif;">
                    <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                        PROFESSIONAL EXPERIENCE
                    </div>
                    ${skillsToRender.map((skill: any) => `
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 10pt; font-weight: 600;">
                                ${skill.name || skill.category || 'Skill Area'}
                            </div>
                            ${skill.description ? `
                                <div style="font-size: 10pt; margin-top: 4px;">
                                    ${skill.description}
                                </div>
                            ` : ''}
                            ${skill.items ? `
                                <ul style="font-size: 10pt; padding-left: 20px; margin: 4px 0;">
                                    ${(skill.items || []).map((item: string) => `<li>${item}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </section>
            `;

            // Employment History section for Functional template (brief)
            const employmentHistory = Array.isArray(content.workExperience) && content.workExperience.length > 0 ? `
                <section style="margin-bottom: 16px; font-family: Inter, Arial, sans-serif;">
                    <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                        EMPLOYMENT HISTORY
                    </div>
                    ${content.workExperience.map((job: any) => `
                        <div style="margin-bottom: 8px; font-size: 10pt;">
                            <div style="font-weight: 600;">
                                ${job.title}${job.company ? `, ${job.company}` : ''}
                            </div>
                            <div style="font-size: 10pt; font-style: italic;">
                                ${job.startDate} – ${job.endDate}
                            </div>
                        </div>
                    `).join('')}
                </section>
            ` : '';

            return nameBlock + twoColumnContacts + summarySection + skillsSection + employmentHistory + education + certifications + projects;
        }

        // Hybrid template
        if (templateType.includes('hybrid')) {
            // Use skillsWithDescriptions if available (from AI), otherwise use old format
            const skillsToRender = content.skillsWithDescriptions
                ? [
                    ...(content.skillsWithDescriptions.relevant || []),
                    ...(content.skillsWithDescriptions.technical || []),
                    ...(content.skillsWithDescriptions.soft || [])
                ]
                : Array.isArray(content.skills) && content.skills.length > 0 ? content.skills : [
                    { category: 'Skill', items: ['Description...'] }
                ];

            const skillsSection = `
                <section style="margin-bottom: 16px; font-family: Inter, Arial, sans-serif;">
                    <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                        SKILLS SUMMARY
                    </div>
                    ${skillsToRender.map((s: any) => `
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 10pt; font-weight: 600;">
                                ${s.name || s.category || 'Skill'}
                            </div>
                            ${s.description ? `
                                <div style="font-size: 10pt; margin-top: 4px;">
                                    ${s.description}
                                </div>
                            ` : ''}
                            ${s.items || s.bullets ? `
                                <ul style="font-size: 10pt; padding-left: 20px; margin: 4px 0;">
                                    ${(s.items || s.bullets || []).map((item: string) => `<li>${item}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </section>
            `;

            return nameBlock + singleLineContacts + skillsSection + workExperience + education + certifications + projects;
        }

        // Skills section for Chronological template
        const skillsSection = Array.isArray(content.skillsList) && content.skillsList.length > 0 ? `
            <section style="margin-bottom: 16px; font-family: Inter, Arial, sans-serif;">
                <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                    SKILLS
                </div>
                <div style="font-size: 10pt;">
                    ${content.skillsList.join(' • ')}
                </div>
            </section>
        ` : '';

        // Chronological (default)
        return nameBlock + twoColumnContacts + summarySection + workExperience + education + skillsSection + certifications + projects;
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

                // Generate HTML once
                const html = generateHTML(data);
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
                },
            });

            // Update the htmlContent state so subsequent edits work correctly
            setHtmlContent(currentHTML);
            showSuccessMessage('✓ Resume saved successfully');
        } catch (err) {
            console.error('Failed to save resume', err);
            setError('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
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
            updatedContent.workExperience = content.workExperiences.map(exp => ({
                title: exp.positionTitle,
                company: exp.companyName,
                location: '',
                startDate: formatDate(exp.startDate),
                endDate: exp.endDate === 'Present' ? 'Present' : formatDate(exp.endDate || 'Present'),
                bullets: exp.bulletPoints,
            }));
        }

        // Only apply education if selected
        if (selectedSections.education && content.education && content.education.length > 0) {
            updatedContent.education = content.education.map(edu => ({
                degree: edu.degreeType,
                major: edu.major,
                school: edu.institutionName,
                graduationDate: formatDate(edu.graduationDate || ''),
            }));
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
            updatedContent.certifications = content.certifications.map(cert => ({
                name: cert.name,
                organization: cert.organization,
                date: formatDate(cert.date || ''),
            }));
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
        showSuccessMessage(`Applied ${appliedCount} section(s)! Don't forget to save.`);
    };

    // Simple formatting functions - no React interference
    const formatBold = () => document.execCommand('bold', false);
    const formatItalic = () => document.execCommand('italic', false);
    const formatBulletList = () => document.execCommand('insertUnorderedList', false);
    const formatColor = (color: string) => document.execCommand('foreColor', false, color);

    const formatFont = (font: string) => {
        document.execCommand('fontName', false, font);
    };

    const formatFontSize = (size: string) => {
        document.execCommand('fontSize', false, '7');
        setTimeout(() => {
            if (!editorRef.current) return;
            const fontTags = editorRef.current.querySelectorAll('font[size="7"]');
            fontTags.forEach(tag => {
                const span = document.createElement('span');
                span.style.fontSize = `${size}pt`;

                // Preserve existing styles (especially color)
                const computedStyle = window.getComputedStyle(tag);
                if (computedStyle.color && computedStyle.color !== 'rgb(0, 0, 0)') {
                    span.style.color = computedStyle.color;
                }
                if (computedStyle.fontFamily) {
                    span.style.fontFamily = computedStyle.fontFamily;
                }
                if (computedStyle.fontWeight && computedStyle.fontWeight !== '400') {
                    span.style.fontWeight = computedStyle.fontWeight;
                }
                if (computedStyle.fontStyle && computedStyle.fontStyle !== 'normal') {
                    span.style.fontStyle = computedStyle.fontStyle;
                }

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
            <div className="bg-white text-black p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => router.push('/dashboard/resumes')} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <div className="flex gap-3">
                            <ResumeExportMenu
                                resumeName={resume?.name || 'Resume'}
                                htmlContent={htmlContent}
                            />
                            <button
                                onClick={() => setShowAIModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium shadow-md transition-all"
                            >
                                <Sparkles className="w-4 h-4" />
                                AI Tailor
                            </button>
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium">
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save</>}
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-white border border-gray-300 rounded-lg p-3 mb-4 flex flex-wrap gap-3 items-center">
                        <button onClick={formatBold} className="p-2 hover:bg-gray-100 rounded border"><Bold className="w-4 h-4" /></button>
                        <button onClick={formatItalic} className="p-2 hover:bg-gray-100 rounded border"><Italic className="w-4 h-4" /></button>
                        <button onClick={formatBulletList} className="p-2 hover:bg-gray-100 rounded border"><List className="w-4 h-4" /></button>

                        <div className="w-px h-6 bg-gray-300" />

                        <div className="flex items-center gap-2">
                            <Type className="w-4 h-4" />
                            <select onChange={(e) => formatFont(e.target.value)} className="px-2 py-1 border rounded text-sm">
                                <option value="Inter">Inter</option>
                                <option value="Arial">Arial</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Georgia">Georgia</option>
                            </select>
                        </div>

                        <select onChange={(e) => formatFontSize(e.target.value)} className="px-2 py-1 border rounded text-sm">
                            <option value="10">10pt</option>
                            <option value="12">12pt</option>
                            <option value="14">14pt</option>
                            <option value="16">16pt</option>
                            <option value="18">18pt</option>
                        </select>

                        <input type="color" onChange={(e) => formatColor(e.target.value)} className="w-8 h-8 cursor-pointer" />

                        <span className="text-xs text-gray-500 ml-auto">Select text then format</span>
                    </div>

                    {/* Editor */}
                    <div className="bg-gray-100 p-6 rounded-xl">
                        <style>{`
                        .resume-editor { 
                            color: #000000; 
                            font-family: Inter, Arial, sans-serif !important;
                            font-size: 10pt !important;
                        }
                        .resume-editor ul { list-style-type: disc !important; list-style-position: outside !important; padding-left: 20px !important; }
                        .resume-editor li { display: list-item !important; margin-bottom: 2px !important; }
                    `}</style>
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            className="resume-editor w-full max-w-[8.5in] min-h-[11in] mx-auto bg-white border p-8 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            style={{ lineHeight: '1.4' }}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
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