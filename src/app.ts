import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { logger } from "./middleware/logger.js";
import { globalErrorHanlder } from "./middleware/globalErrorHandler.js";
import { authRouter } from "./modules/auth/auth.route.js";
import cookieParser from 'cookie-parser'
import { issueRouter } from "./modules/issues/issue.route.js";
const app: Application = express();
app.use(logger);
app.use(express.json());
app.use(cookieParser())
app.get("/", (req: Request, res: Response) => {
  // throw new Error('server is dying')
  res.send("Hello World");
});

app.use("/api/user", authRouter);
app.use('/api/issues',issueRouter)


app.use(globalErrorHanlder);
export default app;
