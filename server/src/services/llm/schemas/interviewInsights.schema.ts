// services/llm/schemas/interviewInsights.schema.ts
export const interviewInsightsSchema = {
  type: "object",
  properties: {
    companyName: {
      type: "string",
      description: "Company name",
    },
    jobTitle: {
      type: "string",
      description: "Job title",
    },
    interviewProcess: {
      type: "object",
      properties: {
        stages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              stageName: {
                type: "string",
                description: "Name of the interview stage (e.g., 'Phone Screen', 'Technical Interview')",
              },
              stageNumber: {
                type: "number",
                description: "Stage number (1, 2, 3, etc.)",
                minimum: 1,
              },
              description: {
                type: "string",
                description: "Description of what happens in this stage",
              },
              typicalDuration: {
                type: "string",
                description: "Typical duration of this stage (e.g., '30-45 minutes', '1 hour')",
              },
              format: {
                type: "string",
                enum: ["phone", "video", "onsite", "hybrid"],
                description: "Interview format",
              },
              focus: {
                type: "string",
                description: "What this stage evaluates (e.g., 'Technical skills', 'Cultural fit')",
              },
            },
            required: ["stageName", "stageNumber", "description", "typicalDuration", "format", "focus"],
          },
          description: "Array of interview stages",
        },
        totalRounds: {
          type: "number",
          description: "Total number of interview rounds",
          minimum: 1,
        },
        estimatedTimeline: {
          type: "string",
          description: "Estimated timeline for the entire process (e.g., '2-4 weeks', '1-2 months')",
        },
        typicalTimeBetweenRounds: {
          type: "string",
          description: "Typical time between rounds (e.g., '3-5 business days', '1 week')",
        },
      },
      required: ["stages", "totalRounds", "estimatedTimeline", "typicalTimeBetweenRounds"],
    },
    commonQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The interview question",
          },
          category: {
            type: "string",
            enum: ["technical", "behavioral", "cultural", "situational"],
            description: "Question category",
          },
          difficulty: {
            type: "string",
            enum: ["easy", "medium", "hard"],
            description: "Question difficulty level",
          },
          tips: {
            type: "string",
            description: "Tips on how to answer the question",
          },
          frequency: {
            type: "string",
            enum: ["very-common", "common", "occasional"],
            description: "How frequently this question is asked",
          },
        },
        required: ["question", "category", "difficulty", "tips", "frequency"],
      },
      description: "Array of common interview questions (maximum 5)",
      maxItems: 5,
      minItems: 1,
    },
    interviewerInformation: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: {
            type: "string",
            description: "Interviewer's role (e.g., 'HR Recruiter', 'Hiring Manager', 'Technical Lead')",
          },
          focus: {
            type: "string",
            description: "What they evaluate",
          },
          typicalBackground: {
            type: "string",
            description: "Typical background of this interviewer",
            nullable: true,
          },
          questionsToExpect: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Typical questions this interviewer asks",
          },
        },
        required: ["role", "focus", "questionsToExpect"],
      },
      description: "Array of interviewer information",
    },
    companySpecificInsights: {
      type: "object",
      properties: {
        interviewCulture: {
          type: "string",
          description: "Description of the company's interview culture",
        },
        valuedTraits: {
          type: "array",
          items: {
            type: "string",
          },
          description: "What the company values in candidates",
        },
        interviewFormats: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Common interview formats used (e.g., 'Whiteboard coding', 'Take-home project')",
        },
        redFlags: {
          type: "array",
          items: {
            type: "string",
          },
          description: "What to avoid during interviews",
        },
        successTips: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Tips for success in interviews",
        },
      },
      required: ["interviewCulture", "valuedTraits", "interviewFormats", "redFlags", "successTips"],
    },
    preparationRecommendations: {
      type: "object",
      properties: {
        studyTopics: {
          type: "array",
          items: {
            type: "object",
            properties: {
              topic: {
                type: "string",
                description: "Topic to study",
              },
              importance: {
                type: "string",
                enum: ["critical", "important", "nice-to-have"],
                description: "Importance level of this topic",
              },
              resources: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Learning resources for this topic",
                nullable: true,
              },
            },
            required: ["topic", "importance"],
          },
          description: "Topics to study/prepare for (maximum 4)",
          maxItems: 4,
          minItems: 1,
        },
        keyAreasToReview: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Key areas to review",
        },
        preparationChecklist: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item: {
                type: "string",
                description: "Checklist item description",
              },
              category: {
                type: "string",
                enum: ["research", "practice", "preparation", "logistics"],
                description: "Category of the checklist item",
              },
            },
            required: ["item", "category"],
          },
          description: "Preparation checklist items (maximum 5)",
          maxItems: 5,
          minItems: 1,
        },
        estimatedPreparationTime: {
          type: "string",
          description: "Estimated total preparation time (e.g., '10-15 hours', '20-30 hours')",
        },
      },
      required: ["studyTopics", "keyAreasToReview", "preparationChecklist", "estimatedPreparationTime"],
    },
    researchDate: {
      type: "string",
      description: "Date when research was performed (ISO format: YYYY-MM-DD)",
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
      description: "Confidence level in the insights",
    },
  },
  required: [
    "companyName",
    "jobTitle",
    "interviewProcess",
    "commonQuestions",
    "interviewerInformation",
    "companySpecificInsights",
    "preparationRecommendations",
    "researchDate",
    "confidence",
  ],
};

