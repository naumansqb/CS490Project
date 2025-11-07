// services/llm/prompts/coverLetter.prompts.ts
import { CoverLetterInput } from "../../../types/ai.types";

export const buildCoverLetterPrompt = (input: CoverLetterInput): string => {
  const { userProfile, targetJob, relevantExperience, relevantSkills } = input;

  return `You are an expert cover letter writer. Create a compelling, personalized cover letter for the following job application.

**Candidate Information:**
Name: ${userProfile.firstName} ${userProfile.lastName}
Email: ${userProfile.email}
Phone: ${userProfile.phone}

**Target Position:**
Title: ${targetJob.title}
Company: ${targetJob.company}

**Job Description:**
${targetJob.description}

**Relevant Experience:**
${relevantExperience.map((exp, idx) => `${idx + 1}. ${exp}`).join("\n")}

**Relevant Skills:**
${relevantSkills.join(", ")}

**Instructions:**
1. Write a professional cover letter with a clear structure
2. Open with enthusiasm for the specific role and company
3. Highlight 2-3 most relevant experiences that match job requirements
4. Demonstrate knowledge of the company and why you're a good fit
5. Use a confident but not arrogant tone
6. Keep it concise (3-4 paragraphs in body)
7. End with a clear call to action
8. Use professional business letter format

Make it personalized and compelling, not generic.`;
};

export const coverLetterSystemPrompt = `You are an expert career coach and professional cover letter writer. You specialize in:
- Creating personalized, compelling cover letters
- Matching candidate qualifications to job requirements
- Using persuasive but professional language
- Demonstrating genuine interest in the role and company
- Writing clear, concise, and impactful content

Always maintain a professional tone and avoid clichés like "I am writing to apply" or "passion for excellence."`;
