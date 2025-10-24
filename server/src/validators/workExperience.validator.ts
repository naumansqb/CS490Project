export const validateWorkExperience = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.userId) {
    errors.push({ field: "userId", message: "User ID is required" });
  }

  if (
    !data.companyName ||
    typeof data.companyName !== "string" ||
    data.companyName.trim() === ""
  ) {
    errors.push({ field: "companyName", message: "Company name is required" });
  }

  if (
    !data.positionTitle ||
    typeof data.positionTitle !== "string" ||
    data.positionTitle.trim() === ""
  ) {
    errors.push({
      field: "positionTitle",
      message: "Position title is required",
    });
  }

  if (!data.startDate) {
    errors.push({ field: "startDate", message: "Start date is required" });
  } else {
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

  if (data.isCurrent && data.endDate) {
    errors.push({
      field: "endDate",
      message: "Current position should not have an end date",
    });
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

export const validateWorkExperienceUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (
    data.companyName !== undefined &&
    (typeof data.companyName !== "string" || data.companyName.trim() === "")
  ) {
    errors.push({
      field: "companyName",
      message: "Company name cannot be empty",
    });
  }

  if (
    data.positionTitle !== undefined &&
    (typeof data.positionTitle !== "string" || data.positionTitle.trim() === "")
  ) {
    errors.push({
      field: "positionTitle",
      message: "Position title cannot be empty",
    });
  }

  if (data.startDate !== undefined) {
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

  if (data.isCurrent && data.endDate) {
    errors.push({
      field: "endDate",
      message: "Current position should not have an end date",
    });
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
