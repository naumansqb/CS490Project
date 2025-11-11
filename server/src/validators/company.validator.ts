// validators/company.validator.ts
export const validateCompany = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    errors.push({ field: "name", message: "Company name is required" });
  } else if (data.name.length > 255) {
    errors.push({
      field: "name",
      message: "Company name must be less than 255 characters",
    });
  }

  if (data.size && data.size.length > 50) {
    errors.push({
      field: "size",
      message: "Company size must be less than 50 characters",
    });
  }

  if (data.industry && data.industry.length > 100) {
    errors.push({
      field: "industry",
      message: "Industry must be less than 100 characters",
    });
  }

  if (data.location && data.location.length > 255) {
    errors.push({
      field: "location",
      message: "Location must be less than 255 characters",
    });
  }

  if (data.website && data.website.length > 500) {
    errors.push({
      field: "website",
      message: "Website must be less than 500 characters",
    });
  }

  if (data.logoUrl && data.logoUrl.length > 500) {
    errors.push({
      field: "logoUrl",
      message: "Logo URL must be less than 500 characters",
    });
  }

  if (data.glassdoorRating !== undefined && data.glassdoorRating !== null) {
    const rating = parseFloat(data.glassdoorRating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.push({
        field: "glassdoorRating",
        message: "Glassdoor rating must be between 0 and 5",
      });
    }
  }

  if (data.contactInfo && typeof data.contactInfo !== "object") {
    errors.push({
      field: "contactInfo",
      message: "Contact info must be a valid object",
    });
  }

  return errors;
};

export const validateCompanyUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim() === "") {
      errors.push({
        field: "name",
        message: "Company name must be a valid string",
      });
    } else if (data.name.length > 255) {
      errors.push({
        field: "name",
        message: "Company name must be less than 255 characters",
      });
    }
  }

  if (data.size !== undefined && data.size && data.size.length > 50) {
    errors.push({
      field: "size",
      message: "Company size must be less than 50 characters",
    });
  }

  if (
    data.industry !== undefined &&
    data.industry &&
    data.industry.length > 100
  ) {
    errors.push({
      field: "industry",
      message: "Industry must be less than 100 characters",
    });
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

  if (data.website !== undefined && data.website && data.website.length > 500) {
    errors.push({
      field: "website",
      message: "Website must be less than 500 characters",
    });
  }

  if (data.logoUrl !== undefined && data.logoUrl && data.logoUrl.length > 500) {
    errors.push({
      field: "logoUrl",
      message: "Logo URL must be less than 500 characters",
    });
  }

  if (data.glassdoorRating !== undefined && data.glassdoorRating !== null) {
    const rating = parseFloat(data.glassdoorRating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.push({
        field: "glassdoorRating",
        message: "Glassdoor rating must be between 0 and 5",
      });
    }
  }

  if (data.contactInfo !== undefined && typeof data.contactInfo !== "object") {
    errors.push({
      field: "contactInfo",
      message: "Contact info must be a valid object",
    });
  }

  return errors;
};
