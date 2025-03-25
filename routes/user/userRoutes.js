import express from 'express';
import { 
    // userCreate, 
    userUpdate, 
    updatePassword, 
    getAllUsers, 
    deleteUser, 
    getAllRoles 
} from '../../controller/user/userController.js';
import { imageUpload } from '../../middleware/imageUpload.js';
import { isAuthenticatedUser } from '../../middleware/auth.js';

const router = express.Router();

// router.post("/create", isAuthenticatedUser, imageUpload, userCreate);

router.post("/update", isAuthenticatedUser, imageUpload, userUpdate);
router.post("/update-password", isAuthenticatedUser, updatePassword);
router.get("/getUsers", isAuthenticatedUser, getAllUsers);
router.delete("/delete", isAuthenticatedUser, deleteUser);
router.get("/roles", isAuthenticatedUser, getAllRoles);

export default router;