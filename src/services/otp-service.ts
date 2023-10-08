import crypto from "crypto";
import twilio from "twilio";
import hashService from "./hash-service";

const TWILIO_SID = process.env.TWILIO_SID as string;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN as string;
const TWILIO_NUMBER = process.env.TWILIO_NUMBER as string;

const twilioInstance = twilio(TWILIO_SID, TWILIO_TOKEN, {
  lazyLoading: true,
});

class OtpService {
  async generateOtp() {
    return crypto.randomInt(1000, 9999).toString();
  }

  async sendBySms(phone: string, otp: string) {
    return await twilioInstance.messages.create({
      to: phone,
      from: TWILIO_NUMBER,
      body: `Your Hangour OTP is: ${otp}`,
    });
  }

  async verifyOtp(hashedOtp: string, data: string) {
    const computedHash = await hashService.hashOtp(data);
    return computedHash === hashedOtp;
  }
}

export default new OtpService();
