require("dotenv").config();
const PORT = process.env.PORT || 3300;

import cors from "cors";
import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
const app = express();

import { DBConnect } from "./db";
import authRoute from "./routes/auth";

// Middlewares
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "10mb",
  })
);

// Routes
app.get("/", (_: Request, res: Response) => {
  res.send("Server Status: Running");
});

/**Server Storage as Static Hosting */
app.use("/storage", express.static("storage"));

app.use("/api/v1/auth", authRoute);

// MongoDB Connection
DBConnect()
  .then(() => {
    // Server Running
    app.listen(PORT, () => {
      console.log(`Server Listening on ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
