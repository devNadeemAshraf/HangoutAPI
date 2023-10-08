import { Request, Response } from "express";

import Jimp from "jimp";
import path from "path";

import otpService from "../services/otp-service";
import hashService from "../services/hash-service";
import userService from "../services/user-service";
import tokenService from "../services/token-service";

import UserDto from "../dtos/user-dto";

class AuthController {
  async sendOtp(req: Request, res: Response) {
    const { phone } = req.body;
    // Validate
    if (!phone) {
      return res.status(400).json({
        message: "One or more fields are missing.",
      });
    }

    // Generate 4 Digit Random OTP
    const otp = await otpService.generateOtp();

    // Hash OTP
    /**
     * ttl - time to live
     * 2 mins expiry time
     */
    const ttl = 1000 * 60 * 2;
    const expires = Date.now() + ttl; // Current Time + 2mins is the expiry
    const data = `${phone}.${otp}.${expires}`;

    const hashedOtp = await hashService.hashOtp(data);

    // Send OTP
    try {
      // TESTING
      // await otpService.sendBySms(phone, otp);

      return res.status(200).json({
        hash: `${hashedOtp}.${expires}`,
        phone,
        otp,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error: " + error,
      });
    }
  }

  async verifyOtp(req: Request, res: Response) {
    const { phone, otp, hash } = req.body;

    // Validate
    if (!phone || !otp || !hash) {
      return res.status(400).json({
        message: "One or more fields are missing.",
      });
    }

    const [hashedOtp, expires] = hash.split(".");

    // We have to compate number with number
    if (Date.now() > +expires) {
      return res.status(400).json({
        message: "OTP Expired",
      });
    }

    const data = `${phone}.${otp}.${expires}`;
    const isValid = await otpService.verifyOtp(hashedOtp, data);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    let user;

    // Check if User is already registered
    try {
      user = await userService.findUser({
        phone,
      });
      if (!user) {
        user = await userService.createUser({
          phone,
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Error: " + error,
      });
    }

    // JWT
    const { access_token, refresh_token } = await tokenService.generateToken({
      _id: user?._id,
    });

    // Store Refresh Token in DB
    await tokenService.storeRefreshToken(refresh_token, user._id);

    res.cookie("refreshToken", refresh_token, {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 Days
      httpOnly: true,
    });

    res.cookie("accessToken", access_token, {
      maxAge: 1000 * 60 * 60 * 1, // 1 Hour
      httpOnly: true,
    });

    const userDto = new UserDto(user);

    return res.json({
      user: userDto,
      auth: true,
    });
  }

  async activateUser(req: Request, res: Response) {
    const user = req.user;
    const { name, avatar } = req.body;

    if (!name) {
      res.status(400).json({
        message: "One or more fields are missing",
      });
    }

    // Check If Image is of type: png, jpg, jpeg
    if (
      !(
        avatar.includes("png") ||
        avatar.includes("jpg") ||
        avatar.includes("jpeg")
      )
    ) {
      return res.status(401).json({
        message: "Invalid Image Type",
      });
    }

    // Image parse
    const buffer = Buffer.from(
      avatar.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
      "base64"
    );

    const imagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;

    try {
      const jimpResp = Jimp.read(buffer);
      (await jimpResp)
        .resize(150, Jimp.AUTO)
        .write(path.resolve(__dirname, `../storage/${imagePath}`));
    } catch (error) {
      return res.status(500).json({
        message: "Error: " + error,
      });
    }

    const userId = user._id;

    try {
      // Update User
      const userFromDb = await userService.findUser({
        _id: userId,
      });

      if (!userFromDb) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      userFromDb.activated = true;
      userFromDb.name = name;
      userFromDb.avatar = `/storage/${imagePath}`;
      userFromDb.save();

      return res.status(200).json({
        user: new UserDto(userFromDb),
        message: "Activation Successfull",
        auth: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error: " + error,
      });
    }
  }

  async refresh(req: Request, res: Response) {
    // Get Token from Cookie
    const { refreshToken: refreshTokenFromCookie } = req.cookies;

    let userDataFromToken;

    try {
      // Verify Refresh Token
      userDataFromToken = await tokenService.verifyRefreshToken(
        refreshTokenFromCookie
      );

      // If Invalid Token
      if (!userDataFromToken) {
        return res.status(401).json({
          message: "Invalid Token or User",
        });
      }

      // Check DB or revoked token
      const tokenFromDb = await tokenService.findRefreshToken(
        refreshTokenFromCookie,
        userDataFromToken._id
      );

      // If revoked
      if (!tokenFromDb) {
        return res.status(401).json({
          message: "Invalid Token or User",
        });
      }

      // Check If id in toke has a valid user
      const userFromDb = await userService.findUser({
        _id: userDataFromToken._id,
      });

      // If invalid user
      if (!userFromDb) {
        return res.status(401).json({
          message: "Invalid User",
        });
      }

      // Generate new tokens
      const { access_token, refresh_token } = await tokenService.generateToken({
        _id: userFromDb?._id,
      });

      // Update Refresh Token in DB
      await tokenService.updateRefreshToken(userFromDb._id, refresh_token);

      // Set Cookie
      res.cookie("refreshToken", refresh_token, {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 Days
        httpOnly: true,
      });

      res.cookie("accessToken", access_token, {
        maxAge: 1000 * 60 * 60 * 1, // 1 Hour
        httpOnly: true,
      });

      // return resp
      const updatedUser = new UserDto(userFromDb);
      return res.status(200).json({
        user: updatedUser,
        auth: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error: " + error,
      });
    }
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.cookies;
    // Delete Token from DB
    await tokenService.removeToken(refreshToken);
    // Delete Cookies
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    res.status(200).json({
      user: {
        _id: "",
        name: "",
        avatar: "",
        phone: "",
        activated: false,
        createdAt: "",
      },
      auth: false,
    });
  }
}

export default new AuthController();
