const express = require("express");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const {
  userSignup,
  userLogout,
  userLogin,
  userGetMy,
  userUpdateProfile,
  getAllUser,
  deleteUserById,
  refreshToken,
  userUpdateProfileById,
  userSignupController,
  userLoginController,
  userLogoutController,
  userGetMyController,
  userUpdateProfileControler,
  forgotPasswordController,
  resetPasswordController,
  changePasswordController,
  enableUserByIdController,
} = require("../controller/user.controller");
const {
  registerValidator,
  loginValidator,
  updateValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  passwordChangeValidator,
} = require("../middleware/RequestMiddleware/users.middleware");

const { upload } = require("../middleware/multer");

const router = express.Router();

router.post("/login", loginValidator, userLoginController);

router.post("/signup", registerValidator, userSignupController);

router.post("/logout", userLogoutController);
router.get("/me", authenticateToken, userGetMyController);

router.put("/update", authenticateToken, upload.single("avatar"), updateValidator, userUpdateProfileControler);

//  thêm forgotPasswod, thêm changePassword
router.post("/forgot-password", forgotPasswordValidator, forgotPasswordController);
router.post("/reset-password/:resetToken", resetPasswordValidator, resetPasswordController);
router.put("/changePassword", authenticateToken, passwordChangeValidator, changePasswordController);

router.post("/refreshToken", authenticateToken, refreshToken);

router.put("/update/:id", authenticateToken, authorizeRole("admin"), userUpdateProfileById);
router.get("/users", authenticateToken, authorizeRole("admin"), getAllUser);
//  xóa đây ku
router.patch("/disable/:id", authenticateToken, authorizeRole("admin"), deleteUserById);
router.patch("/enable/:id", authenticateToken, authorizeRole("admin"), enableUserByIdController);
module.exports = router;
