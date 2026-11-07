import mongoose from "mongoose";
import Component, { CATEGORIES, STATUSES } from "../models/Component.js";

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isOptionalString = (value) =>
  value === undefined || typeof value === "string";

const isNonNegativeInteger = (value) =>
  Number.isInteger(value) && value >= 0;

const invalidIdError = () => {
  const error = new Error("Invalid component ID");
  error.statusCode = 400;
  return error;
};

const notFoundError = () => {
  const error = new Error("Component not found");
  error.statusCode = 404;
  return error;
};

const validationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const isMongoId = (id) => typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);

const assertValidObjectId = (id) => {
  if (!isMongoId(id) || !mongoose.Types.ObjectId.isValid(id)) {
    throw invalidIdError();
  }
};

const collectPayloadErrors = (body, { isUpdate = false } = {}) => {
  const errors = [];
  const {
    name,
    category,
    manufacturer,
    quantity,
    status,
    location,
    notes,
  } = body;

  if (!isUpdate || name !== undefined) {
    if (!isNonEmptyString(name)) {
      errors.push("Name is required and must be a non-empty string");
    }
  }

  if (!isUpdate || category !== undefined) {
    if (!isNonEmptyString(category) || !CATEGORIES.includes(category)) {
      errors.push(`Category must be one of: ${CATEGORIES.join(", ")}`);
    }
  }

  if (manufacturer !== undefined && !isOptionalString(manufacturer)) {
    errors.push("Manufacturer must be a string");
  }

  if (quantity !== undefined && !isNonNegativeInteger(quantity)) {
    errors.push("Quantity must be a non-negative integer");
  }

  if (status !== undefined && !STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  if (location !== undefined && !isOptionalString(location)) {
    errors.push("Location must be a string");
  }

  if (notes !== undefined && !isOptionalString(notes)) {
    errors.push("Notes must be a string");
  }

  return errors;
};

const allowedFields = [
  "name",
  "category",
  "manufacturer",
  "quantity",
  "status",
  "location",
  "notes",
];

const pickComponentFields = (body) => {
  const data = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
    }
  }

  return data;
};

export const getComponents = async (req, res, next) => {
  try {
    const components = await Component.find().sort({ createdAt: -1 });
    res.status(200).json(components);
  } catch (error) {
    next(error);
  }
};

export const createComponent = async (req, res, next) => {
  try {
    const errors = collectPayloadErrors(req.body, { isUpdate: false });

    if (errors.length > 0) {
      throw validationError(errors.join(". "));
    }

    const component = await Component.create(pickComponentFields(req.body));
    res.status(201).json(component);
  } catch (error) {
    next(error);
  }
};

export const updateComponent = async (req, res, next) => {
  try {
    assertValidObjectId(req.params.id);

    const errors = collectPayloadErrors(req.body, { isUpdate: true });

    if (errors.length > 0) {
      throw validationError(errors.join(". "));
    }

    const updates = pickComponentFields(req.body);

    if (Object.keys(updates).length === 0) {
      throw validationError("Provide at least one field to update");
    }

    const component = await Component.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!component) {
      throw notFoundError();
    }

    res.status(200).json(component);
  } catch (error) {
    next(error);
  }
};

export const deleteComponent = async (req, res, next) => {
  try {
    assertValidObjectId(req.params.id);

    const component = await Component.findByIdAndDelete(req.params.id);

    if (!component) {
      throw notFoundError();
    }

    res.status(200).json({
      message: "Component deleted",
      id: component._id,
    });
  } catch (error) {
    next(error);
  }
};
