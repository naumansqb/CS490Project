// services/llm/schemas/resumeParser.schema.ts
export const resumeParserSchema = {
  type: "object",
  properties: {
    personalInfo: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        linkedin: { type: "string" },
        portfolio: { type: "string" },
      },
      required: ["fullName"],
    },
    summary: {
      type: "string",
      description: "Professional summary or objective statement",
    },
    workExperience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          company: { type: "string" },
          location: { type: "string" },
          startDate: { type: "string", description: "Format as 'MMM YYYY' or 'Present'" },
          endDate: { type: "string", description: "Format as 'MMM YYYY' or 'Present'" },
          bullets: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          degree: { type: "string" },
          major: { type: "string" },
          school: { type: "string" },
          graduationDate: { type: "string" },
        },
      },
    },
    skills: {
      type: "array",
      items: { type: "string" },
      description: "List of all skills mentioned",
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
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          technologies: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  },
  required: ["personalInfo", "workExperience", "education", "skills"],
};

