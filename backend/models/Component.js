import mongoose from "mongoose";

const CATEGORIES = ["Microcontroller", "Sensor", "Development Kit", "Other"];
const STATUSES = ["Available", "Deployed"];

const componentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(", ")}`,
      },
    },
    manufacturer: {
      type: String,
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: `Status must be one of: ${STATUSES.join(", ")}`,
      },
      default: "Available",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export { CATEGORIES, STATUSES };
export default mongoose.model("Component", componentSchema);
