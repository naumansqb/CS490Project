// validators/jobOpportunity.validator.ts
export const validateJobOpportunity = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.userId) {
    errors.push({ field: "userId", message: "User ID is required" });
  }

  if (
    !data.title ||
    typeof data.title !== "string" ||
    data.title.trim() === ""
  ) {
    errors.push({ field: "title", message: "Title is required" });
  } else if (data.title.length > 255) {
    errors.push({
      field: "title",
      message: "Title must be less than 255 characters",
    });
  }

  if (
    !data.company ||
    typeof data.company !== "string" ||
    data.company.trim() === ""
  ) {
    errors.push({ field: "company", message: "Company is required" });
  } else if (data.company.length > 255) {
    errors.push({
      field: "company",
      message: "Company must be less than 255 characters",
    });
  }

  if (
    !data.industry ||
    typeof data.industry !== "string" ||
    data.industry.trim() === ""
  ) {
    errors.push({ field: "industry", message: "Industry is required" });
  } else if (data.industry.length > 100) {
    errors.push({
      field: "industry",
      message: "Industry must be less than 100 characters",
    });
  }

  if (
    !data.jobType ||
    typeof data.jobType !== "string" ||
    data.jobType.trim() === ""
  ) {
    errors.push({ field: "jobType", message: "Job type is required" });
  } else if (data.jobType.length > 50) {
    errors.push({
      field: "jobType",
      message: "Job type must be less than 50 characters",
    });
  }

  if (data.location && data.location.length > 255) {
    errors.push({
      field: "location",
      message: "Location must be less than 255 characters",
    });
  }

  if (data.salaryMin && data.salaryMin.length > 50) {
    errors.push({
      field: "salaryMin",
      message: "Salary min must be less than 50 characters",
    });
  }

  if (data.salaryMax && data.salaryMax.length > 50) {
    errors.push({
      field: "salaryMax",
      message: "Salary max must be less than 50 characters",
    });
  }

  if (
    data.deadline &&
    !(data.deadline instanceof Date) &&
    isNaN(Date.parse(data.deadline))
  ) {
    errors.push({
      field: "deadline",
      message: "Deadline must be a valid date",
    });
  }

  return errors;
};

export const validateJobOpportunityUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (data.title !== undefined) {
    if (typeof data.title !== "string" || data.title.trim() === "") {
      errors.push({ field: "title", message: "Title must be a valid string" });
    } else if (data.title.length > 255) {
      errors.push({
        field: "title",
        message: "Title must be less than 255 characters",
      });
    }
  }

  if (data.company !== undefined) {
    if (typeof data.company !== "string" || data.company.trim() === "") {
      errors.push({
        field: "company",
        message: "Company must be a valid string",
      });
    } else if (data.company.length > 255) {
      errors.push({
        field: "company",
        message: "Company must be less than 255 characters",
      });
    }
  }

  if (data.industry !== undefined) {
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

  if (data.jobType !== undefined) {
    if (typeof data.jobType !== "string" || data.jobType.trim() === "") {
      errors.push({
        field: "jobType",
        message: "Job type must be a valid string",
      });
    } else if (data.jobType.length > 50) {
      errors.push({
        field: "jobType",
        message: "Job type must be less than 50 characters",
      });
    }
  }

  if (
    data.location !== undefined &&
    data.location &&
    data.location.length > 255
  ) {
    errors.push({
      field: "location",
      message: "Location must be less than 255 characters",
    });
  }

  if (
    data.salaryMin !== undefined &&
    data.salaryMin &&
    data.salaryMin.length > 50
  ) {
    errors.push({
      field: "salaryMin",
      message: "Salary min must be less than 50 characters",
    });
  }

  if (
    data.salaryMax !== undefined &&
    data.salaryMax &&
    data.salaryMax.length > 50
  ) {
    errors.push({
      field: "salaryMax",
      message: "Salary max must be less than 50 characters",
    });
  }

  if (
    data.deadline !== undefined &&
    data.deadline &&
    isNaN(Date.parse(data.deadline))
  ) {
    errors.push({
      field: "deadline",
      message: "Deadline must be a valid date",
    });
  }

  return errors;
};
