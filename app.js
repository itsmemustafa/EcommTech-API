import express from "express";
import morgan from "morgan";
import notFound from "./src/middlewares/not-found.js";
import errorHandlerMiddleware from "./src/middlewares/error-handler.js";
import connect from "./src/config/connect.js";
import env from "dotenv";
import CustomAPIError from "./src/errors/custom-api.js";
import authRouter from "./src/Routes/auth.js";
env.config();

const app = express();

app.use(express.json());

app.use(morgan("tiny"));

app.use("/api/v1/auth", authRouter);

app.get("/favicon.ico", (req, res) => res.status(204).end());

//error handling
app.use(notFound);
app.use(errorHandlerMiddleware);

const start = async (url) => {
  try {
    await connect(url);
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  } catch (err) {
    throw new CustomAPIError(err);
  }
};

start(process.env.MONGO_URL);
