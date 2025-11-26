export const validateProfessionalContact = (
    data: any
): Array<{ field: string; message: string }> => {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.userId) {
        errors.push({ field: 'userId', message: 'User ID is required' });
    }

    if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim() === '') {
        errors.push({ field: 'fullName', message: 'Full name is required' });
    } else if (data.fullName.length > 255) {
        errors.push({
            field: 'fullName',
            message: 'Full name must be less than 255 characters',
        });
    }

    if (data.firstName && data.firstName.length > 100) {
        errors.push({
            field: 'firstName',
            message: 'First name must be less than 100 characters',
        });
    }

    if (data.lastName && data.lastName.length > 100) {
        errors.push({
            field: 'lastName',
            message: 'Last name must be less than 100 characters',
        });
    }

    if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
        errors.push({
            field: 'email',
            message: 'Email is required',
        });
    } else if (data.email.length > 255) {
        errors.push({
            field: 'email',
            message: 'Email must be less than 255 characters',
        });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push({
            field: 'email',
            message: 'Email must be a valid email address',
        });
    }

    if (data.phone && data.phone.length > 50) {
        errors.push({
            field: 'phone',
            message: 'Phone must be less than 50 characters',
        });
    }

    if (data.linkedinUrl && data.linkedinUrl.length > 500) {
        errors.push({
            field: 'linkedinUrl',
            message: 'LinkedIn URL must be less than 500 characters',
        });
    }

    if (data.websiteUrl && data.websiteUrl.length > 500) {
        errors.push({
            field: 'websiteUrl',
            message: 'Website URL must be less than 500 characters',
        });
    }

    if (data.company && data.company.length > 255) {
        errors.push({
            field: 'company',
            message: 'Company must be less than 255 characters',
        });
    }

    if (data.jobTitle && data.jobTitle.length > 255) {
        errors.push({
            field: 'jobTitle',
            message: 'Job title must be less than 255 characters',
        });
    }

    if (data.industry && data.industry.length > 100) {
        errors.push({
            field: 'industry',
            message: 'Industry must be less than 100 characters',
        });
    }

    if (data.relationshipType && data.relationshipType.length > 50) {
        errors.push({
            field: 'relationshipType',
            message: 'Relationship type must be less than 50 characters',
        });
    }

    if (
        data.relationshipStrength !== undefined &&
        data.relationshipStrength !== null
    ) {
        const strength = parseInt(data.relationshipStrength);
        if (isNaN(strength) || strength < 0 || strength > 100) {
            errors.push({
                field: 'relationshipStrength',
                message: 'Relationship strength must be between 0 and 100',
            });
        }
    }

    return errors;
};

export const validateProfessionalContactUpdate = (
    data: any
): Array<{ field: string; message: string }> => {
    const errors: Array<{ field: string; message: string }> = [];

    if (data.fullName !== undefined) {
        if (typeof data.fullName !== 'string' || data.fullName.trim() === '') {
            errors.push({
                field: 'fullName',
                message: 'Full name cannot be empty',
            });
        } else if (data.fullName.length > 255) {
            errors.push({
                field: 'fullName',
                message: 'Full name must be less than 255 characters',
            });
        }
    }

    if (data.firstName !== undefined && data.firstName && data.firstName.length > 100) {
        errors.push({
            field: 'firstName',
            message: 'First name must be less than 100 characters',
        });
    }

    if (data.lastName !== undefined && data.lastName && data.lastName.length > 100) {
        errors.push({
            field: 'lastName',
            message: 'Last name must be less than 100 characters',
        });
    }

    if (data.email !== undefined && data.email && data.email.length > 255) {
        errors.push({
            field: 'email',
            message: 'Email must be less than 255 characters',
        });
    }

    if (data.phone !== undefined && data.phone && data.phone.length > 50) {
        errors.push({
            field: 'phone',
            message: 'Phone must be less than 50 characters',
        });
    }

    if (data.linkedinUrl !== undefined && data.linkedinUrl && data.linkedinUrl.length > 500) {
        errors.push({
            field: 'linkedinUrl',
            message: 'LinkedIn URL must be less than 500 characters',
        });
    }

    if (data.websiteUrl !== undefined && data.websiteUrl && data.websiteUrl.length > 500) {
        errors.push({
            field: 'websiteUrl',
            message: 'Website URL must be less than 500 characters',
        });
    }

    if (data.company !== undefined && data.company && data.company.length > 255) {
        errors.push({
            field: 'company',
            message: 'Company must be less than 255 characters',
        });
    }

    if (data.jobTitle !== undefined && data.jobTitle && data.jobTitle.length > 255) {
        errors.push({
            field: 'jobTitle',
            message: 'Job title must be less than 255 characters',
        });
    }

    if (data.industry !== undefined && data.industry && data.industry.length > 100) {
        errors.push({
            field: 'industry',
            message: 'Industry must be less than 100 characters',
        });
    }

    if (
        data.relationshipStrength !== undefined &&
        data.relationshipStrength !== null
    ) {
        const strength = parseInt(data.relationshipStrength);
        if (isNaN(strength) || strength < 0 || strength > 100) {
            errors.push({
                field: 'relationshipStrength',
                message: 'Relationship strength must be between 0 and 100',
            });
        }
    }

    return errors;
};

export const validateContactInteraction = (
    data: any
): Array<{ field: string; message: string }> => {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.contactId) {
        errors.push({ field: 'contactId', message: 'Contact ID is required' });
    }

    if (!data.interactionType || typeof data.interactionType !== 'string' || data.interactionType.trim() === '') {
        errors.push({
            field: 'interactionType',
            message: 'Interaction type is required',
        });
    } else if (data.interactionType.length > 50) {
        errors.push({
            field: 'interactionType',
            message: 'Interaction type must be less than 50 characters',
        });
    }

    if (!data.interactionDate) {
        errors.push({
            field: 'interactionDate',
            message: 'Interaction date is required',
        });
    }

    if (data.outcome && data.outcome.length > 255) {
        errors.push({
            field: 'outcome',
            message: 'Outcome must be less than 255 characters',
        });
    }

    return errors;
};


