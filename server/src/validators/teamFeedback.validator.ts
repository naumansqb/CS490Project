// validators/teamFeedback.validator.ts

const VALID_FEEDBACK_TYPES = [
  "resume_review",
  "cover_letter_review",
  "interview_prep",
  "general_guidance",
  "application_review",
];

export const validateTeamFeedback = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.menteeId || typeof data.menteeId !== "string" || data.menteeId.trim() === "") {
    errors.push({ field: "menteeId", message: "Mentee ID is required" });
  }

  if (!data.feedbackType || !VALID_FEEDBACK_TYPES.includes(data.feedbackType)) {
    errors.push({
      field: "feedbackType",
      message: `Feedback type must be one of: ${VALID_FEEDBACK_TYPES.join(", ")}`,
    });
  }

  if (!data.content || typeof data.content !== "string" || data.content.trim() === "") {
    errors.push({ field: "content", message: "Feedback content is required" });
  } else if (data.content.length > 10000) {
    errors.push({
      field: "content",
      message: "Feedback content must be less than 10000 characters",
    });
  }

  return errors;
};
