import { History } from '../../models/historyModel.js';
import { Media } from '../../models/mediaModel.js';
import ErrorHandler from '../../utils/errorHandler.js';
import asyncErrorHandler from '../../utils/asyncErrorHandler.js';

// Add to history
export const addToHistory = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.body;
    const userId = req.user._id;

    // Check if media exists
    const media = await Media.findById(mediaId);
    if (!media) {
        return next(new ErrorHandler(404, "Media not found"));
    }

    // Update or create history entry
    await History.findOneAndUpdate(
        { user: userId, media: mediaId },
        { 
            user: userId,
            media: mediaId,
            lastWatched: new Date()
        },
        { upsert: true, new: true }
    );

    res.status(200).json({
        success: true,
        message: "Added to history"
    });
});

// Remove from history
export const removeFromHistory = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.body;
    const userId = req.user._id;

    const result = await History.findOneAndDelete({ user: userId, media: mediaId });
    
    if (!result) {
        return next(new ErrorHandler(404, "Item not found in history"));
    }

    res.status(200).json({
        success: true,
        message: "Removed from history"
    });
});

// Get user's history list
export const getHistoryList = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;

    const historyList = await History.find({ user: userId })
        .populate('media')
        .sort({ lastWatched: -1 });

    res.status(200).json({
        success: true,
        data: historyList
    });
});

// Clear all history
export const clearHistory = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;

    await History.deleteMany({ user: userId });

    res.status(200).json({
        success: true,
        message: "History cleared successfully"
    });
}); 