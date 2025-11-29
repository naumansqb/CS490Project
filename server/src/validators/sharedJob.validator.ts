// validators/sharedJob.validator.ts

const VALID_VISIBILITY_OPTIONS = ["all_members", "mentors_only", "specific_members"];

export const validateShareJob = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.jobId || typeof data.jobId !== "string" || data.jobId.trim() === "") {
    errors.push({ field: "jobId", message: "Job ID is required" });
  }

  if (data.visibility && !VALID_VISIBILITY_OPTIONS.includes(data.visibility)) {
    errors.push({
      field: "visibility",
      message: `Visibility must be one of: ${VALID_VISIBILITY_OPTIONS.join(", ")}`,
    });
  }

  return errors;
};

export const validateJobComment = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.content || typeof data.content !== "string" || data.content.trim() === "") {
    errors.push({ field: "content", message: "Comment content is required" });
  } else if (data.content.length > 5000) {
    errors.push({
      field: "content",
      message: "Comment must be less than 5000 characters",
    });
  }

  if (data.mentions && !Array.isArray(data.mentions)) {
    errors.push({
      field: "mentions",
      message: "Mentions must be an array of user IDs",
    });
  }

  return errors;
};
