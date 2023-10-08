import { Router } from "express";

import authController from "../controllers/auth-controller";

import authMiddleware from "../middlewares/auth-middleware";

const authRoute = Router();

authRoute.post("/send-otp", authController.sendOtp);
authRoute.post("/verify-otp", authController.verifyOtp);
authRoute.post("/activate-user", authMiddleware, authController.activateUser);
authRoute.post("/logout", authMiddleware, authController.logout);
authRoute.get("/refresh", authController.refresh);

export default authRoute;
