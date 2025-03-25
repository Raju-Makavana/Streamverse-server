import ErrorHandler from '../utils/errorHandler.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';

export const isAuthenticatedUser = asyncErrorHandler(async (req, res, next) => {
    const userId = req.session.userId;

    if (!userId) {
        return next(new ErrorHandler(401, "Please Login to Access this resource"));
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new ErrorHandler(401, "Please Login to Access this resource"));
    }
    
    // if (!AuthToken) {
    //     return next(new ErrorHandler(401, "Please Login to Access this resource"));
    // }
    
    // const decodedUserID = jwt.verify(AuthToken, process.env.JWT_SECRET);
    
    // if (!decodedUserID) {
    //     return next(new ErrorHandler(401, "Please Login to Access this resource"));
    // }
    
    // req.userId = decodedUserID.id;
    req.user = user;

    next();
});

export const isAuthenticatedAdmin = asyncErrorHandler(async (req, res, next) => {
    if (!req.session.adminId) {
      return next(new ErrorHandler(401, "Please Login to Access this resource"));
    } 
    // Attach the userId to the request object for use in other middleware/routes
    req.adminId = req.session.adminId;
    next();
  });