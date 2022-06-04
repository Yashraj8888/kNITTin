const express = require("express");

const {
  register,
  login,
  followunfollow,
  logout,
  updatePassword,
  updateProfile,
  deleteProfile,
  myProfile,
  getAllUsers,
  getUserProfile,
  forgotPassword,
  resetPassword,
} = require("../controller/user");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);

router.route("/delete/me").delete(isAuthenticated, deleteProfile);
router.route("/follow/:id").get(isAuthenticated, followunfollow);
router.route("/update/password").put(isAuthenticated, updatePassword);
router.route("/update/profile").put(isAuthenticated, updateProfile);

router.route("/me").get(isAuthenticated, myProfile);
router.route("/users").get(isAuthenticated, getAllUsers);
router.route("/user/:id").get(isAuthenticated, getUserProfile);

router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").post(resetPassword);

module.exports = router;
