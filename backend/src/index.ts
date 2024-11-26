import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";

import { config } from "./config/app.config";
import connectToDB from "./database/database";
import { errorHandler } from "./middlewares/error-handler";
import { status } from "./config/http.config";

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

app.post("/", (req: Request, res: Response) => {
  res.status(status.OK).json({
    message: "Hello World",
  });
});

app.use(errorHandler);

app.listen(config.PORT, async () => {
  await connectToDB();
  console.log(
    `Server is listening on port: ${config.PORT} in ${config.NODE_ENV}`
  );
});
