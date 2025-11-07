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
        technical: { type: "array", items: { type: "string" } },
        soft: { type: "array", items: { type: "string" } },
        relevant: {
          type: "array",
          items: { type: "string" },
          description: "Most relevant skills for this specific job",
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
  },
  required: ["summary", "workExperiences", "skills", "education"],
};
