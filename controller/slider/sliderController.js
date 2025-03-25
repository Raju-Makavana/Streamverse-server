import ErrorHandler from '../../utils/errorHandler.js';
import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import { Slider } from '../../models/sliderModel.js';
import { Media } from '../../models/mediaModel.js';
import fs from 'fs';
import path from 'path';

// Helper function to move file to final destination
const moveFile = (tempPath, finalPath) => {
    try {
        // Create directory if it doesn't exist
        fs.mkdirSync(path.dirname(finalPath), { recursive: true });
        
        // Move file
        fs.renameSync(tempPath, finalPath);
        return true;
    } catch (error) {
        console.error('Error moving file:', error);
        return false;
    }
};

// Create Slider API
export const createSlider = asyncErrorHandler(async (req, res, next) => {
    console.log('File received:', req.file); // Debug log
    console.log('Body received:', req.body); // Debug log

    const { title, description, mediaId, startDate, endDate, buttonText, buttonLink, backgroundColor, isActive, pageType } = req.body;
    
    const validPageTypes = ['home', 'movies', 'tvshows', 'sports', 'news'];
    if (!validPageTypes.includes(pageType)) {
        return next(new ErrorHandler('Invalid page type', 400));
    }

    // Validate mediaId exists
    if (mediaId) {
        const media = await Media.findById(mediaId);
        if (!media) {
            // If there's an uploaded file, delete it
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return next(new ErrorHandler('Media not found', 404));
        }
    }

    // Get highest order
    const highestOrder = await Slider.findOne().sort('-order');
    const newOrder = highestOrder ? highestOrder.order + 1 : 1;

    // Create initial slider object
    let sliderData = {
        title,
        description,
        mediaId,
        startDate,
        endDate,
        buttonText,
        buttonLink,
        backgroundColor,
        isActive,
        pageType,
        order: newOrder
    };

    // Handle file upload if exists
    if (req.file) {
        try {
            const slider = await Slider.create(sliderData); // Create slider first to get ID
            
            const finalDirectory = `public/uploads/slider/${slider._id}`;
            const finalPath = path.join(finalDirectory, req.file.filename);
            
            // Ensure directory exists
            fs.mkdirSync(finalDirectory, { recursive: true });
            
            // Move file from temp to final location
            if (moveFile(req.file.path, finalPath)) {
                // Update slider with image path
                slider.image = `uploads/slider/${slider._id}/${req.file.filename}`;
                await slider.save();
                
                return res.status(201).json({
                    success: true,
                    data: slider
                });
            } else {
                // If moving file fails, delete the slider and return error
                await slider.deleteOne();
                return next(new ErrorHandler('Error uploading image', 500));
            }
        } catch (error) {
            // If there's an error, clean up any uploaded file
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return next(new ErrorHandler(error.message, 500));
        }
    } else {
        // Create slider without image
        const slider = await Slider.create(sliderData);
        return res.status(201).json({
            success: true,
            data: slider
        });
    }
});

// Update Slider API
export const updateSlider = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { title, description, mediaId, startDate, endDate, buttonText, buttonLink, backgroundColor, isActive, pageType } = req.body;

    let slider = await Slider.findById(id);
    if (!slider) {
        // If there's an uploaded file, delete it
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        return next(new ErrorHandler('Slider not found', 404));
    }

    const validPageTypes = ['home', 'movies', 'tvshows', 'sports', 'news'];
    if (!validPageTypes.includes(pageType)) {
        return next(new ErrorHandler('Invalid page type', 400));
    }

    if (pageType !== slider.pageType) {
        // Get highest order for the new page type
        const highestOrder = await Slider.findOne({ pageType }).sort('-order');
        const newOrder = highestOrder ? highestOrder.order + 1 : 1;
        updateData.order = newOrder;
    }
    
    // Validate mediaId if provided
    if (mediaId) {
        const media = await Media.findById(mediaId);
        if (!media) {
            // If there's an uploaded file, delete it
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return next(new ErrorHandler('Media not found', 404));
        }
    }

    // Update slider data
    const updateData = {
        title,
        description,
        mediaId,
        startDate,
        endDate,
        buttonText,
        buttonLink,
        backgroundColor,
        isActive,
        pageType
    };

    // Handle image update
    if (req.file) {
        try {
            // Delete old image if exists
            if (slider.image) {
                const oldImagePath = path.join('public', slider.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            const finalDirectory = `public/uploads/slider/${id}`;
            const finalPath = path.join(finalDirectory, req.file.filename);
            
            // Ensure directory exists
            fs.mkdirSync(finalDirectory, { recursive: true });
            
            // Move file from temp to final location
            if (moveFile(req.file.path, finalPath)) {
                updateData.image = `uploads/slider/${id}/${req.file.filename}`;
            } else {
                return next(new ErrorHandler('Error uploading image', 500));
            }
        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return next(new ErrorHandler(error.message, 500));
        }
    }

    slider = await Slider.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: slider
    });
});

// Delete Slider API
export const deleteSlider = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.body;

    const slider = await Slider.findById(id);
    if (!slider) {
        return next(new ErrorHandler('Slider not found', 404));
    }

    // Delete slider directory if exists
    const sliderDirectory = path.join('public/uploads/slider', id);
    if (fs.existsSync(sliderDirectory)) {
        fs.rmSync(sliderDirectory, { recursive: true, force: true });
    }

    await slider.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Slider deleted successfully'
    });
});

export const getAllSlider = asyncErrorHandler(async (req, res, next) => {
    const { pageType } = req.query;
    const query = pageType ? { pageType } : {};
    
    const sliders = await Slider.find(query)
        .populate('mediaId')
        .sort({ pageType: 1, order: 1 });
    
    res.status(200).json({
        success: true,
        data: sliders
    });
});


export const getSliders = asyncErrorHandler(async (req, res, next) => {
    const { pageType = 'home' } = req.query;
    
    const sliders = await Slider.find({ 
        isActive: true,
        pageType 
    })
    .populate('mediaId')
    .sort({ order: 1 });
    
    res.status(200).json({
        success: true,
        sliders: sliders
    });
});