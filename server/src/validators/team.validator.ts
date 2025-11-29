// validators/team.validator.ts

const VALID_TEAM_TYPES = ["career_center", "job_search_group", "mentorship_program"];
const VALID_TEAM_ROLES = ["owner", "mentor", "coach", "member", "viewer"];

export const validateTeam = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    errors.push({ field: "name", message: "Team name is required" });
  } else if (data.name.length > 255) {
    errors.push({
      field: "name",
      message: "Team name must be less than 255 characters",
    });
  }

  if (data.type && !VALID_TEAM_TYPES.includes(data.type)) {
    errors.push({
      field: "type",
      message: `Team type must be one of: ${VALID_TEAM_TYPES.join(", ")}`,
    });
  }

  if (data.maxMembers !== undefined && data.maxMembers !== null) {
    if (typeof data.maxMembers !== "number" || data.maxMembers < 1) {
      errors.push({
        field: "maxMembers",
        message: "Max members must be a positive number",
      });
    }
  }

  return errors;
};

export const validateTeamUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim() === "") {
      errors.push({ field: "name", message: "Team name cannot be empty" });
    } else if (data.name.length > 255) {
      errors.push({
        field: "name",
        message: "Team name must be less than 255 characters",
      });
    }
  }

  if (data.type !== undefined && !VALID_TEAM_TYPES.includes(data.type)) {
    errors.push({
      field: "type",
      message: `Team type must be one of: ${VALID_TEAM_TYPES.join(", ")}`,
    });
  }

  if (data.maxMembers !== undefined && data.maxMembers !== null) {
    if (typeof data.maxMembers !== "number" || data.maxMembers < 1) {
      errors.push({
        field: "maxMembers",
        message: "Max members must be a positive number",
      });
    }
  }

  return errors;
};

export const validateMemberRoleUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.role || !VALID_TEAM_ROLES.includes(data.role)) {
    errors.push({
      field: "role",
      message: `Role must be one of: ${VALID_TEAM_ROLES.join(", ")}`,
    });
  }

  return errors;
};
