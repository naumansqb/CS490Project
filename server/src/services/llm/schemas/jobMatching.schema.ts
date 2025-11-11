// services/llm/schemas/jobMatching.schema.ts
export const jobMatchingSchema = {
  type: "object",
  properties: {
    overallMatchScore: {
      type: "number",
      description: "Overall match score (0-100)",
      minimum: 0,
      maximum: 100,
    },
    categoryScores: {
      type: "object",
      properties: {
        skills: {
          type: "number",
          description: "Skills match score (0-100)",
          minimum: 0,
          maximum: 100,
        },
        experience: {
          type: "number",
          description: "Experience match score (0-100)",
          minimum: 0,
          maximum: 100,
        },
        education: {
          type: "number",
          description: "Education match score (0-100)",
          minimum: 0,
          maximum: 100,
        },
        requirements: {
          type: "number",
          description: "Requirements match score (0-100)",
          minimum: 0,
          maximum: 100,
        },
      },
      required: ["skills", "experience", "education", "requirements"],
    },
    strengths: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Strength category (e.g., 'Skills', 'Experience', 'Education')",
          },
          description: {
            type: "string",
            description: "Description of the strength",
          },
          evidence: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Specific evidence from candidate's profile that supports this strength",
          },
        },
        required: ["category", "description", "evidence"],
      },
      description: "Array of candidate strengths - MAX 3 items",
    },
    gaps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Gap category (e.g., 'Skills', 'Experience', 'Education', 'Requirements')",
          },
          description: {
            type: "string",
            description: "Description of the gap",
          },
          impact: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Impact level of the gap on match score",
          },
          suggestions: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Actionable suggestions to address the gap",
          },
        },
        required: ["category", "description", "impact", "suggestions"],
      },
      description: "Array of candidate gaps",
    },
    improvementSuggestions: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["skill", "experience", "education"],
            description: "Type of improvement suggestion",
          },
          title: {
            type: "string",
            description: "Brief, actionable title for the suggestion",
          },
          description: {
            type: "string",
            description: "Detailed explanation of what to do",
          },
          priority: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Priority level of the suggestion",
          },
        },
        required: ["type", "title", "description", "priority"],
      },
      description: "Array of improvement suggestions - MAX 3 items",
    },
    matchedSkills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skillName: {
            type: "string",
            description: "Name of the matched skill",
          },
          relevance: {
            type: "number",
            description: "Relevance score (0-100) for this skill",
            minimum: 0,
            maximum: 100,
          },
        },
        required: ["skillName", "relevance"],
      },
      description: "Array of matched skills with relevance scores",
    },
    missingSkills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skillName: {
            type: "string",
            description: "Name of the missing skill",
          },
          importance: {
            type: "number",
            description: "Importance score (0-100) for this skill",
            minimum: 0,
            maximum: 100,
          },
        },
        required: ["skillName", "importance"],
      },
      description: "Array of missing skills with importance scores",
    },
  },
  required: [
    "overallMatchScore",
    "categoryScores",
    "strengths",
    "gaps",
    "improvementSuggestions",
    "matchedSkills",
    "missingSkills",
  ],
};

