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
import { addToWatchLater, checkWatchLaterStatus, getWatchLaterList, removeFromWatchLater, clearWatchLater } from '../../controller/user/watchLaterController.js';
import { addLike, checkLikeStatus, getLikeCount, getLikedMedia, removeLike } from '../../controller/user/likeController.js';
import { addToFavorites, checkFavoriteStatus, getFavoritesList, removeFromFavorites } from '../../controller/user/favoriteController.js';
import { addToHistory, clearHistory, getHistoryList, removeFromHistory } from '../../controller/user/historyController.js';

const router = express.Router();

// router.post("/create", isAuthenticatedUser, imageUpload, userCreate);

router.post("/update", isAuthenticatedUser, imageUpload, userUpdate);
router.post("/update-password", isAuthenticatedUser, updatePassword);
router.get("/getUsers", isAuthenticatedUser, getAllUsers);
router.delete("/delete", isAuthenticatedUser, deleteUser);
router.get("/roles", isAuthenticatedUser, getAllRoles);

// Like routes
router.post('/likes/add', isAuthenticatedUser, addLike);
router.post('/likes/remove', isAuthenticatedUser, removeLike);
router.get('/likes', isAuthenticatedUser, getLikedMedia);
router.get('/likes/count/:mediaId', getLikeCount);
router.get('/likes/check/:mediaId', isAuthenticatedUser, checkLikeStatus);

// Watch Later routes
router.post('/watch-later/add', isAuthenticatedUser, addToWatchLater);
router.post('/watch-later/remove', isAuthenticatedUser, removeFromWatchLater);
router.get('/watch-later', isAuthenticatedUser, getWatchLaterList);
router.post('/watch-later/clear', isAuthenticatedUser, clearWatchLater);

// Favorite routes
router.post('/favorites/add', isAuthenticatedUser, addToFavorites);
router.post('/favorites/remove', isAuthenticatedUser, removeFromFavorites);
router.get('/favorites', isAuthenticatedUser, getFavoritesList);
router.get('/favorites/check/:mediaId', isAuthenticatedUser, checkFavoriteStatus);

// History routes
router.post('/history/add', isAuthenticatedUser, addToHistory);
router.post('/history/remove', isAuthenticatedUser, removeFromHistory);
router.post('/history/clear', isAuthenticatedUser, clearHistory);
router.get('/history', isAuthenticatedUser, getHistoryList);

export default router;