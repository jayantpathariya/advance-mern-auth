import mongoose from 'mongoose';

import { config } from '@config/app.config';

const connectToDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
  } catch (error) {
    process.exit(1);
  }
};

export default connectToDB;
