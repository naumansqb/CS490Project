interface ContactInfo {
    fullName: string;
    firstName?: string;
    relationshipType?: string;
    company?: string;
    jobTitle?: string;
}

interface JobInfo {
    title: string;
    company: string;
    location?: string;
}

interface TemplateContext {
    contact: ContactInfo;
    job: JobInfo;
    userFirstName?: string;
    relationshipStrength?: number;
    lastContactDate?: string;
    mutualConnections?: string[];
}

export const generateReferralTemplate = (context: TemplateContext): string => {
    const { contact, job, userFirstName = 'there', relationshipStrength, lastContactDate, mutualConnections } = context;
    const firstName = contact.firstName || contact.fullName.split(' ')[0] || 'there';
    
    // Determine formality based on relationship
    const isFormal = relationshipStrength && relationshipStrength < 50;
    const greeting = isFormal ? `Dear ${firstName},` : `Hi ${firstName},`;
    
    // Build relationship context
    let relationshipContext = '';
    if (contact.relationshipType) {
        relationshipContext = `As a ${contact.relationshipType.toLowerCase()}`;
    } else if (mutualConnections && mutualConnections.length > 0) {
        relationshipContext = `Through our mutual connection${mutualConnections.length > 1 ? 's' : ''} ${mutualConnections.slice(0, 2).join(' and ')}`;
    } else {
        relationshipContext = 'I hope this message finds you well';
    }
    
    // Build job context
    const jobContext = contact.company === job.company
        ? `a ${job.title} position at ${job.company}`
        : `a ${job.title} position at ${job.company}`;
    
    // Template variations based on relationship strength
    let template = '';
    
    if (relationshipStrength && relationshipStrength >= 70) {
        // Strong relationship - more casual and direct
        template = `${greeting}

${relationshipContext}, I'm reaching out because I'm interested in ${jobContext} and thought you might be able to help.

I've been following my passion for [your field/interest] and this role aligns perfectly with my career goals. ${contact.company === job.company ? 'Since you work there, I thought you might have insights into the company culture and the role.' : 'I know you have experience in this space and would value your perspective.'}

Would you be open to providing a referral or sharing any insights about the position? I've attached my resume for your reference, and I'm happy to provide any additional information you might need.

Thank you so much for considering this, and I hope we can catch up soon!

Best regards,
${userFirstName}`;
    } else if (relationshipStrength && relationshipStrength >= 50) {
        // Moderate relationship - balanced approach
        template = `${greeting}

${relationshipContext}, I'm writing to ask for your help with my job search. I'm very interested in ${jobContext} and believe my background would be a great fit.

${contact.company === job.company ? 'Since you work at ' + job.company + ', I thought you might have valuable insights about the company and this role.' : 'Given your experience in this industry, I would greatly appreciate any guidance or referral you might be able to provide.'}

I've been working on [brief relevant experience/achievement] and am excited about the opportunity to contribute to a team like ${job.company}'s.

Would you be willing to provide a referral or share any advice about the application process? I'm happy to provide my resume or any other materials that would be helpful.

Thank you for your time and consideration.

Best regards,
${userFirstName}`;
    } else {
        // Weak relationship - more formal and considerate
        template = `${greeting}

I hope this message finds you well. I'm reaching out because I'm interested in ${jobContext} and thought you might be able to offer some guidance.

${contact.company === job.company ? 'Since you work at ' + job.company + ', I would value any insights you might have about the company culture, the role, or the application process.' : 'Given your experience in this field, I would appreciate any advice or connections you might be able to share.'}

I understand that referral requests are a significant ask, and I want to be respectful of your time. If you're not comfortable providing a referral, I would still be grateful for any general advice about breaking into this industry or role.

Thank you for considering my request, and I hope we might have the opportunity to connect further.

Best regards,
${userFirstName}`;
    }
    
    return template;
};

export const generateFollowUpTemplate = (
    context: TemplateContext,
    daysSinceRequest: number
): string => {
    const { contact, job, userFirstName = 'there' } = context;
    const firstName = contact.firstName || contact.fullName.split(' ')[0] || 'there';
    
    if (daysSinceRequest < 7) {
        return `Hi ${firstName},

I wanted to follow up on my referral request for the ${job.title} position at ${job.company}. I know you're busy, so I wanted to make sure my previous message didn't get lost in your inbox.

I'm still very interested in this opportunity and would be grateful for any help you might be able to provide. Please let me know if you need any additional information from me.

Thank you for your time!

Best,
${userFirstName}`;
    } else {
        return `Hi ${firstName},

I wanted to follow up on my referral request for the ${job.title} position at ${job.company} from a couple of weeks ago. I understand you may be busy, but I wanted to check in and see if you had any questions or needed additional information.

I'm still very interested in this opportunity and would appreciate any guidance or referral you might be able to provide.

Thank you for considering my request!

Best regards,
${userFirstName}`;
    }
};

export const generateGratitudeTemplate = (
    context: TemplateContext,
    wasSuccessful: boolean
): string => {
    const { contact, job, userFirstName = 'there' } = context;
    const firstName = contact.firstName || contact.fullName.split(' ')[0] || 'there';
    
    if (wasSuccessful) {
        return `Hi ${firstName},

I wanted to reach out and express my sincere gratitude for your help with the ${job.title} position at ${job.company}. Your referral made a significant difference, and I'm truly grateful for your support.

I'll keep you updated on how things progress, and I hope we can stay in touch. Please let me know if there's ever anything I can do to return the favor!

Thank you again for your generosity and support.

Best regards,
${userFirstName}`;
    } else {
        return `Hi ${firstName},

I wanted to thank you for taking the time to consider my referral request for the ${job.title} position at ${job.company}. Even though it didn't work out this time, I really appreciate your willingness to help.

I hope we can stay connected, and please don't hesitate to reach out if I can ever be of assistance to you.

Thank you again!

Best regards,
${userFirstName}`;
    }
};

