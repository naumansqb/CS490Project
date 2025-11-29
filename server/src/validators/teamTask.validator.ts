// validators/teamTask.validator.ts

const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];
const VALID_STATUSES = ["pending", "in_progress", "completed", "cancelled"];

export const validateTeamTask = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.assignedTo || typeof data.assignedTo !== "string" || data.assignedTo.trim() === "") {
    errors.push({ field: "assignedTo", message: "Assignee is required" });
  }

  if (!data.title || typeof data.title !== "string" || data.title.trim() === "") {
    errors.push({ field: "title", message: "Task title is required" });
  } else if (data.title.length > 500) {
    errors.push({
      field: "title",
      message: "Task title must be less than 500 characters",
    });
  }

  if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
    errors.push({
      field: "priority",
      message: `Priority must be one of: ${VALID_PRIORITIES.join(", ")}`,
    });
  }

  if (data.dueDate) {
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push({ field: "dueDate", message: "Invalid due date format" });
    }
  }

  return errors;
};

export const validateTaskUpdate = (
  data: any
): Array<{ field: string; message: string }> => {
  const errors: Array<{ field: string; message: string }> = [];

  if (data.title !== undefined) {
    if (typeof data.title !== "string" || data.title.trim() === "") {
      errors.push({ field: "title", message: "Task title cannot be empty" });
    } else if (data.title.length > 500) {
      errors.push({
        field: "title",
        message: "Task title must be less than 500 characters",
      });
    }
  }

  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.push({
      field: "status",
      message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  if (data.priority !== undefined && !VALID_PRIORITIES.includes(data.priority)) {
    errors.push({
      field: "priority",
      message: `Priority must be one of: ${VALID_PRIORITIES.join(", ")}`,
    });
  }

  if (data.dueDate !== undefined && data.dueDate !== null) {
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push({ field: "dueDate", message: "Invalid due date format" });
    }
  }

  return errors;
};
