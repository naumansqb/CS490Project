// services/llm/schemas/resume.schema.ts
export const resumeSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "Professional summary tailored to the job",
    },
    workExperiences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          companyName: { type: "string" },
          positionTitle: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          bulletPoints: {
            type: "array",
            items: { type: "string" },
            description: "Achievement-focused bullet points tailored to job",
          },
        },
        required: ["companyName", "positionTitle", "startDate", "bulletPoints"],
      },
    },
    skills: {
      type: "object",
      properties: {
        technical: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string", description: "Brief description for Hybrid/Functional templates" },
              matchesJob: { type: "boolean", description: "True if this skill directly matches a job requirement" }
            }
          },
          description: "Top 5-8 technical skills matching job"
        },
        soft: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string", description: "Brief description for Hybrid/Functional templates" },
              matchesJob: { type: "boolean", description: "True if this skill directly matches a job requirement" }
            }
          },
          description: "Top 5-6 soft skills matching job"
        },
        relevant: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string", description: "Why this skill is relevant to the job" },
              matchesJob: { type: "boolean", description: "True if this skill directly matches a job requirement" }
            }
          },
          description: "Top 5-7 most relevant skills for this specific job with descriptions",
        },
      },
      required: ["technical", "soft", "relevant"],
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          institutionName: { type: "string" },
          degreeType: { type: "string" },
          major: { type: "string" },
          graduationDate: { type: "string" },
        },
      },
    },
    certifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          organization: { type: "string" },
          date: { type: "string" },
        },
      },
      description: "Relevant certifications from user profile",
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          technologies: { type: "array", items: { type: "string" } },
        },
      },
      description: "Relevant projects from user profile for Chronological/Hybrid templates",
    },
    feedback: {
      type: "object",
      properties: {
        strengths: {
          type: "array",
          items: { type: "string" },
          description: "What's strong in the current resume for this job (3-5 points)",
        },
        improvements: {
          type: "array",
          items: { type: "string" },
          description: "What improvements can be made including missing elements (3-6 points)",
        },
      },
      required: ["strengths", "improvements"],
    },
    matchScore: {
      type: "object",
      properties: {
        experienceRelevance: {
          type: "array",
          items: {
            type: "object",
            properties: {
              positionTitle: { type: "string" },
              companyName: { type: "string" },
              relevanceScore: {
                type: "number",
                description: "Percentage (0-100) of how relevant this experience is to the target job",
              },
            },
          },
          description: "Relevance score for each work experience entry",
        },
      },
      required: ["experienceRelevance"],
    },
  },
  required: ["summary", "workExperiences", "skills", "education", "feedback", "matchScore"],
};
