import mongoose from "mongoose";
import Component, {
  CATEGORIES,
  DATASHEET_URL_MAX_LENGTH,
  PROTOCOLS,
  STATUSES,
} from "../models/Component.js";

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isOptionalString = (value) =>
  value === undefined || typeof value === "string";

const isNonNegativeInteger = (value) =>
  Number.isInteger(value) && value >= 0;

const isNonNegativeNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

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

const canonicalizeProtocol = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const compact = trimmed.toLowerCase().replace(/²/g, "2").replace(/\s+/g, "");

  if (compact === "i2c") {
    return "I2C";
  }

  if (compact === "wifi" || compact === "wi-fi") {
    return "Wi-Fi";
  }

  return PROTOCOLS.find((protocol) => protocol.toLowerCase() === trimmed.toLowerCase()) || null;
};

const normalizeProtocolList = (value) => {
  if (!Array.isArray(value)) {
    return { error: "Communication protocols must be an array of strings" };
  }

  const unique = [];
  const seen = new Set();

  for (const item of value) {
    const canonical = canonicalizeProtocol(item);

    if (!canonical) {
      return {
        error: `Communication protocol must be one of: ${PROTOCOLS.join(", ")}`,
      };
    }

    if (!seen.has(canonical)) {
      seen.add(canonical);
      unique.push(canonical);
    }
  }

  return { value: unique };
};

const isHttpUrl = (value) => {
  if (value.length > DATASHEET_URL_MAX_LENGTH) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
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
    architecture,
    operatingVoltage,
    communicationProtocols,
    datasheetUrl,
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

  if (architecture !== undefined && !isOptionalString(architecture)) {
    errors.push("Architecture must be a string");
  }

  if (operatingVoltage !== undefined && operatingVoltage !== null && operatingVoltage !== "") {
    const voltage = typeof operatingVoltage === "number"
      ? operatingVoltage
      : Number(operatingVoltage);

    if (!isNonNegativeNumber(voltage)) {
      errors.push("Operating voltage must be a non-negative number");
    }
  }

  if (communicationProtocols !== undefined) {
    const normalized = normalizeProtocolList(communicationProtocols);
    if (normalized.error) {
      errors.push(normalized.error);
    }
  }

  if (datasheetUrl !== undefined && datasheetUrl !== "") {
    if (!isOptionalString(datasheetUrl) || !isHttpUrl(datasheetUrl.trim())) {
      errors.push("Datasheet URL must be a valid http or https URL");
    }
  }

  return errors;
};

const stringFields = [
  "name",
  "category",
  "manufacturer",
  "status",
  "location",
  "notes",
];

const pickComponentFields = (body) => {
  const data = {};

  for (const field of stringFields) {
    if (body[field] !== undefined) {
      data[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
    }
  }

  if (body.quantity !== undefined) {
    data.quantity = body.quantity;
  }

  if (isNonEmptyString(body.architecture)) {
    data.architecture = body.architecture.trim();
  }

  if (body.operatingVoltage !== undefined && body.operatingVoltage !== null && body.operatingVoltage !== "") {
    data.operatingVoltage = typeof body.operatingVoltage === "number"
      ? body.operatingVoltage
      : Number(body.operatingVoltage);
  }

  if (body.communicationProtocols !== undefined) {
    const normalized = normalizeProtocolList(body.communicationProtocols);
    if (!normalized.error) {
      data.communicationProtocols = normalized.value;
    }
  }

  if (isNonEmptyString(body.datasheetUrl)) {
    data.datasheetUrl = body.datasheetUrl.trim();
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
