import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["student", "staff", "faculty"],
      default: "student",
    },
    department: {
      type: String,
      required: true,
    },
    preferences: {
      language: {
        type: String,
        enum: ["english", "tamil", "both"],
        default: "english",
      },
      voiceEnabled: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
