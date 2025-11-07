// services/llm/prompts/resume.prompts.ts
import { ResumeInput } from "../../../types/ai.types";

export const buildResumeTailoringPrompt = (input: ResumeInput): string => {
  const { userProfile, workExperiences, education, skills, jobDescription } =
    input;

  return `You are an expert resume writer and career coach. Your task is to tailor a resume to match a specific job description while maintaining honesty and accuracy.

**Candidate Profile:**
Name: ${userProfile.firstName} ${userProfile.lastName}
Email: ${userProfile.email}
Phone: ${userProfile.phone}
Location: ${userProfile.location}
${userProfile.headline ? `Headline: ${userProfile.headline}` : ""}
${userProfile.bio ? `Bio: ${userProfile.bio}` : ""}

**Work Experience:**
${workExperiences
  .map(
    (exp, idx) => `
${idx + 1}. ${exp.positionTitle} at ${exp.companyName}
   ${exp.startDate} - ${exp.endDate || "Present"}
   ${exp.description}
`
  )
  .join("\n")}

**Education:**
${education
  .map(
    (edu, idx) => `
${idx + 1}. ${edu.degreeType} in ${edu.major}
   ${edu.institutionName}
   ${edu.graduationDate ? `Graduated: ${edu.graduationDate}` : "In Progress"}
`
  )
  .join("\n")}

**Skills:**
${skills
  .map(
    (s) =>
      `- ${s.skillName}${s.proficiencyLevel ? ` (${s.proficiencyLevel})` : ""}`
  )
  .join("\n")}

**Target Job Description:**
${jobDescription}

**Instructions:**
1. Create a professional summary that highlights the most relevant qualifications for this specific job
2. Rewrite work experience bullet points to emphasize achievements and responsibilities that match the job requirements
3. Use action verbs and quantify achievements where possible
4. Categorize skills into technical, soft, and most relevant for this position
5. Maintain all factual information - do not fabricate experience or skills
6. Use keywords from the job description naturally throughout the resume
7. Keep bullet points concise (1-2 lines each)

Tailor this resume to maximize relevance for the target position.`;
};

export const resumeSystemPrompt = `You are an expert ATS-optimized resume writer. You specialize in:
- Tailoring resumes to specific job descriptions
- Using industry-standard keywords and phrases
- Writing achievement-focused bullet points with metrics
- Ensuring resumes pass Applicant Tracking Systems (ATS)
- Maintaining professional tone and formatting

Always be honest and never fabricate information. Only optimize and reframe existing experience.`;
