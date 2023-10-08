import mongoose, { ObjectId } from "mongoose";
const Schema = mongoose.Schema;

const refreshSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export interface IRefresh extends mongoose.Document {
  token: string;
  userId: ObjectId;
}

export default mongoose.model("Refresh", refreshSchema, "tokens");
