// services/llm/prompts/coverLetter.prompts.ts
import { CoverLetterInput } from "../../../types/ai.types";

export const buildCoverLetterPrompt = (input: CoverLetterInput): string => {
  const {
    userProfile,
    targetJob,
    relevantExperience,
    relevantSkills,
    tone = "formal",
    culture = "corporate",
    length = "standard",
    writingStyle = "direct",
    customInstructions,
    personalityLevel = "moderate"
  } = input;

  // Tone-specific instructions
  const toneInstructions = {
    formal: "Use formal, professional language. Avoid contractions. Be respectful and traditional in your approach.",
    casual: "Use a friendly, conversational tone. Feel free to use contractions. Be approachable while remaining professional.",
    enthusiastic: "Show genuine excitement and passion. Use energetic language and express strong interest in the opportunity.",
    analytical: "Focus on data, achievements, and concrete results. Be objective and highlight measurable impacts."
  };

  // Culture-specific instructions
  const cultureInstructions = {
    startup: "Match a startup culture: innovative, fast-paced, collaborative. Use 'Hi' instead of 'Dear' for greeting. Keep language modern and dynamic.",
    corporate: "Match a corporate culture: professional, structured, traditional. Use 'Dear' for greeting. Emphasize reliability and proven track record."
  };

  // Length-specific instructions
  const lengthInstructions = {
    brief: "Keep it concise and impactful. Aim for 2-3 short paragraphs (150-200 words total). Focus only on the most critical qualifications.",
    standard: "Write a balanced cover letter with 3-4 paragraphs (250-350 words total). Include key experiences and qualifications.",
    detailed: "Provide comprehensive coverage with 4-5 paragraphs (400-500 words total). Elaborate on multiple experiences, achievements, and how they align with the role."
  };

  // Writing style instructions
  const styleInstructions = {
    direct: "Use clear, straightforward sentences. Get to the point quickly. Use active voice and strong action verbs.",
    narrative: "Tell a story about your career journey. Use transitions to connect experiences. Create a cohesive narrative arc.",
    "bullet-points": "After the opening, use bullet points to highlight key qualifications and achievements. Keep each bullet concise and impactful."
  };

  // Personality level instructions
  const personalityInstructions = {
    minimal: "Keep personality subtle. Focus primarily on qualifications and fit. Maintain strictly professional tone throughout.",
    moderate: "Show some personality while keeping it professional. Include 1-2 personal touches that demonstrate genuine interest and cultural fit.",
    strong: "Let personality shine through. Use distinctive language, share brief anecdotes, and show enthusiasm. Make the letter memorable while remaining professional."
  };

  // Industry-specific terminology guidance
  const industryGuidance = targetJob.industry
    ? `\n**Industry Context:** ${targetJob.industry}\nUse industry-appropriate terminology and demonstrate knowledge of ${targetJob.industry} trends, challenges, and best practices.`
    : "";

  // Company research integration
  const companyResearch = [];
  if (targetJob.companyBackground) {
    companyResearch.push(`**Company Background:**\n${targetJob.companyBackground}`);
  }
  if (targetJob.recentNews) {
    companyResearch.push(`**Recent Company News/Achievements:**\n${targetJob.recentNews}\nIMPORTANT: Reference these achievements naturally to show you've done your research.`);
  }
  if (targetJob.companyMission) {
    companyResearch.push(`**Company Mission/Values:**\n${targetJob.companyMission}\nIMPORTANT: Show alignment between your values and the company's mission.`);
  }
  if (targetJob.companyInitiatives) {
    companyResearch.push(`**Specific Company Initiatives/Projects:**\n${targetJob.companyInitiatives}\nIMPORTANT: Mention relevant initiatives and explain how you can contribute to them.`);
  }
  if (targetJob.companySize) {
    companyResearch.push(`**Company Size/Scale:**\n${targetJob.companySize}\nUse this context to tailor your experience appropriately (startup agility vs enterprise scale).`);
  }
  if (targetJob.fundingInfo) {
    companyResearch.push(`**Recent Funding/Expansion:**\n${targetJob.fundingInfo}\nReference growth opportunities and how you can contribute to the company's expansion.`);
  }
  if (targetJob.competitiveLandscape) {
    companyResearch.push(`**Competitive Positioning:**\n${targetJob.competitiveLandscape}\nDemonstrate awareness of the company's market position and differentiation.`);
  }

  const companyResearchSection = companyResearch.length > 0
    ? `\n\n**=== COMPANY RESEARCH (CRITICAL) ===**\n${companyResearch.join("\n\n")}\n\n**Research Integration Guidelines:**\n- Weave company research naturally throughout the letter (don't create a separate research section)\n- Demonstrate genuine interest by referencing specific details\n- Show you understand the company's challenges and opportunities\n- Connect your experience to the company's current initiatives\n- Be authentic - avoid sounding like you're simply listing facts\n- Use research to explain WHY you want to work at THIS specific company`
    : "";

  // Custom instructions section
  const customSection = customInstructions
    ? `\n**Additional Custom Instructions:**\n${customInstructions}\n\nIMPORTANT: Follow these custom instructions carefully while maintaining the overall quality and professionalism of the letter.`
    : "";

  return `You are an expert cover letter writer. Create a compelling, personalized cover letter for the following job application.

**Candidate Information:**
Name: ${userProfile.firstName} ${userProfile.lastName}
Email: ${userProfile.email}
Phone: ${userProfile.phone}

**Target Position:**
Title: ${targetJob.title}
Company: ${targetJob.company}
${industryGuidance}

**Job Description:**
${targetJob.description}
${companyResearchSection}

**Relevant Experience:**
${relevantExperience.map((exp, idx) => `${idx + 1}. ${exp}`).join("\n")}

**Relevant Skills:**
${relevantSkills.join(", ")}

**Tone Preference:** ${tone}
${toneInstructions[tone]}

**Company Culture:** ${culture}
${cultureInstructions[culture]}

**Length:** ${length}
${lengthInstructions[length]}

**Writing Style:** ${writingStyle}
${styleInstructions[writingStyle]}

**Personality Level:** ${personalityLevel}
${personalityInstructions[personalityLevel]}
${customSection}

**Instructions:**
1. Write a professional cover letter with a clear structure matching ALL specified preferences
2. Open with enthusiasm for the specific role and company (adjust greeting based on culture)
3. Highlight the most relevant experiences that match job requirements
4. Demonstrate knowledge of the company and why you're a good fit
5. Incorporate industry-specific language if an industry is specified
6. Follow the specified length, writing style, and personality level precisely
7. End with a clear call to action appropriate to the tone
8. Ensure CONSISTENCY: The tone, culture, length, style, and personality should all work together naturally

CRITICAL: The final output must feel cohesive and natural, not like it's following a formula. All elements (tone, culture, length, style, personality) should blend seamlessly.`;
};

export const coverLetterSystemPrompt = `You are an expert career coach and professional cover letter writer. You specialize in:
- Creating personalized, compelling cover letters
- Matching candidate qualifications to job requirements
- Using persuasive but professional language
- Demonstrating genuine interest in the role and company
- Writing clear, concise, and impactful content

Always maintain a professional tone and avoid clichés like "I am writing to apply" or "passion for excellence."`;
