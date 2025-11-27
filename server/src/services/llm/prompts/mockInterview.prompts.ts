interface GenerateQuestionsPromptInput {
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  insightsContext: string;
  numberOfQuestions: number;
}

interface EvaluateResponsePromptInput {
  question: string;
  category: string;
  difficulty: string;
  expectedPoints?: string[];
  userResponse: string;
  jobTitle: string;
  companyName: string;
}

interface GenerateSummaryPromptInput {
  jobTitle: string;
  companyName: string;
  responsesText: string;
  totalQuestions: number;
}

export const mockInterviewPrompts = {
  generateQuestions: (input: GenerateQuestionsPromptInput): string => {
    const {
      jobTitle,
      companyName,
      jobDescription,
      insightsContext,
      numberOfQuestions
    } = input;

    return `You are an expert interview coach helping a candidate prepare for a job interview.

JOB DETAILS:
- Position: ${jobTitle}
- Company: ${companyName}
${jobDescription ? `- Job Description: ${jobDescription}` : ''}

${insightsContext}

TASK: Generate exactly ${numberOfQuestions} realistic interview questions for this position.

REQUIREMENTS:
1. Mix question categories: behavioral, technical, cultural, and situational
2. Vary difficulty levels: easy, medium, hard
3. Make questions realistic and relevant to the role
4. If company insights are available, incorporate their interview style
5. For each question, provide 2-4 key points the candidate should cover

OUTPUT FORMAT (JSON only, no markdown):
{
  "questions": [
    {
      "id": "1",
      "question": "The actual question text",
      "category": "behavioral|technical|cultural|situational",
      "difficulty": "easy|medium|hard",
      "expectedPoints": ["Point 1", "Point 2", "Point 3"]
    }
  ]
}

Generate the questions now:`;
  },

  evaluateResponse: (input: EvaluateResponsePromptInput): string => {
    const {
      question,
      category,
      difficulty,
      expectedPoints,
      userResponse,
      jobTitle,
      companyName
    } = input;

    return `You are an expert interview coach evaluating a candidate's response to an interview question.

INTERVIEW CONTEXT:
- Position: ${jobTitle}
- Company: ${companyName}
- Question Category: ${category}
- Difficulty Level: ${difficulty}

QUESTION:
${question}

${expectedPoints && expectedPoints.length > 0 ? `
KEY POINTS TO COVER:
${expectedPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}
` : ''}

CANDIDATE'S RESPONSE:
${userResponse}

TASK: Evaluate this response and provide constructive feedback.

EVALUATION CRITERIA:
1. Content Quality: Does it answer the question? Are examples specific?
2. Structure: Is it well-organized (e.g., STAR method for behavioral)?
3. Relevance: Does it relate to the role and company?
4. Communication: Is it clear and concise?
5. Key Points Coverage: Did they hit the expected points?

OUTPUT FORMAT (JSON only, no markdown):
{
  "score": 75,
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "detailedFeedback": "A comprehensive 2-3 sentence evaluation of the response."
}

Score range: 0-100
- 90-100: Excellent response
- 70-89: Good response with minor improvements needed
- 50-69: Average response with notable gaps
- Below 50: Needs significant improvement

Evaluate the response now:`;
  },

  generateSummary: (input: GenerateSummaryPromptInput): string => {
    const { jobTitle, companyName, responsesText, totalQuestions } = input;

    return `You are an expert interview coach providing a comprehensive performance summary after a mock interview.

INTERVIEW DETAILS:
- Position: ${jobTitle}
- Company: ${companyName}
- Total Questions: ${totalQuestions}

COMPLETE INTERVIEW TRANSCRIPT WITH FEEDBACK:
${responsesText}

TASK: Analyze the entire interview performance and provide a comprehensive summary.

ANALYSIS REQUIREMENTS:
1. Calculate overall score (average of all question scores)
2. Calculate category-specific scores (average by category)
3. Identify top 3-5 overall strengths across all responses
4. Identify top 3-5 areas for improvement across all responses
5. Provide 3-5 actionable confidence tips for future interviews
6. Determine readiness level based on performance
7. Write a detailed 3-4 sentence analysis of overall performance

READINESS LEVELS:
- "excellent": 80+ overall score, strong across all categories
- "good": 60-79 overall score, mostly solid with some gaps
- "needs-practice": Below 60, significant improvements needed

OUTPUT FORMAT (JSON only, no markdown):
{
  "overallScore": 78,
  "categoryScores": {
    "technical": 75,
    "behavioral": 82,
    "cultural": 80,
    "situational": 75
  },
  "strengths": [
    "Strength 1",
    "Strength 2",
    "Strength 3"
  ],
  "areasForImprovement": [
    "Improvement area 1",
    "Improvement area 2",
    "Improvement area 3"
  ],
  "confidenceTips": [
    "Actionable tip 1",
    "Actionable tip 2",
    "Actionable tip 3"
  ],
  "readinessLevel": "good",
  "detailedAnalysis": "Comprehensive analysis of overall performance..."
}

Generate the performance summary now:`;
  }
};