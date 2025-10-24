export const validateSkill = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.userId) {
    errors.push({ field: "userId", message: "User ID is required" });
  }

  if (
    !data.skillName ||
    typeof data.skillName !== "string" ||
    data.skillName.trim() === ""
  ) {
    errors.push({ field: "skillName", message: "Skill name is required" });
  } else if (data.skillName.length > 100) {
    errors.push({
      field: "skillName",
      message: "Skill name must be less than 100 characters",
    });
  }

  if (data.skillCategory && data.skillCategory.length > 100) {
    errors.push({
      field: "skillCategory",
      message: "Skill category must be less than 100 characters",
    });
  }

  if (data.proficiencyLevel && data.proficiencyLevel.length > 50) {
    errors.push({
      field: "proficiencyLevel",
      message: "Proficiency level must be less than 50 characters",
    });
  }

  if (data.yearsOfExperience !== undefined && data.yearsOfExperience !== null) {
    const years = parseFloat(data.yearsOfExperience);
    if (isNaN(years) || years < 0 || years > 99.9) {
      errors.push({
        field: "yearsOfExperience",
        message: "Years of experience must be between 0 and 99.9",
      });
    }
  }

  if (data.displayOrder !== undefined && data.displayOrder !== null) {
    const order = parseInt(data.displayOrder);
    if (isNaN(order) || order < 0) {
      errors.push({
        field: "displayOrder",
        message: "Display order must be a non-negative number",
      });
    }
  }

  return errors;
};

export const validateSkillUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (data.skillName !== undefined) {
    if (typeof data.skillName !== "string" || data.skillName.trim() === "") {
      errors.push({
        field: "skillName",
        message: "Skill name cannot be empty",
      });
    } else if (data.skillName.length > 100) {
      errors.push({
        field: "skillName",
        message: "Skill name must be less than 100 characters",
      });
    }
  }

  if (
    data.skillCategory !== undefined &&
    data.skillCategory !== null &&
    data.skillCategory.length > 100
  ) {
    errors.push({
      field: "skillCategory",
      message: "Skill category must be less than 100 characters",
    });
  }

  if (
    data.proficiencyLevel !== undefined &&
    data.proficiencyLevel !== null &&
    data.proficiencyLevel.length > 50
  ) {
    errors.push({
      field: "proficiencyLevel",
      message: "Proficiency level must be less than 50 characters",
    });
  }

  if (data.yearsOfExperience !== undefined && data.yearsOfExperience !== null) {
    const years = parseFloat(data.yearsOfExperience);
    if (isNaN(years) || years < 0 || years > 99.9) {
      errors.push({
        field: "yearsOfExperience",
        message: "Years of experience must be between 0 and 99.9",
      });
    }
  }

  if (data.displayOrder !== undefined && data.displayOrder !== null) {
    const order = parseInt(data.displayOrder);
    if (isNaN(order) || order < 0) {
      errors.push({
        field: "displayOrder",
        message: "Display order must be a non-negative number",
      });
    }
  }

  return errors;
};
