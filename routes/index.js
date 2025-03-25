import express from 'express';
import userRoutes from './user/userRoutes.js';
import authRoutes from './user/authRoutes.js';
import adminRoutes from './admin/adminRoutes.js';
import mediaRoutes from './media/mediaRoutes.js';
import sliderRoutes from './slider/sliderRoutes.js';
import mediaProviderRoutes from './media/mediaProvideRoutes.js';

const router = express.Router();

router.use("/user", userRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/media", mediaRoutes);
router.use("/slider", sliderRoutes);
router.use("/mediaprovider", mediaProviderRoutes);

export default router;