'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Edit } from 'lucide-react';
import { resumeApi, ResumeDetail } from '@/lib/resume.api';

export default function ViewResumePage() {
    const router = useRouter();
    const params = useParams();
    const resumeId = params?.id as string | undefined;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resume, setResume] = useState<ResumeDetail | null>(null);

    const resumeRef = useRef<HTMLDivElement>(null);

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
                console.log('📄 Loaded resume:', data);
                setResume(data);
            } catch (err: any) {
                console.error('Failed to load resume:', err);
                setError(err?.message || 'Could not load this resume.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [resumeId]);

    // ============================
    // Normalization helpers
    // ============================
    type SkillGroup = { category: string; items: string[] };

    function normalizeSummary(content: any): string {
        return (
            content?.summary ??
            content?.personalSummary ??
            content?.profile?.summary ??
            content?.about?.text ??
            ''
        );
    }

    function normalizeSkills(content: any): SkillGroup[] {
        // Already grouped: [{category, items}]
        if (Array.isArray(content?.skills) && content.skills.every((g: any) => Array.isArray(g?.items))) {
            return content.skills as SkillGroup[];
        }

        // Flat array of strings: ["Python","SQL"]
        if (Array.isArray(content?.skills) && content.skills.every((s: any) => typeof s === 'string')) {
            return [{ category: 'Skills', items: content.skills as string[] }];
        }

        // Common alternates
        if (Array.isArray(content?.skillsFlat)) {
            return [{ category: 'Skills', items: content.skillsFlat as string[] }];
        }

        // Object map: { "Technical": ["Python","TS"], "Soft": ["Leadership"] }
        if (content?.skillCategories && typeof content.skillCategories === 'object') {
            return Object.entries(content.skillCategories).map(([category, items]: [string, any]) => ({
                category,
                items: Array.isArray(items) ? items : [],
            }));
        }

        return [];
    }

    function normalizeWork(content: any): Array<{
        title?: string;
        company?: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        bullets: string[];
    }> {
        const raw = content?.workExperience ?? content?.experience ?? [];
        if (!Array.isArray(raw)) return [];
        return raw.map((j: any) => ({
            title: j?.title ?? j?.position ?? '',
            company: j?.company ?? j?.employer ?? '',
            location: j?.location ?? '',
            startDate: j?.startDate ?? j?.from ?? '',
            endDate: j?.endDate ?? j?.to ?? 'Present',
            bullets:
                (Array.isArray(j?.bullets) && j.bullets) ||
                (Array.isArray(j?.highlights) && j.highlights) ||
                (Array.isArray(j?.responsibilities) && j.responsibilities) ||
                [],
        }));
    }

    function normalizeEducation(content: any) {
        const raw = content?.education ?? content?.educations ?? [];
        if (!Array.isArray(raw)) return [];
        return raw.map((e: any) => ({
            degree: e?.degree ?? e?.qualification ?? '',
            fieldOfStudy: e?.fieldOfStudy ?? e?.major ?? '',
            institution: e?.institution ?? e?.school ?? '',
            graduationDate: e?.graduationDate ?? e?.date ?? '',
        }));
    }

    const renderTemplate = () => {
        if (!resume?.content) return null;

        // If htmlContent exists (user edited it), render that
        if (resume.content.htmlContent) {
            return <div dangerouslySetInnerHTML={{ __html: resume.content.htmlContent }} />;
        }

        const content = resume.content;
        const templateType = (resume.template?.type || '').toLowerCase();
        const fontFamily = content.style?.fontFamily || 'Inter, system-ui, sans-serif';

        // --- normalized data used everywhere below ---
        const personalInfo = content.personalInfo || {};
        const summary = normalizeSummary(content);
        const skillsGroups = normalizeSkills(content);
        const work = normalizeWork(content);
        const education = normalizeEducation(content);

        console.log('🎨 Rendering template type:', templateType);
        console.log('👤 Personal info:', personalInfo);
        console.log('🧰 normalized:', {
            hasSummary: !!summary,
            skillsGroups: skillsGroups.length,
            workLen: work.length,
            eduLen: education.length,
        });

        // ==================== CHRONOLOGICAL ====================
        if (templateType.includes('chrono')) {
            return (
                <div style={{ fontFamily, fontSize: '12pt', lineHeight: '1.4' }}>
                    {/* Name */}
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0 }}>
                            {personalInfo.fullName || 'YOUR NAME'}
                        </h1>
                    </div>

                    {/* Contact Info - Two Columns */}
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
                            <div>{personalInfo.location || 'City, State'}</div>
                            <div>{personalInfo.phone || 'Phone Number'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div>{personalInfo.email || 'email address'}</div>
                            <div>{personalInfo.linkedin || 'Personalized LinkedIn URL'}</div>
                        </div>
                    </div>

                    {/* Summary */}
                    {summary && (
                        <section style={{ marginBottom: '16px' }}>
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
                                SUMMARY OF QUALIFICATIONS
                            </div>
                            <div style={{ fontSize: '12pt', whiteSpace: 'pre-line' }}>{summary}</div>
                        </section>
                    )}

                    {/* Professional Experience */}
                    {work.length > 0 && (
                        <section style={{ marginBottom: '16px' }}>
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
                                PROFESSIONAL EXPERIENCE
                            </div>
                            {work.map((job, idx) => (
                                <div key={idx} style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12pt', fontWeight: 600 }}>
                                        {job.title}
                                        {job.company && `, ${job.company}`}
                                        {job.location && `, ${job.location}`}
                                    </div>
                                    <div style={{ fontSize: '11pt', fontStyle: 'italic' }}>
                                        {job.startDate} – {job.endDate}
                                    </div>
                                    {job.bullets.length > 0 && (
                                        <ul
                                            style={{
                                                fontSize: '12pt',
                                                paddingLeft: '20px',
                                                margin: '4px 0 0 0',
                                                listStyleType: 'disc',
                                            }}
                                        >
                                            {job.bullets.map((bullet, j) => (
                                                <li key={j} style={{ marginBottom: '2px' }}>
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Education */}
                    {education.length > 0 && (
                        <section style={{ marginBottom: '16px' }}>
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
                                EDUCATION
                            </div>
                            {education.map((edu: any, idx: number) => (
                                <div key={idx} style={{ fontSize: '12pt', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 600 }}>
                                        {edu.degree}
                                        {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                                    </div>
                                    <div>{edu.institution}</div>
                                    {edu.graduationDate && <div style={{ fontSize: '11pt' }}>Graduated: {edu.graduationDate}</div>}
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Other Sections */}
                    <section>
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
                            "OTHER SECTIONS"
                        </div>
                    </section>
                </div>
            );
        }

        // ==================== FUNCTIONAL ====================
        if (templateType.includes('function')) {
            return (
                <div style={{ fontFamily, fontSize: '12pt', lineHeight: '1.4' }}>
                    {/* Name */}
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0 }}>
                            {personalInfo.fullName || 'YOUR NAME'}
                        </h1>
                    </div>

                    {/* Contact Info - Two Columns */}
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
                            <div>{personalInfo.location || 'City, State'}</div>
                            <div>{personalInfo.phone || 'Phone Number'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div>{personalInfo.email || 'email address'}</div>
                            <div>{personalInfo.linkedin || 'Personalized LinkedIn URL'}</div>
                        </div>
                    </div>

                    {/* Summary */}
                    {summary && (
                        <section style={{ marginBottom: '16px' }}>
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
                                SUMMARY OF QUALIFICATIONS
                            </div>
                            <div style={{ fontSize: '12pt', whiteSpace: 'pre-line' }}>{summary}</div>
                        </section>
                    )}

                    {/* Skills by Category */}
                    {skillsGroups.length > 0 && (
                        <section style={{ marginBottom: '16px' }}>
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
                                SKILLS / AREAS OF EXPERTISE
                            </div>
                            {skillsGroups.map((skillGroup, idx) => (
                                <div key={idx} style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12pt', fontWeight: 600 }}>
                                        {skillGroup.category || 'Expertise/Skill Area'}
                                    </div>
                                    {skillGroup.items.length > 0 && (
                                        <ul
                                            style={{
                                                fontSize: '12pt',
                                                paddingLeft: '20px',
                                                margin: '4px 0',
                                                listStyleType: 'disc',
                                            }}
                                        >
                                            {skillGroup.items.map((item, j) => (
                                                <li key={j} style={{ marginBottom: '2px' }}>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Employment History (condensed) */}
                    {work.length > 0 && (
                        <section style={{ marginBottom: '16px' }}>
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
                                EMPLOYMENT HISTORY
                            </div>
                            {work.map((job, idx) => (
                                <div key={idx} style={{ fontSize: '12pt', marginBottom: '6px' }}>
                                    {job.title}
                                    {job.company && `, ${job.company}`}
                                    {job.location && `, ${job.location}`}
                                    {job.startDate && job.endDate && ` — ${job.startDate} – ${job.endDate}`}
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Education */}
                    {education.length > 0 && (
                        <section style={{ marginBottom: '16px' }}>
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
                                EDUCATION AND PROFESSIONAL DEVELOPMENT
                            </div>
                            {education.map((edu: any, idx: number) => (
                                <div key={idx} style={{ fontSize: '12pt', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 600 }}>
                                        {edu.degree}
                                        {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                                    </div>
                                    <div>{edu.institution}</div>
                                    {edu.graduationDate && <div style={{ fontSize: '11pt' }}>Graduated: {edu.graduationDate}</div>}
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Other Sections */}
                    <section>
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
                            "OTHER SECTIONS"
                        </div>
                    </section>
                </div>
            );
        }

        // ==================== HYBRID ====================
        if (templateType.includes('hybrid')) {
            return (
                <div style={{ fontFamily, fontSize: '12pt', lineHeight: '1.4' }}>
                    {/* Name */}
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0 }}>
                            {personalInfo.fullName || 'YOUR NAME'}
                        </h1>
                    </div>

                    {/* Contact Info - Single Line */}
                    <div
                        style={{
                            textAlign: 'center',
                            fontSize: '10pt',
                            marginBottom: '16px',
                            borderBottom: '1px solid #000',
                            paddingBottom: '6px',
                        }}
                    >
                        {personalInfo.phone || 'Phone'} | {personalInfo.email || 'Email'} |{' '}
                        {personalInfo.location || 'City, State'}
                        {personalInfo.linkedin && ` | ${personalInfo.linkedin}`}
                    </div>

                    {/* Skills Summary */}
                    {skillsGroups.length > 0 && (
                        <section style={{ marginBottom: '16px' }}>
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
                                SKILLS SUMMARY
                            </div>
                            {skillsGroups.map((skillGroup, idx) => (
                                <div key={idx} style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12pt', fontWeight: 600 }}>
                                        {skillGroup.category || '[Skill]'}
                                    </div>
                                    {skillGroup.items.length > 0 && (
                                        <ul
                                            style={{
                                                fontSize: '12pt',
                                                paddingLeft: '20px',
                                                margin: '4px 0',
                                                listStyleType: 'disc',
                                            }}
                                        >
                                            {skillGroup.items.map((item, j) => (
                                                <li key={j} style={{ marginBottom: '2px' }}>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Experience */}
                    {work.length > 0 && (
                        <section style={{ marginBottom: '16px' }}>
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
                                EXPERIENCE
                            </div>
                            {work.map((job, idx) => (
                                <div key={idx} style={{ marginBottom: '12px' }}>
                                    <div
                                        style={{
                                            fontSize: '12pt',
                                            fontWeight: 600,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: 8,
                                        }}
                                    >
                                        <span>
                                            {job.title}
                                            {job.company && `, ${job.company}`}
                                            {job.location && `, ${job.location}`}
                                        </span>
                                        <span style={{ fontWeight: 400, fontStyle: 'italic' }}>
                                            {job.startDate || 'Start'} – {job.endDate || 'End'}
                                        </span>
                                    </div>
                                    {job.bullets.length > 0 && (
                                        <ul
                                            style={{
                                                fontSize: '12pt',
                                                paddingLeft: '20px',
                                                margin: '4px 0',
                                                listStyleType: 'disc',
                                            }}
                                        >
                                            {job.bullets.map((bullet, j) => (
                                                <li key={j} style={{ marginBottom: '2px' }}>
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Education */}
                    {education.length > 0 && (
                        <section style={{ marginBottom: '16px' }}>
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
                                EDUCATION
                            </div>
                            {education.map((edu: any, idx: number) => (
                                <div key={idx} style={{ fontSize: '12pt', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 600 }}>
                                        {edu.degree}
                                        {edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}
                                    </div>
                                    <div>{edu.institution}</div>
                                    {edu.graduationDate && (
                                        <div style={{ fontSize: '11pt' }}>
                                            Month/Year of Completion: {edu.graduationDate}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            );
        }

        // Fallback
        return (
            <div>
                <p>Unknown template type: {templateType}</p>
                <pre>{JSON.stringify(content, null, 2)}</pre>
            </div>
        );
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
            <div className="bg-white p-8">
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
                            <div className="font-semibold">Failed to load resume</div>
                            <div className="text-sm mt-1">{error || 'Resume not found'}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white text-black p-8">
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

                    <button
                        onClick={() => router.push(`/dashboard/resumes/${resumeId}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors shadow"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Resume
                    </button>
                </div>

                {/* Resume Preview */}
                <div className="bg-gray-100 border border-gray-300 rounded-xl p-6 shadow-inner">
                    <div
                        ref={resumeRef}
                        className="w-full max-w-[8.5in] min-h-[11in] mx-auto bg-white border border-gray-300 shadow-lg p-8"
                    >
                        {renderTemplate()}
                    </div>
                </div>

                <div className="text-center text-xs text-gray-500 mt-4">
                    📋 View Mode • Click "Edit Resume" to make changes
                </div>
            </div>
        </div>
    );
}
