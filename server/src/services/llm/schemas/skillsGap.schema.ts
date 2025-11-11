// services/llm/schemas/skillsGap.schema.ts
export const skillsGapSchema = {
  type: "object",
  properties: {
    matchedSkills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skillName: {
            type: "string",
            description: "Name of the matched skill",
          },
          userProficiency: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced", "expert"],
            description: "User's proficiency level in this skill",
          },
          jobRequirement: {
            type: "string",
            enum: ["required", "preferred", "nice-to-have"],
            description: "Job requirement level for this skill",
          },
          matchStrength: {
            type: "string",
            enum: ["strong", "moderate", "weak"],
            description: "Strength of the match between user proficiency and job requirement",
          },
        },
        required: ["skillName", "userProficiency", "jobRequirement", "matchStrength"],
      },
      description: "Array of matched skills with proficiency and requirement levels",
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
            type: "string",
            enum: ["critical", "important", "nice-to-have"],
            description: "Importance level of this skill for the job",
          },
          impact: {
            type: "number",
            description: "Impact score (0-100) on match score if this skill is learned",
            minimum: 0,
            maximum: 100,
          },
          estimatedLearningTime: {
            type: "string",
            description: "Estimated time to learn this skill (e.g., '2-4 weeks', '3-6 months')",
          },
        },
        required: ["skillName", "importance", "impact", "estimatedLearningTime"],
      },
      description: "Array of missing skills with importance and learning time estimates",
    },
    weakSkills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skillName: {
            type: "string",
            description: "Name of the weak skill",
          },
          currentProficiency: {
            type: "string",
            description: "Current proficiency level of the user",
          },
          recommendedProficiency: {
            type: "string",
            description: "Recommended proficiency level for the job",
          },
          improvementPriority: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Priority level for improving this skill",
          },
        },
        required: ["skillName", "currentProficiency", "recommendedProficiency", "improvementPriority"],
      },
      description: "Array of weak skills that need improvement",
    },
    learningResources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skillName: {
            type: "string",
            description: "Name of the skill these resources are for",
          },
          resources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Title of the learning resource",
                },
                type: {
                  type: "string",
                  enum: ["course", "tutorial", "certification", "book", "article"],
                  description: "Type of learning resource",
                },
                provider: {
                  type: "string",
                  description: "Provider or platform name (e.g., 'Coursera', 'Udemy', 'freeCodeCamp')",
                },
                url: {
                  type: "string",
                  description: "URL to the learning resource",
                  nullable: true,
                },
                estimatedTime: {
                  type: "string",
                  description: "Estimated time to complete (e.g., '10 hours', '4 weeks')",
                },
                difficulty: {
                  type: "string",
                  enum: ["beginner", "intermediate", "advanced"],
                  description: "Difficulty level of the resource",
                },
                cost: {
                  type: "string",
                  enum: ["free", "paid", "freemium"],
                  description: "Cost of the resource",
                },
              },
              required: ["title", "type", "provider", "estimatedTime", "difficulty", "cost"],
            },
            description: "Array of learning resources for this skill",
          },
        },
        required: ["skillName", "resources"],
      },
      description: "Array of learning resources grouped by skill",
    },
    prioritizedLearningPath: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skillName: {
            type: "string",
            description: "Name of the skill to learn",
          },
          priority: {
            type: "number",
            description: "Priority number (1 = highest priority)",
            minimum: 1,
          },
          reason: {
            type: "string",
            description: "Reason why this skill should be learned at this priority level",
          },
          estimatedTime: {
            type: "string",
            description: "Estimated time to learn this skill to the required level",
          },
        },
        required: ["skillName", "priority", "reason", "estimatedTime"],
      },
      description: "Prioritized learning path for skills",
    },
    overallGapScore: {
      type: "number",
      description: "Overall gap score (0-100, lower = more gaps)",
      minimum: 0,
      maximum: 100,
    },
  },
  required: [
    "matchedSkills",
    "missingSkills",
    "weakSkills",
    "learningResources",
    "prioritizedLearningPath",
    "overallGapScore",
  ],
};

