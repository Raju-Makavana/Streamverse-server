
import { Like } from '../../models/likeModel.js';
import ErrorHandler from '../../utils/errorHandler.js';
import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import { Media } from '../../models/mediaModel.js';

// Add like to media
export const addLike = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.body;
    const userId = req.user._id;

    // Check if media exists
    const media = await Media.findById(mediaId);
    if (!media) {
        return next(new ErrorHandler(404, "Media not found"));
    }

    // Check if already liked
    const existingLike = await Like.findOne({ user: userId, media: mediaId });
    if (existingLike) {
        return next(new ErrorHandler(400, "Media already liked"));
    }

    // Create new like
    await Like.create({
        user: userId,
        media: mediaId
    });

    res.status(200).json({
        success: true,
        message: "Added to likes"
    });
});

// Remove like from media
export const removeLike = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.body;
    const userId = req.user._id;

    const result = await Like.findOneAndDelete({ user: userId, media: mediaId });
    
    if (!result) {
        return next(new ErrorHandler(404, "Like not found"));
    }

    res.status(200).json({
        success: true,
        message: "Removed from likes"
    });
});

// Get user's liked media
export const getLikedMedia = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;

    const likes = await Like.find({ user: userId })
        .populate('media')
        .sort({ addedAt: -1 });

    res.status(200).json({
        success: true,
        data: likes
    });
});

// Get like count for a media
export const getLikeCount = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.params;

    const count = await Like.countDocuments({ media: mediaId });

    res.status(200).json({
        success: true,
        count
    });
});

// Check if user has liked a media
export const checkLikeStatus = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.params;
    const userId = req.user._id;

    const like = await Like.findOne({ user: userId, media: mediaId });

    res.status(200).json({
        success: true,
        isLiked: !!like
    });
}); 