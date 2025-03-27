import { Favorites } from '../../models/favoriteModel.js';
import { Media } from '../../models/mediaModel.js';
import ErrorHandler from '../../utils/errorHandler.js';
import asyncErrorHandler from '../../utils/asyncErrorHandler.js';

// Add to favorites
export const addToFavorites = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.body;
    const userId = req.user._id;

    // Check if media exists
    const media = await Media.findById(mediaId);
    if (!media) {
        return next(new ErrorHandler(404, "Media not found"));
    }

    // Check if already in favorites
    const existingItem = await Favorites.findOne({ user: userId, media: mediaId });
    if (existingItem) {
        return next(new ErrorHandler(400, "Media already in favorites"));
    }

    // Add to favorites
    await Favorites.create({
        user: userId,
        media: mediaId
    });

    res.status(200).json({
        success: true,
        message: "Added to favorites"
    });
});

// Remove from favorites
export const removeFromFavorites = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.body;
    const userId = req.user._id;

    const result = await Favorites.findOneAndDelete({ user: userId, media: mediaId });
    
    if (!result) {
        return next(new ErrorHandler(404, "Item not found in favorites"));
    }

    res.status(200).json({
        success: true,
        message: "Removed from favorites"
    });
});

// Get user's favorites list
export const getFavoritesList = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;

    const favoritesList = await Favorites.find({ user: userId })
        .populate('media')
        .sort({ addedAt: -1 });

    console.log('Favorites list:', JSON.stringify(favoritesList, null, 2));

    res.status(200).json({
        success: true,
        data: favoritesList
    });
});

// Check if media is in user's favorites
export const checkFavoriteStatus = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.params;
    const userId = req.user._id;

    const favorite = await Favorites.findOne({ user: userId, media: mediaId });

    res.status(200).json({
        success: true,
        data: {
            inFavorites: !!favorite
        }
    });
}); 