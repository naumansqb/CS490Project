export const referralTemplateSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "The complete referral request message (2-3 paragraphs, professional and personalized)"
    },
    subject: {
      type: "string",
      description: "A professional email subject line for the referral request"
    },
    keyPoints: {
      type: "array",
      items: { type: "string" },
      description: "Key points covered in the message (for reference)"
    }
  },
  required: ["message", "subject"]
};


