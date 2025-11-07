// services/llm/schemas/coverLetter.schema.ts
export const coverLetterSchema = {
  type: "object",
  properties: {
    greeting: {
      type: "string",
      description: 'Personalized greeting (e.g., "Dear Hiring Manager,")',
    },
    opening: {
      type: "string",
      description: "Opening paragraph expressing interest",
    },
    body: {
      type: "array",
      items: { type: "string" },
      description:
        "Body paragraphs highlighting relevant experience and skills",
    },
    closing: {
      type: "string",
      description: "Closing paragraph with call to action",
    },
    signature: {
      type: "string",
      description: 'Professional closing (e.g., "Sincerely,")',
    },
  },
  required: ["greeting", "opening", "body", "closing", "signature"],
};
