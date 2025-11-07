import { Request, Response } from 'express';
import { prisma } from '../db';

function extractUserId(req: Request): string | null {
    const anyReq = req as any;
    return anyReq.userId || anyReq.user?.id || anyReq.user?.userId || null;
}

// Get user profile data to pre-fill resume
async function getUserProfileData(userId: string) {
    try {
        // Fetch user profile
        const profile = await prisma.userProfile.findUnique({
            where: { userId },
        });

        // Fetch work experience
        const workExperience = await prisma.workExperience.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
        });

        // Fetch education
        const education = await prisma.education.findMany({
            where: { userId },
            orderBy: { graduationDate: 'desc' },
        });

        // Fetch skills
        const skills = await prisma.skill.findMany({
            where: { userId },
        });

        return {
            profile,
            workExperience,
            education,
            skills,
        };
    } catch (error) {
        return {
            profile: null,
            workExperience: [],
            education: [],
            skills: [],
        };
    }
}

// Template-specific seed content with user data
function getTemplateContent(templateType: string, userData: any) {
    const lower = templateType.toLowerCase();

    const profile = userData.profile;
    const workExperience = userData.workExperience || [];
    const education = userData.education || [];
    const skills = userData.skills || [];

    // Build personal info
    const personalInfo = {
        fullName: profile?.fullName ||
            (profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : null) ||
            profile?.name ||
            'YOUR NAME',

        location: (profile?.locationCity && profile?.locationState ? `${profile.locationCity}, ${profile.locationState}` : null) ||
            profile?.location ||
            (profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : null) ||
            (profile?.locationCity ? profile.locationCity : null) ||
            (profile?.city ? profile.city : null) ||
            'City, State',

        phone: profile?.phone_number ||
            profile?.phoneNumber ||
            profile?.phone ||
            profile?.contactNumber ||
            'Phone Number',

        email: profile?.email ||
            profile?.emailAddress ||
            'email address',

        linkedin: profile?.linkedinUrl ||
            profile?.linkedin ||
            profile?.linkedInUrl ||
            profile?.portfolioUrl ||
            profile?.githubUrl ||
            profile?.website ||
            profile?.websiteUrl ||
            'Personalized LinkedIn URL',
    };

    // Format work experience
    const formattedWorkExperience = workExperience.length > 0
        ? workExperience.slice(0, 3).map((job: any) => ({
            title: job.positionTitle || job.title || job.jobTitle || job.position || 'Job Title',
            company: job.companyName || job.company || job.organization || '',
            location: (job.locationCity && job.locationState ? `${job.locationCity}, ${job.locationState}` : null) ||
                job.location || '',
            startDate: job.startDate ? new Date(job.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
            endDate: job.isCurrent || job.current ? 'Present' : (job.endDate ? new Date(job.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''),
            current: job.isCurrent || job.current || false,
            bullets: job.description
                ? job.description.split('\n').filter((line: string) => line.trim()).map((line: string) => line.trim())
                : ['Write a concise description of your responsibilities (1-4 lines).', 'Add 3-6 accomplishment statements, starting with an action verb'],
        }))
        : [
            {
                title: 'Job title, organization/department, month and year of employment (Most Recent Job First)',
                company: '',
                location: '',
                startDate: '',
                endDate: 'Present',
                current: true,
                bullets: [
                    'Write a concise description of your responsibilities (1-4 lines).',
                    'Add 3-6 accomplishment statements, starting with an action verb',
                ],
            },
        ];

    // Format education
    const formattedEducation = education.length > 0
        ? education.map((edu: any) => ({
            degree: edu.degreeType || edu.degree || 'Degree/ Major',
            fieldOfStudy: edu.major || edu.fieldOfStudy || edu.field || '',
            institution: edu.institutionName || edu.institution || edu.school || edu.schoolName || edu.university || 'School, City, State',
            graduationDate: edu.graduationDate
                ? new Date(edu.graduationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : edu.endDate
                    ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : '',
        }))
        : [
            {
                degree: 'Degree/ Major',
                fieldOfStudy: '',
                institution: 'School, City, State',
                graduationDate: '',
            },
        ];

    // Get summary text
    const summaryText = profile?.bio || profile?.headline || `Paragraph or bullet points summarizing key strengths that qualify you for the position.
These may include your skills, experience, expertise, training, or professional traits.
You can use 4-8 statements.`;

    // ==================== CHRONOLOGICAL ====================
    if (lower.includes('chrono')) {
        return {
            personalInfo,
            summary: summaryText,
            workExperience: formattedWorkExperience,
            education: formattedEducation,
            skills: [],
            style: {
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 12,
                textColor: '#000000',
                headingColor: '#000000',
                headingAllCaps: true,
                headingFontSize: 10,
                sectionSpacing: 16,
            },
        };
    }

    // ==================== FUNCTIONAL ====================
    if (lower.includes('function')) {
        // Group skills by category
        const groupedSkills: { [key: string]: string[] } = {};

        skills.forEach((skill: any) => {
            const category = skill.skillCategory || skill.category || 'General Skills';
            const skillName = skill.skillName || skill.name || '';

            if (!groupedSkills[category]) {
                groupedSkills[category] = [];
            }
            if (skillName) {
                groupedSkills[category].push(skillName);
            }
        });

        // Convert to array format
        const skillCategories = Object.keys(groupedSkills).length > 0
            ? Object.keys(groupedSkills).slice(0, 3).map(category => ({
                category: category,
                items: groupedSkills[category].slice(0, 5),
            }))
            : [
                {
                    category: 'Expertise/Skill Area #1',
                    items: ['Add 3-6 accomplishment statements relevant to the job requirements, starting with an action verb'],
                },
                {
                    category: 'Expertise/Skill Area #2',
                    items: ['Add accomplishment statements, starting with an action verb'],
                },
                {
                    category: 'Expertise/Skill Area #3',
                    items: ['Add accomplishment statements, starting with an action verb'],
                },
            ];

        return {
            personalInfo,
            summary: summaryText,
            skills: skillCategories,
            workExperience: formattedWorkExperience.map((job: any) => ({
                title: job.title,
                company: job.company,
                location: job.location,
                startDate: job.startDate,
                endDate: job.endDate,
            })),
            education: formattedEducation,
            style: {
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 12,
                textColor: '#000000',
                headingColor: '#000000',
                headingAllCaps: true,
                headingFontSize: 10,
                sectionSpacing: 16,
            },
        };
    }

    // ==================== HYBRID ====================
    if (lower.includes('hybrid')) {
        // For hybrid, show individual skills with placeholder accomplishments
        const skillCategories = skills.length > 0
            ? skills.slice(0, 5).map((skill: any) => ({
                category: skill.skillName || skill.name || 'Skill',
                items: [
                    'Description of duty or accomplishment that validates skill',
                    'Description of duty or accomplishment that validates skill',
                ],
            }))
            : [
                {
                    category: 'Skill',
                    items: [
                        'Description of duty or accomplishment that validates skill',
                        'Description of duty or accomplishment that validates skill',
                    ],
                },
                {
                    category: 'Skill',
                    items: [
                        'Description of duty or accomplishment that validates skill',
                        'Description of duty or accomplishment that validates skill',
                    ],
                },
                {
                    category: 'Skill',
                    items: [
                        'Description of duty or accomplishment that validates skill',
                        'Description of duty or accomplishment that validates skill',
                    ],
                },
            ];

        return {
            personalInfo,
            skills: skillCategories,
            workExperience: formattedWorkExperience,
            education: formattedEducation,
            style: {
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 12,
                textColor: '#000000',
                headingColor: '#000000',
                headingAllCaps: true,
                headingFontSize: 10,
                sectionSpacing: 16,
            },
        };
    }

    // Fallback
    return {
        personalInfo,
        summary: summaryText,
        workExperience: formattedWorkExperience,
        education: formattedEducation,
        skills: [],
        style: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12,
            textColor: '#000000',
            headingColor: '#000000',
            headingAllCaps: true,
            headingFontSize: 10,
            sectionSpacing: 16,
        },
    };
}

export async function getResumesByAuthUser(req: Request, res: Response) {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: no user id found on request' });
        }

        const resumes = await prisma.resume.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { lastModified: 'desc' }],
            include: { template: true },
        });

        const payload = resumes.map((r) => ({
            id: r.id,
            name: r.name,
            userId: r.userId,
            isDefault: r.isDefault,
            createdAt: r.createdAt,
            lastModified: r.lastModified,
            template: {
                id: r.template.id,
                name: r.template.name,
                type: r.template.type,
                preview: r.template.preview,
            },
            content: r.content,
        }));

        return res.status(200).json(payload);
    } catch (err: any) {
        return res.status(500).json({
            error: 'Failed to fetch resumes',
            details: err?.message,
        });
    }
}

export async function createResume(req: Request, res: Response) {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: no user id found on request' });
        }

        const { templateId, name } = req.body;
        if (!templateId) {
            return res.status(400).json({ error: 'templateId is required' });
        }

        const template = await prisma.resumeTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template || !template.isActive) {
            return res.status(404).json({ error: 'Template not found or inactive' });
        }

        const existingResumeCount = await prisma.resume.count({
            where: { userId },
        });
        const shouldBeDefault = existingResumeCount === 0;

        // Fetch user profile data
        const userData = await getUserProfileData(userId);

        // Get template-specific content with user data
        const baseContent = getTemplateContent(template.type || '', userData);

        const newResume = await prisma.resume.create({
            data: {
                userId: userId,
                templateId: templateId,
                name: name || template.name || 'Untitled Resume',
                isDefault: shouldBeDefault,
                content: baseContent,
            },
            include: { template: true },
        });

        return res.status(201).json({
            id: newResume.id,
            name: newResume.name,
            userId: newResume.userId,
            isDefault: newResume.isDefault,
            createdAt: newResume.createdAt,
            lastModified: newResume.lastModified,
            template: {
                id: newResume.template.id,
                name: newResume.template.name,
                type: newResume.template.type,
                preview: newResume.template.preview,
            },
            content: newResume.content,
        });
    } catch (err: any) {
        return res.status(500).json({
            error: 'Failed to create resume',
            details: err?.message,
        });
    }
}

export async function getResumeById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const resume = await prisma.resume.findUnique({
            where: { id },
            include: { template: true },
        });

        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        return res.status(200).json({
            id: resume.id,
            name: resume.name,
            userId: resume.userId,
            isDefault: resume.isDefault,
            createdAt: resume.createdAt,
            lastModified: resume.lastModified,
            template: {
                id: resume.template.id,
                name: resume.template.name,
                type: resume.template.type,
                preview: resume.template.preview,
            },
            content: resume.content,
        });
    } catch (err: any) {
        return res.status(500).json({
            error: 'Failed to fetch resume',
            details: err?.message,
        });
    }
}

export async function updateResume(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name, content } = req.body;

        let updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (content !== undefined) updateData.content = content;

        const updated = await prisma.resume.update({
            where: { id },
            data: { ...updateData, lastModified: new Date() },
            include: { template: true },
        });

        return res.status(200).json({
            id: updated.id,
            name: updated.name,
            userId: updated.userId,
            isDefault: updated.isDefault,
            createdAt: updated.createdAt,
            lastModified: updated.lastModified,
            template: {
                id: updated.template.id,
                name: updated.template.name,
                type: updated.template.type,
                preview: updated.template.preview,
            },
            content: updated.content,
        });
    } catch (err: any) {
        return res.status(500).json({
            error: 'Failed to update resume',
            details: err?.message,
        });
    }
}

export async function deleteResume(req: Request, res: Response) {
    try {
        const { id } = req.params;
        await prisma.resume.delete({ where: { id } });
        return res.status(204).send();
    } catch (err: any) {
        return res.status(500).json({
            error: 'Failed to delete resume',
            details: err?.message,
        });
    }
}

export async function setDefaultResume(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const targetResume = await prisma.resume.findUnique({
            where: { id },
        });

        if (!targetResume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const userId = targetResume.userId;

        await prisma.resume.updateMany({
            where: { userId, NOT: { id } },
            data: { isDefault: false },
        });

        const updated = await prisma.resume.update({
            where: { id },
            data: { isDefault: true, lastModified: new Date() },
            include: { template: true },
        });

        return res.status(200).json({
            id: updated.id,
            name: updated.name,
            userId: updated.userId,
            isDefault: updated.isDefault,
            createdAt: updated.createdAt,
            lastModified: updated.lastModified,
            template: {
                id: updated.template.id,
                name: updated.template.name,
                type: updated.template.type,
                preview: updated.template.preview,
            },
            content: updated.content,
        });
    } catch (err: any) {
        return res.status(500).json({
            error: 'Failed to set default resume',
            details: err?.message,
        });
    }
}