import jwt from "jsonwebtoken";
import mongoose, { ObjectId } from "mongoose";

import refreshModel from "../models/refresh-model";

interface JwtPayload {
  _id: string;
}

class TokenService {
  async generateToken(payload: string | object) {
    const access_token = jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET as string,
      {
        expiresIn: "1m",
      }
    );

    const refresh_token = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET as string,
      {
        expiresIn: "1y",
      }
    );

    return {
      access_token,
      refresh_token,
    };
  }

  async storeRefreshToken(token: string, userId: mongoose.Types.ObjectId) {
    try {
      await refreshModel.create({
        token,
        userId,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async findRefreshToken(token: string, userId: string) {
    try {
      return await refreshModel.findOne({
        userId,
        token,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async verifyAccessToken(access_token: string) {
    return jwt.verify(
      access_token,
      process.env.JWT_ACCESS_SECRET as string
    ) as JwtPayload;
  }

  async verifyRefreshToken(refresh_token: string) {
    return jwt.verify(
      refresh_token,
      process.env.JWT_REFRESH_SECRET as string
    ) as JwtPayload;
  }

  async updateRefreshToken(
    userId: mongoose.Types.ObjectId,
    refresh_token: string
  ) {
    return await refreshModel.updateOne(
      {
        userId,
      },
      {
        token: refresh_token,
      }
    );
  }

  async removeToken(refresh_token: string) {
    return await refreshModel.deleteOne({
      token: refresh_token,
    });
  }
}

export default new TokenService();
