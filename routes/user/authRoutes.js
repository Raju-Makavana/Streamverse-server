import express from 'express';
import { 
    userLogin, 
    loadUser, 
    forgotPassword, 
    updateUserPassword, 
    logout, 
    UserRegistration
} from '../../controller/user/userController.js';
import { isAuthenticatedUser } from '../../middleware/auth.js';
import { handleGoogleLogin } from '../../controller/user/googleController.js';

const router = express.Router();

router.post("/register", UserRegistration);
router.post("/login", userLogin);
router.get("/logout", logout);
router.post("/password-reset", forgotPassword);
router.post("/password-update", updateUserPassword);
router.get("/loaduser", isAuthenticatedUser, loadUser);
router.post("/google", handleGoogleLogin);

export default router;