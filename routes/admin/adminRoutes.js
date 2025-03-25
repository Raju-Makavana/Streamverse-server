import express from 'express';

import { adminLogin, getDashboardStats, getUsers, loadAdmin, logout } from '../../controller/admin/adminController.js';
import { isAuthenticatedAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.post("/login", adminLogin);
router.get("/logout", logout);
router.get('/profile', isAuthenticatedAdmin, loadAdmin);
router.get('/users', isAuthenticatedAdmin, getUsers);
router.post('/dashboard', isAuthenticatedAdmin, getDashboardStats);

export default router;