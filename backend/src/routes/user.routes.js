import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);
router.get("/token-status", verifyJWT, (req, res) => {
  const now = Math.floor(Date.now() / 1000); // current time in seconds
  const exp = req.tokenExp;

  if (!exp) {
    return res.status(400).json({ message: "No expiry info found" });
  }

  const timeRemaining = exp - now;

  res.status(200).json({
    message: "Token is valid",
    expiresIn: `${timeRemaining} seconds`,
    expiresAt: new Date(exp * 1000).toISOString(),
  });
});

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

export default router;
