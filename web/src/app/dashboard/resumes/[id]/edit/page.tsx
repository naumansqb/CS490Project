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
    Palette,
} from 'lucide-react';
import { resumeApi, ResumeDetail } from '@/lib/resume.api';

export default function EditResumePage() {
    const router = useRouter();
    const params = useParams();
    const resumeId = params?.id as string | undefined;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resume, setResume] = useState<ResumeDetail | null>(null);
    const [htmlContent, setHtmlContent] = useState<string>('');

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

        const summarySection = content.summary ? `
            <section style="margin-bottom: 16px;">
                <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                    SUMMARY OF QUALIFICATIONS
                </div>
                <div style="font-size: 12pt; white-space: pre-line;">
                    ${content.summary}
                </div>
            </section>
        ` : '';

        const workExperience = Array.isArray(content.workExperience) && content.workExperience.length > 0 ? `
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
        ` : '';

        const education = Array.isArray(content.education) && content.education.length > 0 ? `
            <section style="margin-bottom: 16px;">
                <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                    EDUCATION
                </div>
                ${content.education.map((edu: any) => `
                    <div style="font-size: 12pt; margin-bottom: 8px;">
                        <div style="font-weight: 600;">
                            ${edu.degree}${edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                        </div>
                        <div>${edu.institution}</div>
                        ${edu.graduationDate ? `<div style="font-size: 11pt;">Graduated: ${edu.graduationDate}</div>` : ''}
                    </div>
                `).join('')}
            </section>
        ` : '';

        // Functional template
        if (templateType.includes('functional')) {
            const skills = Array.isArray(content.skills) && content.skills.length > 0 ? content.skills : [
                { category: 'Skill Area #1', items: ['Add accomplishments...'] },
                { category: 'Skill Area #2', items: ['Add accomplishments...'] }
            ];

            const skillsSection = `
                <section style="margin-bottom: 16px;">
                    <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                        PROFESSIONAL EXPERIENCE
                    </div>
                    ${skills.map((skillGroup: any) => `
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 12pt; font-weight: 600;">
                                ${skillGroup.category || 'Skill Area'}
                            </div>
                            <ul style="font-size: 12pt; padding-left: 20px; margin: 4px 0;">
                                ${(skillGroup.items || []).map((item: string) => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </section>
            `;

            return nameBlock + twoColumnContacts + summarySection + skillsSection + education;
        }

        // Hybrid template
        if (templateType.includes('hybrid')) {
            const skills = Array.isArray(content.skills) && content.skills.length > 0 ? content.skills : [
                { category: 'Skill', items: ['Description...'] }
            ];

            const skillsSection = `
                <section style="margin-bottom: 16px;">
                    <div style="font-weight: 600; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px;">
                        SKILLS SUMMARY
                    </div>
                    ${skills.map((s: any) => `
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 12pt; font-weight: 600;">
                                ${s.category || s.name || 'Skill'}
                            </div>
                            <ul style="font-size: 12pt; padding-left: 20px; margin: 4px 0;">
                                ${(s.items || s.bullets || ['Description...']).map((item: string) => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </section>
            `;

            return nameBlock + singleLineContacts + skillsSection + workExperience + education;
        }

        // Chronological (default)
        return nameBlock + twoColumnContacts + summarySection + workExperience + education;
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
            <div className="min-h-screen bg-white p-8">
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
        <div className="min-h-screen bg-white text-black p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => router.push('/dashboard/resumes')} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium">
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save</>}
                    </button>
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
    );
}