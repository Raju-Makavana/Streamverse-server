import { WatchLater } from '../../models/watchLaterModel.js';
import { Media } from '../../models/mediaModel.js';
import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import ErrorHandler from '../../utils/errorHandler.js';

// Add media to watch later list
export const addToWatchLater = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.body;

    if (!mediaId) {
        return next(new ErrorHandler('Media ID is required', 400));
    }

    // Check if media exists
    const media = await Media.findById(mediaId);
    if (!media) {
        return next(new ErrorHandler('Media not found', 404));
    }

    // Check if already in watch later
    const existing = await WatchLater.findOne({
        user: req.user._id,
        media: mediaId
    });

    if (existing) {
        return next(new ErrorHandler('Media already in watch later list', 400));
    }

    // Add to watch later
    await WatchLater.create({
        user: req.user._id,
        media: mediaId
    });

    res.status(200).json({
        success: true,
        message: 'Added to watch later'
    });
});

// Remove media from watch later list
export const removeFromWatchLater = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.body;

    if (!mediaId) {
        return next(new ErrorHandler('Media ID is required', 400));
    }

    const result = await WatchLater.findOneAndDelete({
        user: req.user._id,
        media: mediaId
    });

    if (!result) {
        return next(new ErrorHandler('Media not found in watch later list', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Removed from watch later'
    });
});

// Get watch later list
export const getWatchLaterList = asyncErrorHandler(async (req, res, next) => {
    const watchLaterList = await WatchLater.find({ user: req.user._id })
        .populate({
            path: 'media',
            select: 'title type year genres plot posterUrl duration'
        })
        .sort({ addedAt: -1 });

    res.status(200).json({
        success: true,
        data: watchLaterList
    });
});

// Clear watch later list
export const clearWatchLater = asyncErrorHandler(async (req, res, next) => {
    await WatchLater.deleteMany({ user: req.user._id });

    res.status(200).json({
        success: true,
        message: 'Watch later list cleared'
    });
});

// Check if media is in user's watch later list
export const checkWatchLaterStatus = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.params;
    const userId = req.user._id;

    const item = await WatchLater.findOne({ user: userId, media: mediaId });

    res.status(200).json({
        success: true,
        inWatchLater: !!item
    });
}); 