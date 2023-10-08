import { IUser } from "../models/user-model";
import { Date, ObjectId } from "mongoose";

export default class UserDto {
  _id: ObjectId;
  name: string;
  avatar: string;
  phone: string;
  activated: boolean | undefined;
  createdAt: Date;

  constructor(user: IUser | any) {
    this._id = user._id;
    this.name = user.name;
    this.avatar = user.avatar ? `${process.env.BASE_URL}${user.avatar}` : "";
    this.phone = user.phone;
    this.activated = user.activated;
    this.createdAt = user.createdAt;
  }
}
