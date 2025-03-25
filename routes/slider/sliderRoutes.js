import express from 'express';

import { isAuthenticatedAdmin } from '../../middleware/auth.js';
import { upload } from '../../middleware/uploadMiddleware.js';
import { createSlider, deleteSlider, getAllSlider, getSliders, updateSlider } from '../../controller/slider/sliderController.js';

const router = express.Router();

router.get("/",getAllSlider);
router.post("/add", upload.single('image'),createSlider);
router.post("/edit/:id", upload.single('image'),updateSlider);
router.post("/delete", deleteSlider);

// App routes
router.get("/sliders", getSliders);

export default router;