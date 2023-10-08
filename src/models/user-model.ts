import mongoose, { Date } from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: false,
      default: "",
    },
    username: {
      type: String,
      required: false,
      unique: true,
      default: "",
    },
    avatar: {
      type: String,
      required: false,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      default: "",
    },
    activated: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export interface IUser extends mongoose.Document {
  name: string;
  username: boolean;
  avatar: string;
  phone: boolean;
  email: string;
  activated: boolean;
}

export default mongoose.model("User", userSchema, "users");
