import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";

import connectToDB from "@/database/database";
import { config } from "@config/app.config";
import { errorHandler } from "@middlewares/error-handler";

import authRoutes from "@routes/auth/auth.routes";

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.APP_ORIGIN,
    credentials: true,
  })
);

app.use(cookieParser());

app.use(`${BASE_PATH}/auth`, authRoutes);

app.use(errorHandler);

app.listen(config.PORT, async () => {
  await connectToDB();
  console.log(
    `Server is listening on port: ${config.PORT} in ${config.NODE_ENV}`
  );
});
