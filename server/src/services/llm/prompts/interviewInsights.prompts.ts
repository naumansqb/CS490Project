// services/llm/prompts/interviewInsights.prompts.ts
import { InterviewInsightsInput } from "../../../types/ai.types";

export const buildInterviewInsightsPrompt = (input: InterviewInsightsInput): string => {
  const {
    companyName,
    jobTitle,
    jobDescription,
    industry,
    companyWebsite,
  } = input;

  return `You are an expert interview researcher and preparation advisor. Research and provide comprehensive interview insights for a specific company and role.

**Company Information:**
**Company Name:** ${companyName}
${companyWebsite ? `**Company Website:** ${companyWebsite}` : ""}
${industry ? `**Industry:** ${industry}` : ""}

**Job Information:**
**Job Title:** ${jobTitle}
${jobDescription ? `**Job Description:**\n${jobDescription}` : ""}

**CRITICAL INSTRUCTIONS:**

1. **Interview Process Research**:
   - Research the typical interview process for this company and role
   - Identify interview stages (e.g., "Phone Screen", "Technical Interview", "Behavioral Interview", "Final Round")
   - For each stage, provide:
     * Stage name (e.g., "Phone Screen", "Technical Interview")
     * Stage number (1, 2, 3, etc.)
     * Description: What happens in this stage, what is evaluated
     * Typical duration: How long the interview usually takes (e.g., "30-45 minutes", "1 hour")
     * Format: 'phone' (phone call), 'video' (video call), 'onsite' (in-person), or 'hybrid' (mix of formats)
     * Focus: What this stage evaluates (e.g., "Technical skills", "Cultural fit", "Communication")
   - Provide total number of rounds
   - Estimate timeline: How long the entire process typically takes (e.g., "2-4 weeks", "1-2 months")
   - Estimate time between rounds: How long between each stage (e.g., "3-5 business days", "1 week")

2. **Common Interview Questions**:
   - Research common interview questions for this company and role
   - Include questions from different categories:
     * **Technical**: Technical knowledge
     * **Behavioral**: Past experiences, situations, actions, results (STAR method)
     * **Cultural**: Company culture fit, values, work style
     * **Situational**: Hypothetical scenarios, how you would handle situations
     * **Coding Challenges**: (if applicable) coding problems, algorithms, data structures
     * **System Design**: (if applicable) system architecture, design patterns, scalability
   - For each question, provide:
     * Question text (the actual question)
     * Category: 'technical', 'behavioral', 'cultural', or 'situational'
     * Difficulty: 'easy', 'medium', or 'hard'
     * Tips: How to answer the question effectively
     * Frequency: 'very-common' (asked in most interviews), 'common' (asked frequently), 'occasional' (asked sometimes)
   - **IMPORTANT: INCLUDE EXACTLY 10 QUESTIONS** - prioritize the most important and commonly asked questions and include at least one coding challenge and one system design question if relevant
   - Make sure there are 10 quesitons in total

3. **Interviewer Information**:
   - Research typical interviewer roles and backgrounds for this company and role
   - For each interviewer type, provide:
     * Role: Interviewer's role (e.g., "HR Recruiter", "Hiring Manager", "Technical Lead", "Team Member", "VP of Engineering")
     * Focus: What they evaluate (e.g., "Cultural fit", "Technical skills", "Team collaboration")
     * Typical background: Interviewer's background if known (e.g., "Senior engineer with 10+ years experience", "HR professional")
     * Questions to expect: Typical questions this interviewer asks (array of 3-5 questions)
   - Include 3-5 different interviewer types
   - Focus on interviewers specific to this role and company

4. **Company-Specific Insights**:
   - Research company-specific interview culture and practices
   - Provide:
     * Interview culture: Description of the company's interview style (e.g., "Technical focus", "Cultural fit emphasis", "Collaborative and conversational")
     * Valued traits: What the company values in candidates (e.g., "Problem-solving", "Team collaboration", "Innovation", "Customer focus")
     * Interview formats: Common interview formats used (e.g., "Whiteboard coding", "Take-home project", "Pair programming", "System design")
     * Red flags: What to avoid during interviews (e.g., "Being unprepared", "Not asking questions", "Poor communication")
     * Success tips: Tips for success in interviews (e.g., "Show enthusiasm", "Ask thoughtful questions", "Demonstrate problem-solving")
   - Base insights on the company's known interview practices and culture

5. **Preparation Recommendations**:
   - Provide comprehensive, actionable preparation recommendations customized for this specific role and company
   - Structure as a complete interview preparation checklist with the following sections:
   
   **A. Study Topics** (Technical/Domain Knowledge):
      - For each topic, provide:
        * topic: Topic name (e.g., "Data structures and algorithms", "React and TypeScript", "Company products and ecosystem")
        * importance: 'critical' (must know), 'important' (should know), 'nice-to-have' (good to know)
        * timeEstimate: Estimated study time (e.g., "3-4 hours", "1-2 days")
        * resources: Array of learning resources with { name: string, url?: string, type: 'documentation' | 'course' | 'article' | 'video' | 'book' }
      - **IMPORTANT: Include EXACTLY 4-6 study topics** - prioritize the most critical topics for this role
   
   **B. Interview Preparation Checklist** (Actionable Tasks):
      - Organize checklist items into categories for better workflow
      - For each item, provide:
        * task: Clear, actionable task description
        * category: 'company-research' | 'technical-practice' | 'behavioral-prep' | 'logistics' | 'materials' | 'follow-up'
        * priority: 'high' (must complete), 'medium' (should complete), 'low' (nice to complete)
        * estimatedTime: Time needed to complete (e.g., "30 minutes", "1-2 hours")
        * dueDate: When to complete relative to interview (e.g., "3 days before", "1 day before", "morning of interview", "within 24 hours after")
        * completed: false (always false initially)
        * notes?: Optional tips or details about the task
      
      **Required Categories and Examples:**
      
      1. **Company Research** (3-5 tasks):
         - Research company mission, values, and culture
         - Review recent company news and press releases
         - Study company products/services in depth
         - Research the team/department you're interviewing with
         - Identify potential challenges or opportunities for the company
      
      2. **Technical Practice** (3-5 tasks, if technical role):
         - Practice coding problems on LeetCode/HackerRank (specific difficulty/topics)
         - Review system design patterns and best practices
         - Practice explaining technical concepts clearly
         - Build a small project demonstrating relevant skills
         - Review the technology stack mentioned in job description
      
      3. **Behavioral Preparation** (3-4 tasks):
         - Prepare 5-7 STAR method stories covering different competencies
         - Practice answering common behavioral questions out loud
         - Prepare examples of failures/challenges and lessons learned
         - Review your resume and be ready to discuss every point
      
      4. **Questions to Ask Interviewer** (2-3 tasks):
         - Prepare 5-8 thoughtful questions about the role, team, and company
         - Prepare questions specific to the interviewer's background (if known)
         - Prepare questions about growth opportunities and success metrics
      
      5. **Materials Preparation** (2-4 tasks):
         - Update and tailor resume for this specific role
         - Prepare portfolio/work samples if applicable
         - Print multiple copies of resume
         - Prepare reference list with contact information
         - Bring notebook and pen for notes
      
      6. **Logistics Verification** (4-6 tasks):
         - Confirm interview date, time, and timezone
         - Verify interview location/address or video call link
         - Test video conferencing software and equipment (camera, mic, internet)
         - Plan travel route and timing (arrive 10-15 minutes early)
         - Prepare professional outfit and grooming
         - Set up quiet, well-lit space for video interview
         - Silence phone and close unnecessary applications
      
      7. **Day-of Preparation** (3-4 tasks):
         - Review company research notes and your prepared answers
         - Review your STAR stories and questions to ask
         - Do a mock interview or practice session
         - Get good rest the night before
         - Eat a good meal before interview
      
      8. **Post-Interview Follow-up** (3-4 tasks):
         - Send personalized thank-you email within 24 hours
         - Connect with interviewer(s) on LinkedIn
         - Document interview questions and your answers for future reference
         - Note any action items or next steps discussed
         - Follow up if no response within stated timeframe
      
      **IMPORTANT: Include 25-35 total checklist items across all categories**
      - Prioritize tasks based on role type (technical vs non-technical)
      - Include specific, measurable tasks (not vague like "prepare well")
      - Set realistic time estimates and due dates
      - Mix of high, medium, and low priority tasks
   
   **C. Key Areas to Review**:
      - Array of 8-12 specific areas to review or refresh
      - Examples: "REST API design principles", "Team leadership experience", "Conflict resolution strategies"
      - Make them specific to the role and company
   
   **D. Questions to Prepare For Interviewer**:
      - Provide 6-10 thoughtful questions the candidate should prepare to ask
      - Categorize questions:
        * roleQuestions: About the specific role (3-4 questions)
        * teamQuestions: About the team and collaboration (2-3 questions)
        * companyQuestions: About company direction and culture (2-3 questions)
        * growthQuestions: About career development (1-2 questions)
      - Make questions specific to this company and role
      - Avoid generic questions (e.g., avoid "What's the culture like?" - be more specific)
   
   **E. Overall Preparation Timeline**:
      - totalEstimatedTime: Total preparation time needed (e.g., "15-20 hours over 1-2 weeks")
      - recommendedStartDate: How far in advance to start (e.g., "2 weeks before interview", "1 week before interview")
      - criticalDeadlines: Array of key milestones (e.g., "Complete company research 3 days before", "Finish technical practice 2 days before")
   
   **F. Interview Day Tips**:
      - Array of 5-8 tips for the actual interview day
      - Examples: "Arrive 10 minutes early", "Bring extra copies of resume", "Take notes during interview", "Ask for business cards"
   
   **G. Red Flags to Watch For**:
      - Array of 3-5 red flags the candidate should watch for during interview
      - Examples: "Unclear job responsibilities", "High turnover mentioned", "Lack of growth opportunities"
      - Help candidate evaluate if this is the right opportunity

6. **Research Date and Confidence**:
   - Research date: Current date in ISO format (YYYY-MM-DD)
   - Confidence level: 'high' (very confident in insights), 'medium' (somewhat confident), 'low' (limited information available)
   - Base confidence on:
     * Availability of information about the company's interview process
     * Specificity of information for this role
     * Recency of information

**IMPORTANT RULES:**
- Research actual interview processes and questions for this company and role
- Base insights on known information about the company's interview practices
- Provide specific, actionable recommendations
- Include questions that are actually asked in interviews (don't fabricate)
- Make preparation recommendations realistic and achievable
- Consider the role level (entry, mid, senior) when providing insights
- Provide diverse question types (technical, behavioral, cultural, situational, coding challenges, system design)
- Include company-specific insights when available
- Be honest about confidence level (use 'low' if information is limited)
- All dates must be in ISO format (YYYY-MM-DD)
- 10 common interview questions exact

**Output Format:**
Return a structured JSON object with:
- Company name and job title
- Interview process (stages, totalRounds, estimatedTimeline, typicalTimeBetweenRounds)
- Common questions array (with question, category, difficulty, tips, frequency)
- Interviewer information array (with role, focus, typicalBackground, questionsToExpect)
- Company-specific insights (interviewCulture, valuedTraits, interviewFormats, redFlags, successTips)
- Preparation recommendations (studyTopics, keyAreasToReview, preparationChecklist, estimatedPreparationTime)
- Research date (ISO format)
- Confidence level ('high', 'medium', 'low')

Return ONLY the structured JSON data matching the required schema.`;
};

export const interviewInsightsSystemPrompt = `You are an expert interview researcher and preparation advisor. You specialize in:
- Researching interview processes for specific companies and roles
- Identifying common interview questions and how to answer them
- Understanding interviewer roles and what they evaluate
- Providing company-specific interview insights and culture
- Creating comprehensive preparation recommendations

Your goal is to help job seekers:
- Understand what to expect in interviews for a specific company and role
- Prepare for common interview questions
- Know what different interviewers are looking for
- Understand company-specific interview culture and practices
- Create a comprehensive preparation plan

Always be accurate, specific, and helpful. Base your insights on known information about the company's interview practices. Provide actionable recommendations that help candidates prepare effectively. Be honest about confidence levels when information is limited.`;

