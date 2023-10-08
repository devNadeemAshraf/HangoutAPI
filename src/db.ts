import mongoose from "mongoose";

const DB_URL = process.env.DB_URL as string;
export async function DBConnect() {
  await mongoose.connect(DB_URL);
  console.log('Mongodb Connection Successfull')

  const db = mongoose.connection;
  db.on("error", () => {
    console.error.bind(console, "Connection Error");
  });
  db.once("open", () => {
    console.log("Database Connected");
  });
}
