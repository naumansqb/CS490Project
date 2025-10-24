export const validateCertification = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.userId) {
    errors.push({ field: "userId", message: "User ID is required" });
  }

  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    errors.push({ field: "name", message: "Certification name is required" });
  } else if (data.name.length > 255) {
    errors.push({
      field: "name",
      message: "Certification name must be less than 255 characters",
    });
  }

  if (
    !data.issuingOrganization ||
    typeof data.issuingOrganization !== "string" ||
    data.issuingOrganization.trim() === ""
  ) {
    errors.push({
      field: "issuingOrganization",
      message: "Issuing organization is required",
    });
  } else if (data.issuingOrganization.length > 255) {
    errors.push({
      field: "issuingOrganization",
      message: "Issuing organization must be less than 255 characters",
    });
  }

  if (!data.issueDate) {
    errors.push({ field: "issueDate", message: "Issue date is required" });
  } else {
    const issueDate = new Date(data.issueDate);
    if (isNaN(issueDate.getTime())) {
      errors.push({
        field: "issueDate",
        message: "Issue date must be a valid date",
      });
    }
  }

  if (data.expirationDate && !data.doesNotExpire) {
    const expirationDate = new Date(data.expirationDate);
    if (isNaN(expirationDate.getTime())) {
      errors.push({
        field: "expirationDate",
        message: "Expiration date must be a valid date",
      });
    } else if (data.issueDate) {
      const issueDate = new Date(data.issueDate);
      if (expirationDate < issueDate) {
        errors.push({
          field: "expirationDate",
          message: "Expiration date must be after issue date",
        });
      }
    }
  }

  if (data.doesNotExpire && data.expirationDate) {
    errors.push({
      field: "expirationDate",
      message:
        "Certification marked as does not expire should not have an expiration date",
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

export const validateCertificationUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim() === "") {
      errors.push({
        field: "name",
        message: "Certification name cannot be empty",
      });
    } else if (data.name.length > 255) {
      errors.push({
        field: "name",
        message: "Certification name must be less than 255 characters",
      });
    }
  }

  if (data.issuingOrganization !== undefined) {
    if (
      typeof data.issuingOrganization !== "string" ||
      data.issuingOrganization.trim() === ""
    ) {
      errors.push({
        field: "issuingOrganization",
        message: "Issuing organization cannot be empty",
      });
    } else if (data.issuingOrganization.length > 255) {
      errors.push({
        field: "issuingOrganization",
        message: "Issuing organization must be less than 255 characters",
      });
    }
  }

  if (data.issueDate !== undefined) {
    const issueDate = new Date(data.issueDate);
    if (isNaN(issueDate.getTime())) {
      errors.push({
        field: "issueDate",
        message: "Issue date must be a valid date",
      });
    }
  }

  if (data.expirationDate !== undefined && data.expirationDate !== null) {
    const expirationDate = new Date(data.expirationDate);
    if (isNaN(expirationDate.getTime())) {
      errors.push({
        field: "expirationDate",
        message: "Expiration date must be a valid date",
      });
    }
  }

  if (data.doesNotExpire && data.expirationDate) {
    errors.push({
      field: "expirationDate",
      message:
        "Certification marked as does not expire should not have an expiration date",
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
