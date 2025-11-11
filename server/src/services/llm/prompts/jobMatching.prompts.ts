// services/llm/prompts/jobMatching.prompts.ts
import { JobMatchingInput } from "../../../types/ai.types";

export const buildJobMatchingPrompt = (input: JobMatchingInput): string => {
  const {
    jobDescription,
    userSkills,
    userExperience,
    userEducation,
    companyName,
    jobTitle,
    weights,
  } = input;

  const normalizedWeights = (() => {
    if (!weights) {
      return null;
    }
    const baseWeights = {
      skills: weights.skills ?? 1,
      experience: weights.experience ?? 1,
      education: weights.education ?? 1,
      requirements: weights.requirements ?? 1,
    };
    const totalBase =
      baseWeights.skills +
      baseWeights.experience +
      baseWeights.education +
      baseWeights.requirements +
      Object.values(weights.customCriteria ?? {}).reduce(
        (sum, val) => sum + val,
        0
      );
    if (totalBase <= 0) {
      return null;
    }
    const toPercent = (value: number) =>
      Math.round((value / totalBase) * 1000) / 10; // one decimal place

    const criteriaPercentages = Object.entries(
      weights.customCriteria ?? {}
    ).map(([key, value]) => `- ${key}: ${toPercent(value)}%`);

    return {
      summary: `Use the following weighting when calculating the overall match score:\n- Skills: ${toPercent(
        baseWeights.skills
      )}%\n- Experience: ${toPercent(
        baseWeights.experience
      )}%\n- Education: ${toPercent(
        baseWeights.education
      )}%\n- Requirements: ${toPercent(
        baseWeights.requirements
      )}%${
        criteriaPercentages.length
          ? `\n- Custom Criteria:\n${criteriaPercentages.join("\n")}`
          : ""
      }\nEnsure the weighted contributions align with these percentages.`,
    };
  })();

  const skillsList = userSkills
    .map(
      (skill) =>
        `- ${skill.skillName}${skill.proficiencyLevel ? ` (${skill.proficiencyLevel})` : ""}`
    )
    .join("\n");

  const experienceList = userExperience
    .map(
      (exp) =>
        `- **${exp.positionTitle}** at ${exp.companyName}\n  ${exp.description}`
    )
    .join("\n\n");

  const educationList = userEducation
    .map((edu) => `- ${edu.degreeType} in ${edu.major}`)
    .join("\n");

  return `You are an expert job matching analyst. Analyze how well a candidate matches a specific job opportunity and provide detailed insights.

**Job Information:**
${jobTitle ? `**Job Title:** ${jobTitle}` : ""}
${companyName ? `**Company:** ${companyName}` : ""}

**Job Description:**
${jobDescription}

**Candidate Profile:**

**Skills:**
${skillsList || "No skills listed"}

**Work Experience:**
${experienceList || "No work experience listed"}

**Education:**
${educationList || "No education listed"}

**CRITICAL INSTRUCTIONS:**

${normalizedWeights ? `${normalizedWeights.summary}\n` : ""}

1. **Overall Match Score Calculation (0-100)**:
   - Calculate an overall match score based on all factors (skills, experience, education, requirements${weights?.customCriteria ? ", and custom criteria" : ""})
   - Consider the relative importance of each category and ensure the final score reflects the weighting guidance above
   - Be realistic but fair in scoring
   - A score of 80-100 indicates a strong match
   - A score of 60-79 indicates a good match with some gaps
   - A score of 40-59 indicates a moderate match with significant gaps
   - A score below 40 indicates a weak match

2. **Category Scores (0-100 each)**:
   - **Skills Score**: How well do the candidate's skills match job requirements?
     * Consider skill relevance, proficiency levels, and required vs. preferred skills
     * Match exact skill names and similar/equivalent skills
   - **Experience Score**: How relevant is the candidate's work experience?
     * Consider job title relevance, industry experience, responsibilities, and years of experience
     * Match responsibilities and achievements to job requirements
   - **Education Score**: How well does the candidate's education match requirements?
     * Consider degree type, major/field of study, and education level
     * Match degree requirements (Bachelor's, Master's, etc.)
   - **Requirements Score**: How well does the candidate meet specific job requirements?
     * Consider all explicit requirements mentioned in the job description
     * Evaluate certifications, specific experience, and other requirements

3. **Strengths Identification**:
   - Identify what the candidate excels at (matched skills, relevant experience, strong qualifications)
   - For each strength, provide:
     * Category (e.g., "Skills", "Experience", "Education")
     * Description (what makes this a strength)
     * Evidence (specific examples from the candidate's profile that support this strength)
   - Include exactly 3 key strengths (prioritize the most impactful ones)

4. **Gaps Identification**:
   - Identify areas where the candidate falls short (missing skills, insufficient experience, education gaps)
   - For each gap, provide:
     * Category (e.g., "Skills", "Experience", "Education", "Requirements")
     * Description (what is missing or insufficient)
     * Impact level: 'high' (significantly affects match), 'medium' (moderately affects match), 'low' (minimal impact)
     * Suggestions (actionable steps to address the gap)
   - Include 3-5 key gaps

5. **Improvement Suggestions**:
   - Provide actionable suggestions to increase the match score
   - For each suggestion, provide:
     * Type: 'skill', 'experience', or 'education'
     * Title (brief, actionable title)
     * Description (detailed explanation of what to do)
     * Priority: 'high' (will significantly improve match), 'medium' (will moderately improve match), 'low' (nice to have)
   - Focus on the most impactful improvements first
   - Include exactly 3 suggestions (prioritize the highest impact ones)

6. **Matched Skills**:
   - List skills from the candidate's profile that match job requirements
   - For each matched skill, provide:
     * Skill name
     * Relevance score (0-100): How relevant/important this skill is for the job
   - Include all matched skills

7. **Missing Skills**:
   - List skills required/preferred for the job that are NOT in the candidate's profile
   - For each missing skill, provide:
     * Skill name
     * Importance score (0-100): How critical this skill is for the job
   - Include the most important missing skills (top 10-15)

**IMPORTANT RULES:**
- Be accurate and objective in your analysis
- Base scores on actual match, not on assumptions
- Provide specific, actionable feedback
- Be constructive and helpful (focus on how to improve, not just what's wrong)
- Consider context (e.g., transferable skills, related experience)
- All scores must be integers between 0-100
- Provide evidence for strengths and gaps
- Make improvement suggestions realistic and achievable
- Relevance and importance scores should reflect the job requirements' emphasis

**Output Format:**
Return a structured JSON object with:
- Overall match score (0-100)
- Category scores (skills, experience, education, requirements)
- Strengths array (with category, description, evidence)
- Gaps array (with category, description, impact, suggestions)
- Improvement suggestions array (with type, title, description, priority)
- Matched skills array (with skillName, relevance)
- Missing skills array (with skillName, importance)

Return ONLY the structured JSON data matching the required schema.`;
};

export const jobMatchingSystemPrompt = `You are an expert job matching analyst and career advisor. You specialize in:
- Analyzing candidate profiles against job requirements
- Calculating accurate match scores based on skills, experience, and education
- Identifying candidate strengths and areas for improvement
- Providing actionable feedback to help candidates improve their job fit
- Evaluating job requirements and matching them to candidate qualifications

Your goal is to help candidates understand:
- How well they match a specific job opportunity
- What makes them a strong candidate (strengths)
- What gaps exist and how to address them (actionable improvements)
- How to improve their match score over time

If weighting guidance is provided, you must honor it when calculating scores and clearly reflect the intended emphasis.

Always be objective, accurate, and constructive. Base your analysis on the actual information provided, not assumptions. Provide specific, actionable feedback that helps candidates make informed decisions and improve their profiles.`;

