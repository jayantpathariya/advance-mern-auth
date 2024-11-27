import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import 'dotenv/config';

import connectToDB from '@/database/database';

import { config } from '@config/app.config';

import authRoutes from '@routes/auth/auth.routes';
import sessionRoutes from '@routes/session/session.routes';

import { errorHandler } from '@middlewares/error-handler';
import passport from '@middlewares/passport';

import { authenticateJWT } from '@common/strategies/jwt.strategy';

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.APP_ORIGIN,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(passport.initialize());

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/session`, authenticateJWT, sessionRoutes);

app.use(errorHandler);

connectToDB()
  .then(() => {
    console.log('Connected to database');
    app.listen(config.PORT, async () => {
      console.log(
        `Server is listening on port: ${config.PORT} in ${config.NODE_ENV}`,
      );
    });
  })
  .catch((err) => {
    console.log(`Error connecting to database: ${err}`);
  });
