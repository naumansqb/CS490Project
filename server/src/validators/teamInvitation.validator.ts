// validators/teamInvitation.validator.ts

const VALID_TEAM_ROLES = ["owner", "mentor", "coach", "member", "viewer"];

export const validateTeamInvitation = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.email || typeof data.email !== "string" || data.email.trim() === "") {
    errors.push({ field: "email", message: "Email is required" });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push({ field: "email", message: "Invalid email format" });
    } else if (data.email.length > 255) {
      errors.push({
        field: "email",
        message: "Email must be less than 255 characters",
      });
    }
  }

  if (data.role && !VALID_TEAM_ROLES.includes(data.role)) {
    errors.push({
      field: "role",
      message: `Role must be one of: ${VALID_TEAM_ROLES.join(", ")}`,
    });
  }

  return errors;
};
