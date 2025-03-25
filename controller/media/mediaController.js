import ErrorHandler from '../../utils/errorHandler.js';
import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import { sendMail } from '../../utils/emailUtils.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User} from '../../models/userModel.js';
import validator from 'validator';
import getEnvConfig from '../../config/envConfig.js';
import { Media } from '../../models/mediaModel.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ffmpeg from '../../config/ffmpegConfig.js';
import { createVideoResolutions } from '../../utils/videoProcessor.js';   


export const addMedia = asyncErrorHandler(async (req, res, next) => {
    const {
        title,
        plot,
        fullplot,
        type,
        runtime,
        rated,
        released,
        year,
        genres,
        directors,
        writers,
        cast,
        languages,
        countries,
        imdb,
        awards,
        tomatoes
    } = req.body;

    console.log(req.body);

    // Required fields validation
    if (!title || !plot || !type) {
        return next(new ErrorHandler(400, "Title, plot, and type are required fields"));
    }

    // Type validation
    // const validTypes = ['movie', 'tvshow', 'documentary', 'shortfilm', ];
    // if (!validTypes.includes(type)) {
    //     return next(new ErrorHandler(400, "Invalid media type"));
    // }

    // IMDB ratings validation
    if (imdb?.rating && (imdb.rating < 0 || imdb.rating > 10)) {
        return next(new ErrorHandler(400, "IMDB rating must be between 0 and 10"));
    }

    // Tomatoes validation
    if (tomatoes?.viewer?.rating && (tomatoes.viewer.rating < 0 || tomatoes.viewer.rating > 5)) {
        return next(new ErrorHandler(400, "Tomatoes viewer rating must be between 0 and 5"));
    }

    // Array fields validation
    const arrayFields = { genres, directors, writers, cast, languages, countries };
    for (const [field, value] of Object.entries(arrayFields)) {
        if (value && !Array.isArray(value)) {
            return next(new ErrorHandler(400, `${field} must be an array`));
        }
    }

    // Awards validation
    // if (awards) {
    //     if (awards.wins && typeof awards.wins !== 'number') {
    //         return next(new ErrorHandler(400, "Awards wins must be a number"));
    //     }
    //     if (awards.nominations && typeof awards.nominations !== 'number') {
    //         return next(new ErrorHandler(400, "Awards nominations must be a number"));
    //     }
    // }

    try {
        const newMedia = await Media.create({
            title,
            plot,
            fullplot,
            type,
            runtime,
            rated,
            released,
            year,
            genres,
            directors,
            writers,
            cast,
            languages,
            countries,
            imdb,
            awards,
            tomatoes,
            lastupdated: new Date()
        });

        res.status(201).json({
            success: true,
            message: "Media added successfully",
            data: newMedia
        });
    } catch (error) {
        // Handle unique constraint violations or other database errors
        if (error.code === 11000) {
            return next(new ErrorHandler(400, "Media with this title already exists"));
        }
        return next(new ErrorHandler(500, error.message));
    }
});


export const getAllMedia = asyncErrorHandler(async (req, res, next) => {
    
    try {
        const media = await Media.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({
            success: true,
            data: media
        });
    } catch (error) {
        return next(new ErrorHandler(500, error.message));
    }
});

// Fetch Single Media
export const getSingleMedia = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        const media = await Media.findById(id).lean();
        if (!media) {
            return next(new ErrorHandler(404, "Media not found"));
        }
        res.status(200).json({
            success: true,
            data: media
        });
    } catch (error) {
        return next(new ErrorHandler(500, error.message));
    }
});

// Edit Media 
export const editMedia = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;  // Get ID from URL params
    const {
        title,
        plot,
        fullplot,
        type,
        runtime,
        rated,
        released,   
        year,
        genres,
        directors,
        writers,    
        cast,
        languages,    
        countries,
        imdb,
        awards,
        tomatoes
    } = req.body;    

    try {
        const cleanData = {
            title,
            plot,
            fullplot,
            type,
            runtime,
            rated,
            released,   
            year,
            genres: genres.filter(item => item !== ""),
            directors: directors.filter(item => item !== ""),
            writers: writers.filter(item => item !== ""),    
            cast: cast.filter(item => item !== ""),
            languages: languages.filter(item => item !== ""),    
            countries: countries.filter(item => item !== ""),
            imdb,
            awards,
            tomatoes,
            lastupdated: new Date()
        };

        const updatedMedia = await Media.findByIdAndUpdate(
            id,
            cleanData,
            { new: true, runValidators: true }  // Added runValidators
        );

        if (!updatedMedia) {
            return next(new ErrorHandler(404, "Media not found"));
        }

        res.status(200).json({
            success: true,
            message: "Media updated successfully",
            data: updatedMedia
        });
    } catch (error) {
        return next(new ErrorHandler(500, error.message));
    }
});

// Delete Media
export const deleteMedia = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.body;
    try {
        const deletedMedia = await Media.findByIdAndDelete(id);
        if (!deletedMedia) {
            return next(new ErrorHandler(404, "Media not found"));
        }
        res.status(200).json({
            success: true,
            message: "Media deleted successfully",
        });
    } catch (error) {
        return next(new ErrorHandler(500, error.message));
        }
});


// New upload controller
export const uploadMedia = asyncErrorHandler(async (req, res, next) => {
    const { mediaId } = req.params;
    const { languages = [] } = req.body;

    if (!req.files || (!req.files.video && !req.files.poster)) {
        return next(new ErrorHandler(400, "Please upload at least one file"));
    }

    try {
        let updateData = {};

        // if (req.files.poster) {3
        //     console.log("req.files.poster[0].path",req.files.poster[0].path)
        //     updateData.posterUrl = req.files.poster[0].path.replace('public', '');
        // }

        if (req.files.poster) {
            const fullPath = req.files.poster[0].path;
            
            // Find the index where '\uploads' starts and extract from there
            const uploadsIndex = fullPath.indexOf('\\uploads');
            if (uploadsIndex !== -1) {
                updateData.posterUrl = fullPath.substring(uploadsIndex);
            } else {
                // Fallback in case the path structure is different
                updateData.posterUrl = fullPath.replace('public', '');
            }
        }

        if (req.files.video) {
            const videoFile = req.files.video[0];
            const videoDir = path.join('public/uploads/videos', mediaId);
            fs.mkdirSync(videoDir, { recursive: true });

            const videoUrls = await createVideoResolutions(
                videoFile.path,
                videoDir,
                'stream'
            );

            updateData.videoUrl = {
                resolutions: videoUrls,
                languages: languages.reduce((acc, lang) => {
                    acc[lang] = videoUrls;
                    return acc;
                }, {})
            };
        }

        const updatedMedia = await Media.findByIdAndUpdate(
            mediaId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedMedia) {
            return next(new ErrorHandler(404, "Media not found"));
        }

        if (req.files.video) {
            fs.unlinkSync(req.files.video[0].path);
        }

        res.status(200).json({
            success: true,
            media: updatedMedia
        });

    } catch (error) {
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            });
        }
        return next(new ErrorHandler(500, error.message));
    }
});

// Search Media API
export const searchMedia = asyncErrorHandler(async (req, res, next) => {
    const { query, type, genre, language, year, limit = 20 } = req.query;
    
    try {
        // Build search criteria
        let searchCriteria = {};
        
        // Text search if query is provided
        if (query && query.trim() !== '') {
            searchCriteria.$or = [
                { title: { $regex: query, $options: 'i' } },
                { plot: { $regex: query, $options: 'i' } },
                { fullplot: { $regex: query, $options: 'i' } },
                { cast: { $in: [new RegExp(query, 'i')] } },
                { directors: { $in: [new RegExp(query, 'i')] } }
            ];
        }
        
        // Add filters
        if (type) searchCriteria.type = type;
        if (genre) searchCriteria.genres = { $in: [genre] };
        if (language) searchCriteria.languages = { $in: [language] };
        if (year) searchCriteria.year = parseInt(year);
        
        // Execute search
        const results = await Media.find(searchCriteria)
            .limit(parseInt(limit))
            .sort({ 'imdb.rating': -1 })
            .lean();
            
        // Get related popular media if results are few
        let relatedMedia = [];
        if (results.length < 5 && query) {
            // Get some popular media as fallback
            relatedMedia = await Media.find({
                $and: [
                    { _id: { $nin: results.map(item => item._id) } },
                    type ? { type } : {}
                ]
            })
            .sort({ 'imdb.rating': -1 })
            .limit(10)
            .lean();
        }
        
        res.status(200).json({
            success: true,
            count: results.length,
            data: results,
            related: relatedMedia
        });
    } catch (error) {
        return next(new ErrorHandler(500, error.message));
    }
});

// Get Related Media API
export const getRelatedMedia = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    try {
        const media = await Media.findById(id).lean();
        
        if (!media) {
            return next(new ErrorHandler(404, "Media not found"));
        }
        
        // Find related media based on genres and type
        const relatedMedia = await Media.find({
            _id: { $ne: id },
            $or: [
                { genres: { $in: media.genres } },
                { type: media.type }
            ]
        })
        .sort({ 'imdb.rating': -1 })
        .limit(10)
        .lean();
        
        res.status(200).json({
            success: true,
            data: relatedMedia
        });
    } catch (error) {
        return next(new ErrorHandler(500, error.message));
    }
});