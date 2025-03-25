import ErrorHandler from "../../utils/errorHandler.js";
import asyncErrorHandler from "../../utils/asyncErrorHandler.js";
import validator from "validator";
import mongoose from "mongoose";
import { Admin } from "../../models/adminModel.js"
import { User } from "../../models/userModel.js";
import { Media } from "../../models/mediaModel.js";
import { Slider } from "../../models/sliderModel.js";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;


// Admin Login API
export const adminLogin = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler(400, "Please provide email and password"));
  }

  if (!validator.isEmail(email)) {
    return next(new ErrorHandler(400, "Invalid email format"));
  }

  if (!passwordRegex.test(password)) {
    return next(
      new ErrorHandler(
        400,
        "Password must be at least 8 characters long, including 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
      )
    );
  }

  const admin = await Admin.findOne({ email }).select("+password");

  if (!admin) {
    return next(new ErrorHandler(400, "Invalid credentials"));
  }

  const passwordMatch = await admin.comparePassword(password);
  if (!passwordMatch) {
    return next(new ErrorHandler(400, "Invalid credentials"));
  }

  req.session.adminId = admin._id;

  res.status(200).json({
    success: true,
    admin: admin,
  });
});


// Admin Load API
export const loadAdmin = asyncErrorHandler(async (req, res) => {
  const adminId = req.adminId;
  if (!adminId) {
    return res.status(400).json({
      success: false,
      message: "Admin Not Found, Please Login Again",
    });
  }

  // Select specific fields
  const admin = await Admin.findById(adminId);

  // Check if admin exists
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin Not Found, Please Login Again",
    });
  }

  return res.status(200).json({ success: true, admin: admin });
});

// Admin Logout API
export const logout = asyncErrorHandler(async (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(new ErrorHandler(500, "Could not log out Admin"));
    }
    res.clearCookie("admin.sid"); // Clear the session ID cookie
    res.status(200).json({ success: true, message: "Logged out successfully" });
  });
});

export const getUsers = asyncErrorHandler(async (req, res) => {
  const adminId = req.adminId;

  if(!adminId) {
    return res.status(400).json({ success: false, message: "Admin Not Found, Please Login Again" });
  }
  
  const users = await User.find();
  res.status(200).json({ success: true, users: users });
});

// Dashboard Stats API
export const getDashboardStats = asyncErrorHandler(async (req, res) => {
  const adminId = req.adminId;
  const { dateRange } = req.body;

  if (!adminId) {
    return res.status(400).json({ 
      success: false, 
      message: "Admin Not Found, Please Login Again" 
    });
  }

  try {
    // Get basic user stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ active: true });
    const inactiveUsers = totalUsers - activeUsers;
    const freeUsers = await User.countDocuments({ subscription: { $exists: false } });
    const bundleUsers = await User.countDocuments({ subscription: { $exists: true } });
    
    // Get media stats
    const totalMedia = await Media.countDocuments();
    
    // Get content type distribution
    const movies = await Media.countDocuments({ type: 'movie' });
    const tvShows = await Media.countDocuments({ type: 'tvshow' });
    const sports = await Media.countDocuments({ category: 'sports' });
    const news = await Media.countDocuments({ category: 'news' });
    
    // Calculate distribution percentages
    const totalContentCount = movies + tvShows + sports + news;
    const moviesPercentage = totalContentCount ? Math.round((movies / totalContentCount) * 100) : 0;
    const tvShowsPercentage = totalContentCount ? Math.round((tvShows / totalContentCount) * 100) : 0;
    const sportsPercentage = totalContentCount ? Math.round((sports / totalContentCount) * 100) : 0;
    const newsPercentage = totalContentCount ? Math.round((news / totalContentCount) * 100) : 0;
    
    // Get genre distribution
    const genreCounts = await Media.aggregate([
      { $unwind: "$genre" },
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Format genre data
    const popularGenres = genreCounts.map(g => ({
      name: g._id,
      percentage: Math.round((g.count / totalMedia) * 100)
    }));
    
    // Get recent uploads
    const recentMedia = await Media.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title posterUrl thumbnailUrl type category createdAt');
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');
    
    // Get view stats - placeholder, replace with actual view tracking
    const viewsToday = Math.floor(Math.random() * 100) + 50;
    
    // Content distribution data
    const contentDistribution = [
      { type: 'Movies', percentage: moviesPercentage },
      { type: 'TV Shows', percentage: tvShowsPercentage },
      { type: 'Sports', percentage: sportsPercentage },
      { type: 'News', percentage: newsPercentage }
    ];

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        freeUsers,
        bundleUsers,
        totalMedia,
        contentDistribution,
        popularGenres,
        recentMedia,
        recentUsers,
        viewsToday,
        filteredReports: viewsToday // For compatibility with existing code
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard statistics'
    });
  }
});