export const validateEducation = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.userId) {
    errors.push({ field: "userId", message: "User ID is required" });
  }

  if (
    !data.institutionName ||
    typeof data.institutionName !== "string" ||
    data.institutionName.trim() === ""
  ) {
    errors.push({
      field: "institutionName",
      message: "Institution name is required",
    });
  }

  if (data.gpa !== undefined && data.gpa !== null) {
    const gpa = parseFloat(data.gpa);
    if (isNaN(gpa) || gpa < 0 || gpa > 9.99) {
      errors.push({ field: "gpa", message: "GPA must be between 0 and 9.99" });
    }
  }

  if (data.gpaScale !== undefined && data.gpaScale !== null) {
    const gpaScale = parseFloat(data.gpaScale);
    if (isNaN(gpaScale) || gpaScale < 0 || gpaScale > 9.99) {
      errors.push({
        field: "gpaScale",
        message: "GPA scale must be between 0 and 9.99",
      });
    }
  }

  if (
    data.gpa &&
    data.gpaScale &&
    parseFloat(data.gpa) > parseFloat(data.gpaScale)
  ) {
    errors.push({ field: "gpa", message: "GPA cannot exceed GPA scale" });
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

  if (data.graduationDate) {
    const graduationDate = new Date(data.graduationDate);
    if (isNaN(graduationDate.getTime())) {
      errors.push({
        field: "graduationDate",
        message: "Graduation date must be a valid date",
      });
    }
  }

  if (data.isCurrent && data.endDate) {
    errors.push({
      field: "endDate",
      message: "Current education should not have an end date",
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

export const validateEducationUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (
    data.institutionName !== undefined &&
    (typeof data.institutionName !== "string" ||
      data.institutionName.trim() === "")
  ) {
    errors.push({
      field: "institutionName",
      message: "Institution name cannot be empty",
    });
  }

  if (data.gpa !== undefined && data.gpa !== null) {
    const gpa = parseFloat(data.gpa);
    if (isNaN(gpa) || gpa < 0 || gpa > 9.99) {
      errors.push({ field: "gpa", message: "GPA must be between 0 and 9.99" });
    }
  }

  if (data.gpaScale !== undefined && data.gpaScale !== null) {
    const gpaScale = parseFloat(data.gpaScale);
    if (isNaN(gpaScale) || gpaScale < 0 || gpaScale > 9.99) {
      errors.push({
        field: "gpaScale",
        message: "GPA scale must be between 0 and 9.99",
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

  if (data.graduationDate !== undefined && data.graduationDate !== null) {
    const graduationDate = new Date(data.graduationDate);
    if (isNaN(graduationDate.getTime())) {
      errors.push({
        field: "graduationDate",
        message: "Graduation date must be a valid date",
      });
    }
  }

  if (data.isCurrent && data.endDate) {
    errors.push({
      field: "endDate",
      message: "Current education should not have an end date",
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
