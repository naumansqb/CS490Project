// services/llm/prompts/resume.prompts.ts
export const buildResumeTailoringPrompt = (input: any): string => {
  const { userProfile, workExperiences, education, skills, certifications, projects, jobDescription, templateType, templateName, userSelectedSkills, currentResumeSummary } =
    input;

  const isUsingExistingResume = !!currentResumeSummary;

  // Template-specific instructions
  const templateInstructions = {
    chronological: `
**TEMPLATE: CHRONOLOGICAL** (Reference: /chronological-resume.png)
- Focus on work history in reverse chronological order
- Include relevant sections: Certifications, Projects, Volunteer Work if available
- Emphasize career progression and growth
- Keep it clean and professional
`,
    functional: `
**TEMPLATE: FUNCTIONAL** (Reference: /functional-resume.png)
- Group by SKILL CATEGORIES (3-4 main categories)
- Each skill should have 2-3 bullet points demonstrating that skill
- De-emphasize chronological work history
- Perfect for career changers or highlighting specific expertise
- For each skill, provide a brief description (1-2 sentences) of proficiency level
`,
    hybrid: `
**TEMPLATE: HYBRID/COMBINATION** (Reference: /hybrid-resume.png)
- Combine skills summary at top with chronological work history
- Start with 3-4 key skill areas with descriptions
- Each skill area needs 2-3 accomplishment statements
- Follow with detailed work experience
- Provide DESCRIPTIONS for each skill (not just listing them)
`,
  };

  const templateTypeLower = (templateType || templateName || 'chronological').toLowerCase();
  const templateGuide =
    templateTypeLower.includes('functional') ? templateInstructions.functional :
      templateTypeLower.includes('hybrid') || templateTypeLower.includes('combination') ? templateInstructions.hybrid :
        templateInstructions.chronological;

  return `You are an expert resume writer and ATS optimization specialist. Your task is to tailor a resume to match a specific job description while maintaining honesty and accuracy.

${templateGuide}

${isUsingExistingResume ? `
**IMPORTANT**: This user has an EXISTING resume with content. Your task is to ENHANCE and TAILOR the existing content, not replace it with generic profile data. Keep the structure and detail they already have, just optimize it for the job.

**Current Resume Summary:**
${currentResumeSummary}
` : ''}

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
        (exp: any, idx: number) => `
${idx + 1}. ${exp.positionTitle} at ${exp.companyName}
   ${exp.startDate} - ${exp.endDate || "Present"}
   ${exp.description || "No description provided"}
`
      )
      .join("\n")}

**Education:**
${education
      .map(
        (edu: any, idx: number) => `
${idx + 1}. ${edu.degreeType} in ${edu.major}
   ${edu.institutionName}
   ${edu.graduationDate ? `Graduated: ${edu.graduationDate}` : "In Progress"}
`
      )
      .join("\n")}

**Skills Available:**
${userSelectedSkills && userSelectedSkills.length > 0 ? `
NOTE: User has specifically selected these ${userSelectedSkills.length} skills to highlight:
${skills
        .map(
          (s: any) =>
            `- ${s.skillName}${s.proficiencyLevel ? ` (${s.proficiencyLevel})` : ""}`
        )
        .join("\n")}
` : `
${skills
      .map(
        (s: any) =>
          `- ${s.skillName}${s.proficiencyLevel ? ` (${s.proficiencyLevel})` : ""}`
      )
      .join("\n")}`}

${certifications && certifications.length > 0 ? `
**Certifications:**
${certifications.map((cert: any, idx: number) => `${idx + 1}. ${cert.name} - ${cert.issuingOrganization} (${cert.issueDate})`).join("\n")}
` : ""}

${projects && projects.length > 0 ? `
**Projects:**
${projects.map((proj: any, idx: number) => `${idx + 1}. ${proj.projectName}: ${proj.description}`).join("\n")}
` : ""}

**Target Job Description:**
${jobDescription}

**CRITICAL INSTRUCTIONS:**

${isUsingExistingResume ? `
**NOTE**: The work experience and other content below is from the user's CURRENT RESUME. Enhance and tailor this existing content for the job, maintaining their writing style and detail level. Don't replace it with generic descriptions.
` : ''}

1. **Summary**: ${isUsingExistingResume ? 'Enhance the existing summary to better match the job' : 'Create a powerful 2-3 sentence professional summary highlighting most relevant qualifications'}

2. **Work Experience**: 
   - Write 4-6 achievement-focused bullet points per position
   - Use STAR method (Situation, Task, Action, Result)
   - Start with strong action verbs
   - Quantify achievements with metrics where possible
   - Match keywords from job description

3. **Skills**:
${userSelectedSkills && userSelectedSkills.length > 0 ? `
   - USER HAS SELECTED SPECIFIC SKILLS (${userSelectedSkills.length} skills) - Use ONLY these skills
   - For HYBRID/FUNCTIONAL templates: Provide detailed 1-2 sentence DESCRIPTIONS for EACH selected skill
   - For CHRONOLOGICAL template: List selected skills in "SKILLS" section
   - Explain how each skill has been applied professionally
   - Order skills by relevance to the job description
   - Set matchesJob=true for skills that DIRECTLY match job requirements (explicitly mentioned or clearly required)
` : `
   - SELECT ONLY THE TOP 5-8 TECHNICAL SKILLS that match the job (quality over quantity)
   - SELECT ONLY THE TOP 5-6 SOFT SKILLS that match the job
   - For HYBRID/FUNCTIONAL templates: Provide 1-2 sentence DESCRIPTIONS for each skill explaining proficiency
   - For skill descriptions, write how you've applied that skill professionally
   - Focus on skills mentioned in the job description
   - Set matchesJob=true for skills that DIRECTLY match job requirements (explicitly mentioned or clearly required)
`}

4. **Additional Sections**:
   - Include ALL relevant certifications that match the job
   - Include ALL relevant projects that demonstrate skills for this job
   - Generate comprehensive content - user will select what to include in their resume
   - Always provide certifications and projects sections (even if empty arrays)

5. **Feedback Section** - Provide constructive analysis:
   - **Strengths**: What aspects of their profile are strong for this job (3-5 clear points)
   - **Improvements**: What could be enhanced, rewritten, or is missing (3-6 specific, actionable suggestions including any gaps)

6. **Match Scoring** (CRITICAL - Required for UC-049 & UC-050):
   - **Individual Skill Matching**: For EACH skill, set matchesJob boolean to indicate if it directly matches job requirements
   - **Experience Relevance**: For EACH work experience, assign a score (0-100) based on:
     * How closely the role matches the target job
     * Relevance of responsibilities to job requirements
     * Industry/domain alignment
     * Recency and duration of the experience
   - Be honest but fair with scoring - consider transferable skills and related experience

7. **Maintain Honesty**: 
   - Do not fabricate experience
   - Only use skills they actually have
   - Reframe and optimize existing experience

8. **ATS Optimization**:
   - Use exact keywords from job description
   - Avoid tables, graphics, unusual formatting
   - Use standard section headings

**REMEMBER**: For Hybrid/Functional templates, skills MUST have descriptions, not just names!

Tailor this resume to maximize relevance and ATS compatibility for the target position.`;
};

export const resumeSystemPrompt = `You are an expert ATS-optimized resume writer. You specialize in:
- Tailoring resumes to specific job descriptions
- Using industry-standard keywords and phrases
- Writing achievement-focused bullet points with metrics
- Ensuring resumes pass Applicant Tracking Systems (ATS)
- Maintaining professional tone and formatting
- Providing constructive feedback on resume strengths and weaknesses
- Being template-aware (Chronological, Functional, Hybrid formats)

Always be honest and never fabricate information. Only optimize and reframe existing experience.`;
