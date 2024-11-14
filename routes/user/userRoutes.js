const express = require("express");
const { userCreate, userUpdate, updatePassword, getAllUsers, deleteUser, getAllRoles } = require("../../controller/user/userController");
const {imageUpload} = require("../../middleware/imageUpload");
const { isAuthenticatedUser } = require("../../middleware/auth");
const router = express.Router();


router.post("/create",isAuthenticatedUser ,imageUpload , userCreate);
router.post("/update",isAuthenticatedUser ,imageUpload , userUpdate);
router.post("/update-password" , isAuthenticatedUser, updatePassword);
router.get("/getUsers",isAuthenticatedUser , getAllUsers);
router.delete("/delete" ,isAuthenticatedUser, deleteUser);
router.get("/roles" ,isAuthenticatedUser, getAllRoles);
module.exports = router;