export const referralTemplateSystemPrompt = `You are an expert professional networking and referral request writer. Your task is to create personalized, professional, and effective referral request messages that:

1. Are warm and relationship-appropriate
2. Clearly communicate the job opportunity and why the candidate is a good fit
3. Show genuine appreciation for the contact's time and help
4. Are concise but comprehensive (2-3 paragraphs)
5. Include specific details about the candidate's background and the role
6. Maintain professional tone while being personable
7. Make it easy for the contact to help by providing clear context

Generate referral request messages that feel authentic and tailored to the relationship strength and context provided.`;

export function buildReferralTemplatePrompt(input: {
  userProfile: any;
  contactName: string;
  contactCompany?: string;
  contactJobTitle?: string;
  relationshipStrength?: number;
  relationshipType?: string;
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  templateStyle?: 'professional' | 'casual' | 'warm' | 'direct';
}): string {
  const {
    userProfile,
    contactName,
    contactCompany,
    contactJobTitle,
    relationshipStrength,
    relationshipType,
    jobTitle,
    companyName,
    jobDescription,
    templateStyle = 'professional',
  } = input;

  const userName = userProfile?.fullName || 
    (userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : null) ||
    userProfile?.name || 
    '[Your Name]';

  const userBio = userProfile?.bio || userProfile?.headline || '';
  const userLocation = (userProfile?.locationCity && userProfile?.locationState 
    ? `${userProfile.locationCity}, ${userProfile.locationState}` 
    : null) || userProfile?.location || '';

  let relationshipContext = '';
  if (relationshipStrength !== undefined) {
    if (relationshipStrength >= 8) {
      relationshipContext = 'We have a very strong professional relationship';
    } else if (relationshipStrength >= 6) {
      relationshipContext = 'We have a good professional relationship';
    } else if (relationshipStrength >= 4) {
      relationshipContext = 'We have a professional connection';
    } else {
      relationshipContext = 'We are professional acquaintances';
    }
  }

  if (relationshipType) {
    relationshipContext += ` (${relationshipType})`;
  }

  const styleGuidance = {
    professional: 'Use a formal, business-appropriate tone. Be respectful and courteous.',
    casual: 'Use a more relaxed, friendly tone while maintaining professionalism.',
    warm: 'Use a warm, personal tone that emphasizes the relationship.',
    direct: 'Be concise and straightforward, getting to the point quickly.',
  }[templateStyle];

  return `Generate a personalized referral request message with the following details:

CANDIDATE INFORMATION:
- Name: ${userName}
- Location: ${userLocation}
- Background: ${userBio || 'Experienced professional'}

CONTACT INFORMATION:
- Name: ${contactName}
${contactCompany ? `- Company: ${contactCompany}` : ''}
${contactJobTitle ? `- Title: ${contactJobTitle}` : ''}
${relationshipContext ? `- Relationship: ${relationshipContext}` : ''}

JOB OPPORTUNITY:
- Position: ${jobTitle}
- Company: ${companyName}
${jobDescription ? `- Description: ${jobDescription.substring(0, 500)}` : ''}

STYLE GUIDANCE:
${styleGuidance}

REQUIREMENTS:
1. Address the contact by name (${contactName})
2. Open with a warm greeting that acknowledges your relationship
3. Briefly introduce yourself and your current situation (if relationship is not strong)
4. Clearly describe the job opportunity (${jobTitle} at ${companyName})
5. Explain why you're interested and qualified for this role
6. Make a clear but respectful request for a referral
7. Offer to provide additional information (resume, portfolio, etc.)
8. Express gratitude and appreciation
9. Close professionally with your name

The message should be 2-3 paragraphs, professional yet personable, and tailored to the relationship strength. Make it feel authentic and not templated.`;
}

