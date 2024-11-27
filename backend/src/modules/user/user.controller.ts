import UserModel from '@/database/models/user.model';

export const findUserById = async (userId: string) => {
  const user = await UserModel.findById(userId, {
    password: false,
  });

  return user || null;
};
