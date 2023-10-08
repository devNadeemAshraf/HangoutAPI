import UserModel from "../models/user-model";

class UserService {
  async findUser(filter: object) {
    return await UserModel.findOne(filter);
  }

  async createUser(data: object) {
    return await UserModel.create(data);
  }
}

export default new UserService();
