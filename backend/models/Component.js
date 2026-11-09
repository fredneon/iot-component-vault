import mongoose from "mongoose";

const CATEGORIES = ["Microcontroller", "Sensor", "Development Kit", "Other"];
const STATUSES = ["Available", "Deployed"];
const PROTOCOLS = [
  "UART",
  "SPI",
  "I2C",
  "CAN",
  "USB",
  "Ethernet",
  "Wi-Fi",
  "Bluetooth",
  "GPIO",
  "PWM",
  "Other",
];
const DATASHEET_URL_MAX_LENGTH = 2048;

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
    architecture: {
      type: String,
      trim: true,
    },
    operatingVoltage: {
      type: Number,
      min: [0, "Operating voltage cannot be negative"],
    },
    communicationProtocols: {
      type: [
        {
          type: String,
          enum: {
            values: PROTOCOLS,
            message: `Protocol must be one of: ${PROTOCOLS.join(", ")}`,
          },
        },
      ],
    },
    datasheetUrl: {
      type: String,
      trim: true,
      maxlength: [
        DATASHEET_URL_MAX_LENGTH,
        `Datasheet URL must be ${DATASHEET_URL_MAX_LENGTH} characters or fewer`,
      ],
    },
  },
  { timestamps: true }
);

export {
  CATEGORIES,
  STATUSES,
  PROTOCOLS,
  DATASHEET_URL_MAX_LENGTH,
};
export default mongoose.model("Component", componentSchema);
