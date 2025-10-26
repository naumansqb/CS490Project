export const validateUserProfile = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.userId) {
    errors.push({ field: "userId", message: "User ID is required" });
  }

  if (data.email !== undefined && data.email !== null) {
    if (typeof data.email !== "string" || data.email.trim() === "") {
      errors.push({ field: "email", message: "Email must be a valid string" });
    } else if (data.email.length > 255) {
      errors.push({
        field: "email",
        message: "Email must be less than 255 characters",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push({
        field: "email",
        message: "Email must be a valid email address",
      });
    }
  }

  if (data.phoneNumber !== undefined && data.phoneNumber !== null) {
    if (
      typeof data.phoneNumber !== "string" ||
      data.phoneNumber.trim() === ""
    ) {
      errors.push({
        field: "phoneNumber",
        message: "Phone number must be a valid string",
      });
    } else if (data.phoneNumber.length > 20) {
      errors.push({
        field: "phoneNumber",
        message: "Phone number must be less than 20 characters",
      });
    } else if (!/^[\d\s\-\+\(\)]+$/.test(data.phoneNumber)) {
      errors.push({
        field: "phoneNumber",
        message: "Phone number must contain only digits, spaces, +, -, (, )",
      });
    }
  }

  if (data.industry !== undefined && data.industry !== null) {
    if (typeof data.industry !== "string" || data.industry.trim() === "") {
      errors.push({
        field: "industry",
        message: "Industry must be a valid string",
      });
    } else if (data.industry.length > 100) {
      errors.push({
        field: "industry",
        message: "Industry must be less than 100 characters",
      });
    }
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

  if (data.desiredSalaryMin !== undefined && data.desiredSalaryMin !== null) {
    const salary = parseFloat(data.desiredSalaryMin);
    if (isNaN(salary) || salary < 0) {
      errors.push({
        field: "desiredSalaryMin",
        message: "Minimum salary must be a positive number",
      });
    }
  }

  if (data.desiredSalaryMax !== undefined && data.desiredSalaryMax !== null) {
    const salary = parseFloat(data.desiredSalaryMax);
    if (isNaN(salary) || salary < 0) {
      errors.push({
        field: "desiredSalaryMax",
        message: "Maximum salary must be a positive number",
      });
    }
  }

  if (
    data.desiredSalaryMin &&
    data.desiredSalaryMax &&
    parseFloat(data.desiredSalaryMin) > parseFloat(data.desiredSalaryMax)
  ) {
    errors.push({
      field: "desiredSalaryMax",
      message: "Maximum salary must be greater than minimum salary",
    });
  }

  if (
    data.profileCompleteness !== undefined &&
    data.profileCompleteness !== null
  ) {
    const completeness = parseInt(data.profileCompleteness);
    if (isNaN(completeness) || completeness < 0 || completeness > 100) {
      errors.push({
        field: "profileCompleteness",
        message: "Profile completeness must be between 0 and 100",
      });
    }
  }

  const urlFields = [
    "profilePhotoUrl",
    "linkedinUrl",
    "githubUrl",
    "portfolioUrl",
    "websiteUrl",
  ];
  urlFields.forEach((field) => {
    if (
      data[field] &&
      typeof data[field] === "string" &&
      data[field].length > 500
    ) {
      errors.push({
        field,
        message: `${field} must be less than 500 characters`,
      });
    }
  });

  return errors;
};

export const validateUserProfileUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (data.yearsOfExperience !== undefined && data.yearsOfExperience !== null) {
    const years = parseFloat(data.yearsOfExperience);
    if (isNaN(years) || years < 0 || years > 99.9) {
      errors.push({
        field: "yearsOfExperience",
        message: "Years of experience must be between 0 and 99.9",
      });
    }
  }

  if (data.desiredSalaryMin !== undefined && data.desiredSalaryMin !== null) {
    const salary = parseFloat(data.desiredSalaryMin);
    if (isNaN(salary) || salary < 0) {
      errors.push({
        field: "desiredSalaryMin",
        message: "Minimum salary must be a positive number",
      });
    }
  }

  if (data.desiredSalaryMax !== undefined && data.desiredSalaryMax !== null) {
    const salary = parseFloat(data.desiredSalaryMax);
    if (isNaN(salary) || salary < 0) {
      errors.push({
        field: "desiredSalaryMax",
        message: "Maximum salary must be a positive number",
      });
    }
  }

  if (
    data.profileCompleteness !== undefined &&
    data.profileCompleteness !== null
  ) {
    const completeness = parseInt(data.profileCompleteness);
    if (isNaN(completeness) || completeness < 0 || completeness > 100) {
      errors.push({
        field: "profileCompleteness",
        message: "Profile completeness must be between 0 and 100",
      });
    }
  }

  return errors;
};
