require("dotenv").config();
import crypto from "crypto";

class HashService {
  async hashOtp(data: string) {
    return crypto
      .createHmac("sha256", process.env.HASH_SECRET_OTP as string)
      .update(data)
      .digest("hex");
  }
}

export default new HashService();
