import { Router } from "express";
import { authController } from "./auth.controller.js";

const router = Router();

router.post("/signup", authController.createUser);

router.post("/login",authController.loginUser);
router.post("/refresh",authController.refresh);
export const authRouter = router;
