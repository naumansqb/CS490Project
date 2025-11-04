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
    const [selectedColor, setSelectedColor] = useState('#000000');
    const [selectedFont, setSelectedFont] = useState('Inter, system-ui, sans-serif');
    const [selectedFontSize, setSelectedFontSize] = useState('12');

    const previewRef = useRef<HTMLDivElement>(null);
    const savedSelectionRef = useRef<Range | null>(null);

    // Save selection for color picker
    const saveSelectionForColor = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && previewRef.current) {
            const range = selection.getRangeAt(0);
            if (previewRef.current.contains(range.commonAncestorContainer)) {
                savedSelectionRef.current = range.cloneRange();
            }
        }
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

                if (data.content?.style) {
                    setSelectedFont(data.content.style.fontFamily || 'Inter, system-ui, sans-serif');
                    if (data.content.style.textColor) {
                        setSelectedColor(data.content.style.textColor);
                    }
                    if (data.content.style.fontSize) {
                        setSelectedFontSize(String(data.content.style.fontSize));
                    }
                }
            } catch (err: any) {
                console.error('Failed to load resume:', err);
                setError(err?.message || 'Could not load this resume.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [resumeId]);

    // Sync contentEditable with resume htmlContent only on initial load
    useEffect(() => {
        if (resume?.content?.htmlContent && previewRef.current) {
            // Only update if contentEditable is empty or different from saved content
            const currentContent = previewRef.current.innerHTML.trim();
            const savedContent = resume.content.htmlContent.trim();

            // Only update if contentEditable is empty or significantly different
            if (!currentContent || currentContent === '<br>' || currentContent === '') {
                previewRef.current.innerHTML = savedContent;
            }
        }
    }, [resume?.content?.htmlContent]);

    const handleSave = async () => {
        if (!resumeId || !previewRef.current) return;

        setSaving(true);
        setError(null);

        try {
            const htmlContent = previewRef.current.innerHTML;

            const updatedResume = await resumeApi.updateResume(resumeId, {
                content: {
                    ...resume?.content,
                    htmlContent: htmlContent,
                    style: {
                        fontFamily: selectedFont,
                        fontSize: Number(selectedFontSize),
                        textColor: selectedColor,
                    },
                },
            });

            // Update resume state with the saved data
            setResume(updatedResume);

            const successMsg = document.createElement('div');
            successMsg.className =
                'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
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

    const handleBold = () => {
        document.execCommand('bold', false);
    };

    const handleItalic = () => {
        document.execCommand('italic', false);
    };

    const handleBulletList = () => {
        document.execCommand('insertUnorderedList', false);
    };

    const handleColorChange = (color: string) => {
        setSelectedColor(color);

        // Restore saved selection if available
        const selection = window.getSelection();
        if (savedSelectionRef.current && selection) {
            try {
                selection.removeAllRanges();
                selection.addRange(savedSelectionRef.current);
            } catch (e) {
                // Selection might be invalid, try current selection
            }
        }

        // Ensure editor is focused
        if (previewRef.current) {
            previewRef.current.focus();
        }

        // Restore selection again after focus (focus might clear it)
        if (savedSelectionRef.current && selection) {
            try {
                selection.removeAllRanges();
                selection.addRange(savedSelectionRef.current);
            } catch (e) {
                // Selection might be invalid
            }
        }

        // Apply color to selected text
        document.execCommand('foreColor', false, color);

        // Clear saved selection
        savedSelectionRef.current = null;
    };

    const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const font = e.target.value;
        setSelectedFont(font);

        if (!previewRef.current) return;

        // Apply font to all text elements in the container
        const allElements = previewRef.current.querySelectorAll('*');
        allElements.forEach((el) => {
            (el as HTMLElement).style.fontFamily = font;
        });

        // Also apply to the container itself
        previewRef.current.style.fontFamily = font;
    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const size = e.target.value;
        setSelectedFontSize(size);

        if (!previewRef.current) return;

        // Apply font size to all text elements in the container
        const allElements = previewRef.current.querySelectorAll('*');
        allElements.forEach((el) => {
            (el as HTMLElement).style.fontSize = size + 'pt';
        });

        // Also apply to the container itself
        previewRef.current.style.fontSize = size + 'pt';
    };

    // =========================
    // TEMPLATES
    // =========================
    const renderTemplate = () => {
        if (!resume?.content) return null;

        const content: any = resume.content;

        // Prefer previously saved HTML from the editor
        if (content.htmlContent) {
            return <div dangerouslySetInnerHTML={{ __html: content.htmlContent }} />;
        }

        const personalInfo = content.personalInfo || {};
        const templateType = (resume.template?.type || '').toLowerCase();

        // Shared building blocks
        const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
            <div
                style={{
                    fontWeight: 600,
                    fontSize: '10pt',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #000',
                    paddingBottom: '2px',
                    marginBottom: '8px',
                }}
            >
                {children}
            </div>
        );

        const NameBlock = () => (
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h1
                    contentEditable
                    suppressContentEditableWarning
                    style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0 }}
                >
                    {personalInfo.fullName || 'YOUR NAME'}
                </h1>
            </div>
        );

        const TwoColumnContacts = () => (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10pt',
                    marginBottom: '16px',
                    borderBottom: '1px solid #000',
                    paddingBottom: '4px',
                }}
            >
                <div style={{ textAlign: 'left' }}>
                    <div contentEditable suppressContentEditableWarning>
                        {personalInfo.location || 'City, State'}
                    </div>
                    <div contentEditable suppressContentEditableWarning>
                        {personalInfo.phone || 'Phone Number'}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div contentEditable suppressContentEditableWarning>
                        {personalInfo.email || 'email address'}
                    </div>
                    <div contentEditable suppressContentEditableWarning>
                        {personalInfo.linkedin || 'Personalized LinkedIn URL'}
                    </div>
                </div>
            </div>
        );

        const SingleLineContacts = () => (
            <div
                contentEditable
                suppressContentEditableWarning
                style={{
                    textAlign: 'center',
                    fontSize: '10pt',
                    marginBottom: '16px',
                    borderBottom: '1px solid #000',
                    paddingBottom: '6px',
                }}
            >
                {(personalInfo.phone || 'Phone') +
                    ' | ' +
                    (personalInfo.email || 'Email') +
                    ' | ' +
                    (personalInfo.location || 'City, State')}{' '}
                {`| ${personalInfo.portfolio || 'Online Portfolio/Professional Website (Optional)'}`}
            </div>
        );

        const WorkExperienceFull = () =>
            Array.isArray(content.workExperience) && content.workExperience.length > 0 ? (
                <section style={{ marginBottom: '16px' }}>
                    <SectionHeader>
                        {templateType.includes('hybrid') ? 'EXPERIENCE' : 'PROFESSIONAL EXPERIENCE'}
                    </SectionHeader>
                    {content.workExperience.map((job: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: '12px' }}>
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                style={{
                                    fontSize: '12pt',
                                    fontWeight: 600,
                                    ...(templateType.includes('hybrid')
                                        ? { display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }
                                        : {}),
                                }}
                            >
                                <span>
                                    {job.title}
                                    {job.company && `, ${job.company}`}
                                    {job.location && `, ${job.location}`}
                                </span>
                                {templateType.includes('hybrid') && (
                                    <span style={{ fontWeight: 400, fontStyle: 'italic' }}>
                                        {job.startDate || 'Start Date'} – {job.endDate || 'End Date'}
                                    </span>
                                )}
                            </div>
                            {!templateType.includes('hybrid') && (
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    style={{ fontSize: '11pt', fontStyle: 'italic' }}
                                >
                                    {job.startDate} – {job.endDate}
                                </div>
                            )}
                            {Array.isArray(job.bullets) && job.bullets.length > 0 && (
                                <ul
                                    contentEditable
                                    suppressContentEditableWarning
                                    style={{
                                        fontSize: '12pt',
                                        paddingLeft: '20px',
                                        margin: '4px 0 0 0',
                                        listStyleType: 'disc',
                                        listStylePosition: 'outside',
                                    }}
                                >
                                    {job.bullets.map((b: string, j: number) => (
                                        <li key={j} style={{ marginBottom: '2px' }}>
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </section>
            ) : null;

        const EducationBlock = () =>
            Array.isArray(content.education) && content.education.length > 0 ? (
                <section style={{ marginBottom: '16px' }}>
                    <SectionHeader>
                        {templateType.includes('functional')
                            ? 'EDUCATION AND PROFESSIONAL DEVELOPMENT'
                            : 'EDUCATION'}
                    </SectionHeader>
                    {content.education.map((edu: any, idx: number) => (
                        <div
                            key={idx}
                            contentEditable
                            suppressContentEditableWarning
                            style={{ fontSize: '12pt', marginBottom: '8px' }}
                        >
                            <div style={{ fontWeight: 600 }}>
                                {edu.degree}
                                {edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}
                            </div>
                            <div>{edu.institution}</div>
                            {edu.location && <div>{edu.location}</div>}
                            {edu.graduationDate && (
                                <div style={{ fontSize: '11pt' }}>
                                    {templateType.includes('hybrid')
                                        ? `Month/Year of Completion: ${edu.graduationDate}`
                                        : `Graduated: ${edu.graduationDate}`}
                                </div>
                            )}
                        </div>
                    ))}
                </section>
            ) : null;

        // === CHRONOLOGICAL ===
        const Chronological = () => (
            <>
                <NameBlock />
                <TwoColumnContacts />

                {content.summary && (
                    <section style={{ marginBottom: '16px' }}>
                        <SectionHeader>SUMMARY OF QUALIFICATIONS</SectionHeader>
                        <div
                            contentEditable
                            suppressContentEditableWarning
                            style={{ fontSize: '12pt', whiteSpace: 'pre-line' }}
                        >
                            {content.summary}
                        </div>
                    </section>
                )}

                <WorkExperienceFull />
                <EducationBlock />

                <section>
                    <SectionHeader>"OTHER SECTIONS"</SectionHeader>
                    <div
                        contentEditable
                        suppressContentEditableWarning
                        style={{ fontSize: '12pt', fontStyle: 'italic', minHeight: 20 }}
                    />
                </section>
            </>
        );

        // === FUNCTIONAL ===
        const Functional = () => (
            <>
                <NameBlock />
                <TwoColumnContacts />

                {/* SUMMARY OF QUALIFICATIONS */}
                <section style={{ marginBottom: '16px' }}>
                    <SectionHeader>SUMMARY OF QUALIFICATIONS</SectionHeader>
                    <div
                        contentEditable
                        suppressContentEditableWarning
                        style={{ fontSize: '12pt', whiteSpace: 'pre-line' }}
                    >
                        {content.summary || 'Paragraph or 4–8 bullet points summarizing key strengths…'}
                    </div>
                </section>

                {/* PROFESSIONAL EXPERIENCE (grouped by expertise/skill area) */}
                <section style={{ marginBottom: '16px' }}>
                    <SectionHeader>PROFESSIONAL EXPERIENCE</SectionHeader>
                    {(Array.isArray(content.skills) && content.skills.length > 0
                        ? content.skills
                        : [
                            {
                                category: 'Expertise/Skill Area #1',
                                items: ['Add 3–6 accomplishment statements starting with action verbs…'],
                            },
                            {
                                category: 'Expertise/Skill Area #2',
                                items: ['Add accomplishment statements…'],
                            },
                            {
                                category: 'Expertise/Skill Area #3',
                                items: ['Add accomplishment statements…'],
                            },
                        ]
                    ).map((skillGroup: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: 10 }}>
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                style={{ fontSize: '12pt', fontWeight: 600 }}
                            >
                                {skillGroup.category || 'Expertise/Skill Area'}
                            </div>
                            {Array.isArray(skillGroup.items) && skillGroup.items.length > 0 && (
                                <ul
                                    contentEditable
                                    suppressContentEditableWarning
                                    style={{
                                        fontSize: '12pt',
                                        paddingLeft: 20,
                                        margin: '4px 0',
                                        listStyleType: 'disc',
                                    }}
                                >
                                    {skillGroup.items.map((item: string, j: number) => (
                                        <li key={j} style={{ marginBottom: 2 }}>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </section>

                {/* EMPLOYMENT HISTORY (condensed list) */}
                {Array.isArray(content.workExperience) && content.workExperience.length > 0 && (
                    <section style={{ marginBottom: '16px' }}>
                        <SectionHeader>EMPLOYMENT HISTORY</SectionHeader>
                        <div style={{ fontSize: '12pt' }}>
                            {content.workExperience.map((job: any, i: number) => (
                                <div
                                    key={i}
                                    contentEditable
                                    suppressContentEditableWarning
                                    style={{ marginBottom: 6 }}
                                >
                                    {[
                                        job.title,
                                        job.company || job.organization,
                                        job.department,
                                        job.location,
                                    ]
                                        .filter(Boolean)
                                        .join(', ')}
                                    {job.startDate || job.endDate ? (
                                        <> — {job.startDate} – {job.endDate}</>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* EDUCATION AND PROFESSIONAL DEVELOPMENT */}
                <EducationBlock />

                {/* "OTHER SECTIONS" */}
                <section>
                    <SectionHeader>"OTHER SECTIONS"</SectionHeader>
                    <div
                        contentEditable
                        suppressContentEditableWarning
                        style={{ fontSize: '12pt', fontStyle: 'italic', minHeight: 20 }}
                    />
                </section>
            </>
        );

        // === HYBRID (Combination) ===
        const Hybrid = () => (
            <>
                <NameBlock />
                <SingleLineContacts />

                {/* SKILLS SUMMARY */}
                <section style={{ marginBottom: '16px' }}>
                    <SectionHeader>SKILLS SUMMARY</SectionHeader>
                    {Array.isArray(content.skills) && content.skills.length > 0 ? (
                        <div>
                            {content.skills.map((s: any, i: number) => {
                                // Determine which field to use for the skill name
                                const skillName = s.category || s.name || '[Skill]';

                                // Determine which array to use for items
                                const hasItems = Array.isArray(s.items) && s.items.length > 0;
                                const hasBullets = Array.isArray(s.bullets) && s.bullets.length > 0;

                                return (
                                    <div key={i} style={{ marginBottom: 10 }}>
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning
                                            style={{ fontSize: '12pt', fontWeight: 600 }}
                                        >
                                            {skillName}
                                        </div>

                                        {hasItems ? (
                                            // Use items array (what backend sends)
                                            <ul
                                                contentEditable
                                                suppressContentEditableWarning
                                                style={{ fontSize: '12pt', paddingLeft: 20, margin: '4px 0' }}
                                            >
                                                {s.items.map((item: string, j: number) => (
                                                    <li key={j} style={{ marginBottom: 2 }}>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : hasBullets ? (
                                            // Fallback to bullets array (for backwards compatibility)
                                            <ul
                                                contentEditable
                                                suppressContentEditableWarning
                                                style={{ fontSize: '12pt', paddingLeft: 20, margin: '4px 0' }}
                                            >
                                                {s.bullets.map((b: string, j: number) => (
                                                    <li key={j} style={{ marginBottom: 2 }}>
                                                        {b}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            // Default placeholder if no items or bullets
                                            <ul
                                                contentEditable
                                                suppressContentEditableWarning
                                                style={{ fontSize: '12pt', paddingLeft: 20, margin: '4px 0' }}
                                            >
                                                <li>[Description of duty or accomplishment that validates skill]</li>
                                                <li>[Description of duty or accomplishment that validates skill]</li>
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // Default placeholders if no skills at all
                        <div>
                            {['[Skill]', '[Skill]', '[Skill]'].map((label, i) => (
                                <div key={i} style={{ marginBottom: 10 }}>
                                    <div
                                        contentEditable
                                        suppressContentEditableWarning
                                        style={{ fontSize: '12pt', fontWeight: 600 }}
                                    >
                                        {label}
                                    </div>
                                    <ul
                                        contentEditable
                                        suppressContentEditableWarning
                                        style={{ fontSize: '12pt', paddingLeft: 20, margin: '4px 0' }}
                                    >
                                        <li>[Description of duty or accomplishment that validates skill]</li>
                                        <li>[Description of duty or accomplishment that validates skill]</li>
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* EXPERIENCE */}
                <WorkExperienceFull />

                {/* EDUCATION */}
                <EducationBlock />
            </>
        );

        // Router for template type
        if (templateType.includes('functional')) return <Functional />;
        if (templateType.includes('hybrid') || templateType.includes('combination')) return <Hybrid />;

        // default only when empty or explicitly chrono
        if (templateType.includes('chrono') || !templateType) return <Chronological />;

        return <div>Unknown template type</div>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    <span className="text-gray-600">Loading resume...</span>
                </div>
            </div>
        );
    }

    if (error || !resume) {
        return (
            <div className="min-h-screen bg-white p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.push('/dashboard/resumes')}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Resumes
                    </button>

                    <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="font-semibold">
                                Failed to load resume
                            </div>
                            <div className="text-sm mt-1">
                                {error || 'Resume not found'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <button
                        onClick={() => router.push('/dashboard/resumes')}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Resumes
                    </button>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors shadow disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Formatting Toolbar */}
                <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
                    <div className="flex flex-col gap-4">
                        {/* Row 1: Text Formatting */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <span className="text-sm font-semibold text-gray-700">Text:</span>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleBold}
                                className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-200"
                                title="Bold (Ctrl+B)"
                            >
                                <Bold className="w-4 h-4" />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleItalic}
                                className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-200"
                                title="Italic (Ctrl+I)"
                            >
                                <Italic className="w-4 h-4" />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleBulletList}
                                className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-200"
                                title="Bullet List"
                            >
                                <List className="w-4 h-4" />
                            </button>

                            <div className="w-px h-6 bg-gray-300" />

                            {/* Font Selector */}
                            <div className="flex items-center gap-2">
                                <Type className="w-4 h-4 text-gray-600" />
                                <select
                                    value={selectedFont}
                                    onChange={handleFontChange}
                                    className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="Inter, system-ui, sans-serif">Inter</option>
                                    <option value="Arial, sans-serif">Arial</option>
                                    <option value="'Times New Roman', serif">Times New Roman</option>
                                    <option value="Georgia, serif">Georgia</option>
                                    <option value="'Courier New', monospace">Courier New</option>
                                    <option value="Verdana, sans-serif">Verdana</option>
                                    <option value="Helvetica, sans-serif">Helvetica</option>
                                </select>
                            </div>

                            {/* Font Size Selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Size:</span>
                                <select
                                    value={selectedFontSize}
                                    onChange={handleFontSizeChange}
                                    className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="8">8pt</option>
                                    <option value="9">9pt</option>
                                    <option value="10">10pt</option>
                                    <option value="11">11pt</option>
                                    <option value="12">12pt</option>
                                    <option value="14">14pt</option>
                                    <option value="16">16pt</option>
                                    <option value="18">18pt</option>
                                    <option value="20">20pt</option>
                                    <option value="24">24pt</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Color Picker */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-700">Color:</span>
                            <div
                                onMouseDown={saveSelectionForColor}
                                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded hover:border-cyan-500 transition-colors"
                            >
                                <Palette className="w-4 h-4 text-gray-600" />
                                <input
                                    type="color"
                                    value={selectedColor}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    onFocus={saveSelectionForColor}
                                    className="w-8 h-8 border-none cursor-pointer bg-transparent"
                                    title="Color Picker"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editable Resume Preview */}
                <div className="bg-gray-100 border border-gray-300 rounded-xl p-6 shadow-inner">
                    <style>
                        {`
                        /* Ensure bullets are visible in contentEditable */
                        [contenteditable] ul {
                            list-style-type: disc !important;
                            list-style-position: outside !important;
                            padding-left: 20px !important;
                            margin: 4px 0 !important;
                        }
                        
                        [contenteditable] ul li {
                            display: list-item !important;
                            margin-bottom: 2px !important;
                        }
                        
                        [contenteditable] ol {
                            list-style-type: decimal !important;
                            list-style-position: outside !important;
                            padding-left: 20px !important;
                            margin: 4px 0 !important;
                        }
                        
                        [contenteditable] ol li {
                            display: list-item !important;
                            margin-bottom: 2px !important;
                        }
                        
                        /* Page break support for multi-page resumes */
                        @media print {
                            .page-break {
                                page-break-before: always;
                            }
                        }
                        
                        /* Visual indicator for page breaks in editor */
                        .page-break {
                            border-top: 2px dashed #ccc;
                            margin: 20px 0;
                            padding-top: 20px;
                        }
                        
                        /* Prevent text overflow */
                        [contenteditable], [contenteditable] * {
                            word-wrap: break-word !important;
                            overflow-wrap: break-word !important;
                            word-break: break-word !important;
                            max-width: 100% !important;
                        }
                        
                        /* Prevent horizontal scrolling */
                        .resume-container {
                            overflow-x: hidden !important;
                        }
                        `}
                    </style>
                    <div
                        ref={previewRef}
                        contentEditable
                        suppressContentEditableWarning
                        className="resume-container w-full max-w-[8.5in] min-h-[11in] mx-auto bg-white border border-gray-300 shadow-lg p-8 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        style={{
                            lineHeight: '1.4',
                        }}
                    >
                        {renderTemplate()}
                    </div>
                </div>

            </div>
        </div>
    );
}