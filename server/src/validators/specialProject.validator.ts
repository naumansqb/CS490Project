export const validateSpecialProject = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.userId) {
    errors.push({ field: "userId", message: "User ID is required" });
  }

  if (
    !data.projectName ||
    typeof data.projectName !== "string" ||
    data.projectName.trim() === ""
  ) {
    errors.push({ field: "projectName", message: "Project name is required" });
  } else if (data.projectName.length > 255) {
    errors.push({
      field: "projectName",
      message: "Project name must be less than 255 characters",
    });
  }

  if (
    !data.description ||
    typeof data.description !== "string" ||
    data.description.trim() === ""
  ) {
    errors.push({ field: "description", message: "Description is required" });
  }

  if (data.startDate) {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push({
        field: "startDate",
        message: "Start date must be a valid date",
      });
    }
  }

  if (data.endDate) {
    const endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push({
        field: "endDate",
        message: "End date must be a valid date",
      });
    } else if (data.startDate) {
      const startDate = new Date(data.startDate);
      if (endDate < startDate) {
        errors.push({
          field: "endDate",
          message: "End date must be after start date",
        });
      }
    }
  }

  if (data.status && data.status.length > 50) {
    errors.push({
      field: "status",
      message: "Status must be less than 50 characters",
    });
  }

  if (data.projectUrl && data.projectUrl.length > 500) {
    errors.push({
      field: "projectUrl",
      message: "Project URL must be less than 500 characters",
    });
  }

  if (data.repositoryUrl && data.repositoryUrl.length > 500) {
    errors.push({
      field: "repositoryUrl",
      message: "Repository URL must be less than 500 characters",
    });
  }

  if (data.skillsDemonstrated && !Array.isArray(data.skillsDemonstrated)) {
    errors.push({
      field: "skillsDemonstrated",
      message: "Skills demonstrated must be an array",
    });
  } else if (data.skillsDemonstrated) {
    const invalidSkills = data.skillsDemonstrated.filter(
      (skill: any) => typeof skill !== "string" || skill.length > 100
    );
    if (invalidSkills.length > 0) {
      errors.push({
        field: "skillsDemonstrated",
        message: "Each skill must be a string with less than 100 characters",
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

export const validateSpecialProjectUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (data.projectName !== undefined) {
    if (
      typeof data.projectName !== "string" ||
      data.projectName.trim() === ""
    ) {
      errors.push({
        field: "projectName",
        message: "Project name cannot be empty",
      });
    } else if (data.projectName.length > 255) {
      errors.push({
        field: "projectName",
        message: "Project name must be less than 255 characters",
      });
    }
  }

  if (data.description !== undefined) {
    if (
      typeof data.description !== "string" ||
      data.description.trim() === ""
    ) {
      errors.push({
        field: "description",
        message: "Description cannot be empty",
      });
    }
  }

  if (data.startDate !== undefined && data.startDate !== null) {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push({
        field: "startDate",
        message: "Start date must be a valid date",
      });
    }
  }

  if (data.endDate !== undefined && data.endDate !== null) {
    const endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push({
        field: "endDate",
        message: "End date must be a valid date",
      });
    }
  }

  if (
    data.status !== undefined &&
    data.status !== null &&
    data.status.length > 50
  ) {
    errors.push({
      field: "status",
      message: "Status must be less than 50 characters",
    });
  }

  if (
    data.projectUrl !== undefined &&
    data.projectUrl !== null &&
    data.projectUrl.length > 500
  ) {
    errors.push({
      field: "projectUrl",
      message: "Project URL must be less than 500 characters",
    });
  }

  if (
    data.repositoryUrl !== undefined &&
    data.repositoryUrl !== null &&
    data.repositoryUrl.length > 500
  ) {
    errors.push({
      field: "repositoryUrl",
      message: "Repository URL must be less than 500 characters",
    });
  }

  if (data.skillsDemonstrated !== undefined) {
    if (!Array.isArray(data.skillsDemonstrated)) {
      errors.push({
        field: "skillsDemonstrated",
        message: "Skills demonstrated must be an array",
      });
    } else {
      const invalidSkills = data.skillsDemonstrated.filter(
        (skill: any) => typeof skill !== "string" || skill.length > 100
      );
      if (invalidSkills.length > 0) {
        errors.push({
          field: "skillsDemonstrated",
          message: "Each skill must be a string with less than 100 characters",
        });
      }
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
