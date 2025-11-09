// validators/applicationHistory.validator.ts
const VALID_STATUSES = [
  "interested",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
];

export const validateApplicationHistory = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.jobId) {
    errors.push({ field: "jobId", message: "Job ID is required" });
  }

  if (
    !data.status ||
    typeof data.status !== "string" ||
    data.status.trim() === ""
  ) {
    errors.push({ field: "status", message: "Status is required" });
  } else if (!VALID_STATUSES.includes(data.status)) {
    errors.push({
      field: "status",
      message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  return errors;
};

export const validateApplicationHistoryUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (data.status !== undefined) {
    if (typeof data.status !== "string" || data.status.trim() === "") {
      errors.push({
        field: "status",
        message: "Status must be a valid string",
      });
    } else if (!VALID_STATUSES.includes(data.status)) {
      errors.push({
        field: "status",
        message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }
  }

  return errors;
};
