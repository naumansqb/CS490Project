// validators/jobContact.validator.ts
export const validateJobContact = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.jobId) {
    errors.push({ field: "jobId", message: "Job ID is required" });
  }

  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    errors.push({ field: "name", message: "Name is required" });
  } else if (data.name.length > 255) {
    errors.push({
      field: "name",
      message: "Name must be less than 255 characters",
    });
  }

  if (data.role && data.role.length > 255) {
    errors.push({
      field: "role",
      message: "Role must be less than 255 characters",
    });
  }

  if (data.email !== undefined && data.email !== null && data.email !== "") {
    if (data.email.length > 255) {
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

  if (data.phone && data.phone.length > 50) {
    errors.push({
      field: "phone",
      message: "Phone must be less than 50 characters",
    });
  }

  return errors;
};

export const validateJobContactUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim() === "") {
      errors.push({ field: "name", message: "Name must be a valid string" });
    } else if (data.name.length > 255) {
      errors.push({
        field: "name",
        message: "Name must be less than 255 characters",
      });
    }
  }

  if (data.role !== undefined && data.role && data.role.length > 255) {
    errors.push({
      field: "role",
      message: "Role must be less than 255 characters",
    });
  }

  if (data.email !== undefined && data.email !== null && data.email !== "") {
    if (data.email.length > 255) {
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

  if (data.phone !== undefined && data.phone && data.phone.length > 50) {
    errors.push({
      field: "phone",
      message: "Phone must be less than 50 characters",
    });
  }

  return errors;
};
