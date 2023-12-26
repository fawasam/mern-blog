import express from "express";
const router = express.Router();

import { registerUser } from "../controllers/userController.js";

router.post("/signup", registerUser);
// router.get("/profile", getMe);
// router.post("/logout", logoutUser);
// router.post("/login", loginUser);
// router.post("/verify-email/:token", verifyEmail);
// router.post("/verify-sms", verifySms);
// module.exports = router;

export default router;
