import { JwtPayload } from "jsonwebtoken";
import mongoose, { Date } from "mongoose";

// custom_typings/express/index.d.ts
declare global {
  declare namespace Express {
    interface Request {
      user: any;
    }
  }
}
