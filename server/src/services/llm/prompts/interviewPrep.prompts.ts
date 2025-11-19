export const buildAnalysisPrompt = (
  question: string,
  questionCategory: string,
  response: string,
  jobTitle?: string,
  companyName?: string
): string => {
  const contextInfo = jobTitle && companyName
    ? `\nContext: This is for a ${jobTitle} position at ${companyName}.`
    : '';

  return `You are an expert interview coach analyzing a candidate's response to an interview question. Provide constructive, actionable feedback.

Question Category: ${questionCategory}
Question: ${question}${contextInfo}

Candidate's Response:
${response}

Analyze this response and provide feedback in the following JSON format:

{
  "score": <number between 0-100>,
  "strengths": [<array of 3-5 specific strengths>],
  "improvements": [<array of 3-5 specific areas for improvement>],
  "starFrameworkUsed": <boolean - true if STAR method is clearly present for behavioral questions>,
  "detailedFeedback": "<2-3 sentence paragraph with overall assessment>",
  "alternativeApproaches": [<array of 2-3 alternative ways to structure the answer>]
}

Scoring Criteria (distribute 100 points):
- Clarity and Structure (25 points): Is the answer well-organized and easy to follow?
- Relevance to Question (25 points): Does it directly address what was asked?
- Depth and Specificity (25 points): Are there concrete examples and details?
- Professionalism (25 points): Is the tone appropriate and communication effective?

${
  questionCategory === 'behavioral'
    ? `
For BEHAVIORAL questions, evaluate if the STAR framework is present:
- Situation: Did they set clear context?
- Task: Did they define their responsibility/challenge?
- Action: Did they explain specific steps taken?
- Result: Did they share measurable outcomes and learnings?

If STAR framework is well-executed, set "starFrameworkUsed" to true.
`
    : ''
}

${
  questionCategory === 'technical'
    ? `
For TECHNICAL questions, evaluate:
- Accuracy of technical information
- Depth of understanding
- Problem-solving approach
- Ability to explain complex concepts clearly
`
    : ''
}

${
  questionCategory === 'cultural' || questionCategory === 'situational'
    ? `
For ${questionCategory.toUpperCase()} questions, evaluate:
- Authenticity and self-awareness
- Alignment with professional values
- Concrete examples that demonstrate fit
- Forward-thinking perspective
`
    : ''
}

Be constructive and specific in your feedback. Focus on actionable improvements.

Return ONLY the JSON object, no other text.`;
}