import express from 'express';
import { isAuthenticatedAdmin } from '../../middleware/auth.js';
import { 
    addMedia, 
    deleteMedia, 
    editMedia, 
    getAllMedia, 
    getRelatedMedia, 
    getSingleMedia, 
    searchMedia, 
    uploadMedia 
} from '../../controller/media/mediaController.js';
import { upload } from '../../middleware/uploadMiddleware.js';

const router = express.Router();

router.get("/", getAllMedia);
router.get("/search", searchMedia);
router.get("/related/:id", getRelatedMedia);
router.post("/add", addMedia);
router.get("/:id", getSingleMedia);
router.post("/edit/:id", editMedia);
router.post("/delete", deleteMedia);
router.post("/upload/:mediaId", upload.fields([{ name: 'video', maxCount: 1 },{ name: 'poster', maxCount: 1 }]), uploadMedia);

export default router;      