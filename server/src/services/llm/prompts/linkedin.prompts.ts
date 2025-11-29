export const linkedinMessageSystemPrompt = `You are an expert LinkedIn networking and professional communication specialist. Your task is to create personalized, professional LinkedIn messages that:

1. Are appropriate for the relationship level and context
2. Are concise and engaging (LinkedIn messages should be brief)
3. Clearly communicate the purpose and value proposition
4. Show genuine interest and professionalism
5. Include a clear call-to-action when appropriate
6. Respect LinkedIn's communication best practices
7. Are personalized and avoid sounding templated

Generate LinkedIn messages that are authentic, professional, and effective for building and maintaining professional relationships.`;

export function buildLinkedInMessagePrompt(input: {
  userProfile: any;
  contactName: string;
  contactCompany?: string;
  contactJobTitle?: string;
  relationshipStrength?: number;
  relationshipType?: string;
  messagePurpose: string;
  context?: string;
  tone?: string;
}): string {
  const {
    userProfile,
    contactName,
    contactCompany,
    contactJobTitle,
    relationshipStrength,
    relationshipType,
    messagePurpose,
    context,
    tone = 'professional',
  } = input;

  const userName = userProfile?.fullName || 
    (userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : null) ||
    '[Your Name]';

  const userHeadline = userProfile?.headline || '';
  const userIndustry = userProfile?.industry || '';

  let relationshipContext = '';
  if (relationshipStrength !== undefined) {
    if (relationshipStrength >= 8) {
      relationshipContext = 'very strong professional relationship';
    } else if (relationshipStrength >= 6) {
      relationshipContext = 'good professional relationship';
    } else if (relationshipStrength >= 4) {
      relationshipContext = 'professional connection';
    } else {
      relationshipContext = 'professional acquaintance or new connection';
    }
  }

  if (relationshipType) {
    relationshipContext += ` (${relationshipType})`;
  }

  const purposeGuidance = {
    connection_request: 'Request to connect on LinkedIn. Be warm, mention why you want to connect, and add value.',
    follow_up: 'Follow up on a previous conversation or meeting. Reference the previous interaction.',
    informational_interview: 'Request an informational interview. Be respectful of their time and explain what you hope to learn.',
    referral_request: 'Request a referral for a job opportunity. Be clear about the role and why you\'re a good fit.',
    thank_you: 'Express gratitude for help, referral, or time. Be specific about what you\'re thanking them for.',
    check_in: 'Maintain relationship with a periodic check-in. Be genuine and show interest in their work.',
  }[messagePurpose] || 'Professional communication';

  const toneGuidance = {
    professional: 'Use a formal, business-appropriate tone.',
    casual: 'Use a more relaxed, friendly tone while maintaining professionalism.',
    warm: 'Use a warm, personal tone that emphasizes the relationship.',
    direct: 'Be concise and straightforward, getting to the point quickly.',
  }[tone] || '';

  return `Generate a personalized LinkedIn message with the following details:

YOUR PROFILE:
- Name: ${userName}
- Headline: ${userHeadline || 'Professional'}
- Industry: ${userIndustry || 'Not specified'}

CONTACT INFORMATION:
- Name: ${contactName}
${contactCompany ? `- Company: ${contactCompany}` : ''}
${contactJobTitle ? `- Title: ${contactJobTitle}` : ''}
${relationshipContext ? `- Relationship: ${relationshipContext}` : ''}

MESSAGE PURPOSE:
${purposeGuidance}
${context ? `- Additional Context: ${context}` : ''}

STYLE GUIDANCE:
${toneGuidance}
- Keep the message concise (2-3 short paragraphs maximum for LinkedIn)
- Be authentic and personalized
- Include a clear call-to-action when appropriate
- Show genuine interest and value

REQUIREMENTS:
1. Start with a warm, personalized greeting
2. Clearly state the purpose of your message
3. Provide relevant context about yourself or the situation
4. Make a clear request or call-to-action (if applicable)
5. Express appreciation or value proposition
6. Close professionally

The message should be LinkedIn-appropriate: concise, professional, and engaging. Avoid being too long or overly formal.`;
}

export const linkedinOptimizationSystemPrompt = `You are a LinkedIn profile optimization expert and career strategist. Your task is to provide actionable recommendations for optimizing LinkedIn profiles to:

1. Increase visibility and discoverability
2. Attract the right opportunities (recruiters, connections, job offers)
3. Showcase professional value and expertise
4. Optimize for LinkedIn's search algorithm
5. Follow LinkedIn best practices and current trends
6. Align profile with career goals and target roles

Provide specific, actionable recommendations that are tailored to the user's background and goals.`;

export function buildLinkedInOptimizationPrompt(input: {
  userProfile: any;
  targetRole?: string;
  targetIndustry?: string;
}): string {
  const { userProfile, targetRole, targetIndustry } = input;

  const workExp = userProfile?.workExperiences?.map((exp: any) => 
    `${exp.positionTitle} at ${exp.companyName}${exp.description ? ` - ${exp.description.substring(0, 100)}` : ''}`
  ).join('\n') || 'No work experience listed';

  const skills = userProfile?.skills?.map((s: any) => s.skillName).join(', ') || 'No skills listed';
  const education = userProfile?.education?.map((e: any) => 
    `${e.degreeType}${e.major ? ` in ${e.major}` : ''} from ${e.institutionName}`
  ).join('\n') || 'No education listed';

  return `Analyze and provide optimization recommendations for this LinkedIn profile:

CURRENT PROFILE:
- Name: ${userProfile?.firstName || ''} ${userProfile?.lastName || ''}
- Headline: ${userProfile?.headline || 'Not set'}
- Summary/Bio: ${userProfile?.bio || 'Not set'}
- Industry: ${userProfile?.industry || 'Not specified'}

WORK EXPERIENCE:
${workExp}

SKILLS:
${skills}

EDUCATION:
${education}

TARGET GOALS:
${targetRole ? `- Target Role: ${targetRole}` : ''}
${targetIndustry ? `- Target Industry: ${targetIndustry}` : ''}

Provide recommendations for:
1. Headline optimization (3-5 suggestions that are keyword-rich and compelling)
2. Summary/Bio optimization (2-3 suggestions that tell a compelling story)
3. Profile completeness analysis (score 0-100, missing sections, recommendations)
4. Keyword optimization (suggested keywords, current keywords found, missing important keywords)
5. Best practices specific to their industry and goals

Focus on actionable, specific recommendations that will improve profile visibility and attract the right opportunities.`;
}

export const networkingStrategySystemPrompt = `You are a professional networking strategist and career development expert. Your task is to create comprehensive networking strategies that:

1. Are tailored to the user's industry, goals, and background
2. Provide actionable, step-by-step approaches
3. Include specific connection request templates for different scenarios
4. Identify target connection types and how to approach them
5. Set realistic timelines and milestones
6. Focus on building genuine, mutually beneficial relationships

Generate strategic networking plans that are practical, personalized, and effective.`;

export function buildNetworkingStrategyPrompt(input: {
  userProfile: any;
  targetCompanies?: string[];
  targetRoles?: string[];
  networkingGoals: string[];
}): string {
  const { userProfile, targetCompanies, targetRoles, networkingGoals } = input;

  return `Create a comprehensive networking strategy with the following context:

USER BACKGROUND:
- Industry: ${userProfile?.industry || 'Not specified'}
- Headline: ${userProfile?.headline || 'Professional'}
- Skills: ${userProfile?.skills?.map((s: any) => s.skillName).join(', ') || 'Not listed'}

NETWORKING GOALS:
${networkingGoals.map(g => `- ${g}`).join('\n')}

TARGET COMPANIES:
${targetCompanies && targetCompanies.length > 0 ? targetCompanies.map(c => `- ${c}`).join('\n') : 'Not specified'}

TARGET ROLES:
${targetRoles && targetRoles.length > 0 ? targetRoles.map(r => `- ${r}`).join('\n') : 'Not specified'}

Provide:
1. 3-5 strategic networking approaches with descriptions and action items
2. Connection request templates for different scenarios (cold outreach, mutual connections, alumni, etc.)
3. Target connection types (recruiters, hiring managers, industry leaders, peers, etc.) with specific approaches
4. Timeline recommendations for each strategy

Make the strategies actionable, specific, and tailored to their goals.`;
}

export const contentSharingSystemPrompt = `You are a LinkedIn content strategy expert and social media professional. Your task is to provide content sharing strategies that:

1. Increase profile visibility and engagement
2. Establish thought leadership and expertise
3. Build a professional brand
4. Attract the right audience (recruiters, connections, opportunities)
5. Follow LinkedIn best practices and algorithm optimization
6. Are tailored to the user's industry and goals

Provide specific, actionable content strategies that are practical and effective.`;

export function buildContentSharingStrategyPrompt(input: {
  userProfile: any;
  goals: string[];
  targetAudience: string;
}): string {
  const { userProfile, goals, targetAudience } = input;

  return `Create a LinkedIn content sharing strategy with the following context:

USER PROFILE:
- Industry: ${userProfile?.industry || 'Not specified'}
- Headline: ${userProfile?.headline || 'Professional'}
- Skills: ${userProfile?.skills?.map((s: any) => s.skillName).join(', ') || 'Not listed'}

CONTENT GOALS:
${goals.map(g => `- ${g}`).join('\n')}

TARGET AUDIENCE:
${targetAudience}

Provide:
1. Recommended content types (articles, posts, videos, etc.) with descriptions, examples, and best practices
2. Posting schedule recommendations (frequency, best times, day-of-week patterns)
3. Engagement strategies (how to interact with others' content, comments, shares)
4. Visibility tips (hashtags, keywords, profile optimization for content discovery)

Make recommendations specific to their industry and goals.`;
}

export const networkingCampaignSystemPrompt = `You are a professional networking campaign strategist. Your task is to create structured networking campaigns that:

1. Have clear goals and measurable outcomes
2. Are organized into phases with specific activities
3. Include personalized outreach templates
4. Define tracking metrics and success criteria
5. Set realistic timelines
6. Focus on building meaningful professional relationships

Generate comprehensive networking campaigns that are strategic, actionable, and trackable.`;

export function buildNetworkingCampaignPrompt(input: {
  campaignName: string;
  targetCompanies: string[];
  targetRoles: string[];
  targetIndustries?: string[];
  goals: string[];
  timeline: string;
  userProfile: any;
}): string {
  const { campaignName, targetCompanies, targetRoles, targetIndustries, goals, timeline, userProfile } = input;

  return `Create a structured networking campaign with the following details:

CAMPAIGN NAME:
${campaignName}

USER BACKGROUND:
- Industry: ${userProfile?.industry || 'Not specified'}
- Headline: ${userProfile?.headline || 'Professional'}
- Skills: ${userProfile?.skills?.map((s: any) => s.skillName).join(', ') || 'Not listed'}

TARGET COMPANIES:
${targetCompanies.map(c => `- ${c}`).join('\n')}

TARGET ROLES:
${targetRoles.map(r => `- ${r}`).join('\n')}

${targetIndustries && targetIndustries.length > 0 ? `TARGET INDUSTRIES:\n${targetIndustries.map(i => `- ${i}`).join('\n')}` : ''}

CAMPAIGN GOALS:
${goals.map(g => `- ${g}`).join('\n')}

TIMELINE:
${timeline}

Provide:
1. Campaign strategy overview
2. Phased approach (3-4 phases) with duration, activities, and goals for each phase
3. Outreach templates for different scenarios (connection requests, follow-ups, informational interview requests)
4. Tracking metrics (response rate, connection acceptance, meetings scheduled, etc.)
5. Success criteria and KPIs

Make the campaign structured, actionable, and trackable.`;
}


