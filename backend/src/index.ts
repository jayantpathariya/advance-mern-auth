import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import "dotenv/config";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.APP_ORIGIN,
    credentials: true,
  })
);

app.use(cookieParser());

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
