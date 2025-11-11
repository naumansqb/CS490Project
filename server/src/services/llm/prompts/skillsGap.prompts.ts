// services/llm/prompts/skillsGap.prompts.ts
import { SkillsGapInput } from "../../../types/ai.types";

export const buildSkillsGapPrompt = (input: SkillsGapInput): string => {
  const {
    jobDescription,
    userSkills,
    jobTitle,
    companyName,
  } = input;

  const skillsList = userSkills
    .map(
      (skill) =>
        `- ${skill.skillName}${skill.proficiencyLevel ? ` (${skill.proficiencyLevel})` : ""}${skill.yearsOfExperience ? ` - ${skill.yearsOfExperience} years` : ""}`
    )
    .join("\n");

  return `You are an expert skills gap analyst and learning advisor. Analyze the skills gap between a candidate's current skills and a job's requirements, then provide learning recommendations.

**Job Information:**
${jobTitle ? `**Job Title:** ${jobTitle}` : ""}
${companyName ? `**Company:** ${companyName}` : ""}

**Job Description:**
${jobDescription}

**Candidate Skills:**
${skillsList || "No skills listed"}

**CRITICAL INSTRUCTIONS:**

1. **Matched Skills Analysis**:
   - Identify skills from the candidate's profile that match job requirements
   - For each matched skill, determine:
     * User proficiency level: 'beginner', 'intermediate', 'advanced', or 'expert'
     * Job requirement level: 'required' (essential), 'preferred' (desired), or 'nice-to-have' (bonus)
     * Match strength: 'strong' (excellent match), 'moderate' (good match), or 'weak' (basic match)
   - Consider skill relevance, proficiency level, and job requirements
   - Include all matched skills

2. **Missing Skills Identification**:
   - Identify skills required/preferred for the job that are NOT in the candidate's profile
   - For each missing skill, determine:
     * Importance level: 'critical' (essential for the job), 'important' (highly desired), or 'nice-to-have' (beneficial)
     * Impact score (0-100): How much learning this skill would improve the match score
     * Estimated learning time: Realistic estimate (e.g., "2-4 weeks", "3-6 months", "6-12 months")
   - Prioritize skills that are explicitly mentioned in the job description
   - Include the most important missing skills (top 10-15)

3. **Weak Skills Identification**:
   - Identify skills that the candidate has but at a lower proficiency than required
   - For each weak skill, provide:
     * Current proficiency level (from candidate's profile)
     * Recommended proficiency level (based on job requirements)
     * Improvement priority: 'high' (critical to improve), 'medium' (should improve), 'low' (nice to improve)
   - Focus on skills where there's a significant gap between current and required proficiency

4. **Learning Resources**:
   - For each missing or weak skill, provide learning resource recommendations
   - For each resource, provide:
     * Title (course, tutorial, book, article name)
     * Type: 'course' (structured learning), 'tutorial' (guided learning), 'certification' (credential), 'book' (book), 'article' (article/blog)
     * Provider: Platform or source (e.g., "Coursera", "Udemy", "freeCodeCamp", "YouTube", "O'Reilly")
     * URL: Link to the resource (if available and known)
     * Estimated time: How long it takes to complete (e.g., "10 hours", "4 weeks", "2 months")
     * Difficulty: 'beginner', 'intermediate', or 'advanced'
     * Cost: 'free', 'paid', or 'freemium'
   - Provide 2-4 resources per skill
   - Prioritize high-quality, well-known resources
   - Include a mix of free and paid resources
   - Focus on practical, hands-on learning resources

5. **Prioritized Learning Path**:
   - Create a prioritized learning path that shows which skills to learn first
   - For each skill in the path, provide:
     * Skill name
     * Priority number (1 = highest priority, higher numbers = lower priority)
     * Reason: Why this skill should be learned at this priority level
     * Estimated time: Total time to learn this skill to the required level
   - Prioritize based on:
     * Impact on match score (high impact = high priority)
     * Skill importance (critical skills = high priority)
     * Learning dependencies (prerequisites first)
     * Time to learn (quick wins first, then longer-term skills)
   - Include 8-12 skills in the learning path

6. **Overall Gap Score (0-100)**:
   - Calculate an overall gap score where:
     * 0-30 = Large gaps (many critical skills missing)
     * 31-50 = Moderate gaps (some important skills missing)
     * 51-70 = Small gaps (mostly nice-to-have skills missing)
     * 71-100 = Minimal gaps (most skills present)
   - Lower score = more gaps = more learning needed
   - Consider both missing skills and weak skills in the calculation

**IMPORTANT RULES:**
- Be accurate and specific in your analysis
- Base proficiency levels on the candidate's stated proficiency and experience
- Provide realistic learning time estimates (consider skill complexity and current level)
- Recommend high-quality, reputable learning resources
- Prioritize skills that will have the biggest impact on job match
- Make learning paths actionable and achievable
- Consider skill dependencies (learn foundational skills first)
- Provide diverse learning resources (courses, tutorials, books, articles)
- All scores must be integers between 0-100
- Learning time estimates should be realistic and consider the candidate's background

**Output Format:**
Return a structured JSON object with:
- Matched skills array (with skillName, userProficiency, jobRequirement, matchStrength)
- Missing skills array (with skillName, importance, impact, estimatedLearningTime)
- Weak skills array (with skillName, currentProficiency, recommendedProficiency, improvementPriority)
- Learning resources array (with skillName and resources array)
- Prioritized learning path array (with skillName, priority, reason, estimatedTime)
- Overall gap score (0-100)

Return ONLY the structured JSON data matching the required schema.`;
};

export const skillsGapSystemPrompt = `You are an expert skills gap analyst and learning advisor. You specialize in:
- Analyzing skills gaps between candidates and job requirements
- Identifying missing and weak skills
- Recommending high-quality learning resources (courses, tutorials, certifications, books)
- Creating prioritized learning paths that maximize impact
- Providing realistic learning time estimates

Your goal is to help candidates:
- Understand what skills they need to learn for a specific job
- Prioritize which skills to learn first (based on impact and importance)
- Find the best learning resources for each skill
- Create a realistic learning plan that improves their job match

Always be accurate, practical, and helpful. Recommend reputable, high-quality learning resources. Provide realistic time estimates based on skill complexity and the candidate's current level. Prioritize skills that will have the biggest impact on job match.`;

