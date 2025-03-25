import ErrorHandler from "../../utils/errorHandler.js";
import asyncErrorHandler from "../../utils/asyncErrorHandler.js";
import { Media } from "../../models/mediaModel.js";
import fs from 'fs';
import { promisify } from 'util';

const stat = promisify(fs.stat);

const getCurrentUTC = () => {
  return new Date().toISOString();
};

export const getMedia = asyncErrorHandler(async (req, res, next) => {
  try {
    const media = await Media.find();
    res.status(200).json({
      success: true,
      count: media.length,
      data: media,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(500, "Internal Server Error"));
  }
});

// Get Latest Media
export const getLatestMedia = asyncErrorHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 1 || limit < 1) {
    return next(
      new ErrorHandler(400, "Page and limit must be positive numbers")
    );
  }

  const latestMedia = await Media.find({}) // Added empty filter object
    .sort({ released: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  if (!latestMedia || latestMedia.length === 0) {
    return next(new ErrorHandler(404, "No media found"));
  }

  res.status(200).json({
    success: true,
    count: latestMedia.length,
    data: latestMedia,
  });
});

// Get Trending Media
export const getTrendingMedia = asyncErrorHandler(async (req, res, next) => {
  const minRating = parseFloat(req.query.minRating) || 0;
  const limit = parseInt(req.query.limit) || 10;

  if (minRating < 0 || minRating > 10) {
    return next(new ErrorHandler(400, "Rating must be between 0 and 10"));
  }

  const trendingMedia = await Media.find({
    "imdb.rating": { $exists: true, $gte: minRating },
  })
    .sort({ "imdb.rating": -1 })
    .limit(limit);

  if (!trendingMedia || trendingMedia.length === 0) {
    return next(new ErrorHandler(404, "No trending media found"));
  }

  res.status(200).json({
    success: true,
    count: trendingMedia.length,
    data: trendingMedia,
  });
});

// Get Media by Type
export const getMediaByType = asyncErrorHandler(async (req, res, next) => {
  const { type } = req.params;
  const validTypes = ["movie", "tvshow", "documentary", "shortfilm"];

  if (!type) {
    return next(new ErrorHandler(400, "Media type is required"));
  }

  if (!validTypes.includes(type.toLowerCase())) {
    return next(
      new ErrorHandler(
        400,
        `Invalid media type. Must be one of: ${validTypes.join(", ")}`
      )
    );
  }

  const media = await Media.find({ type: type.toLowerCase() })
    .sort({ released: -1 })
    .limit(10);

  if (!media || media.length === 0) {
    return next(new ErrorHandler(404, `No ${type} media found`));
  }

  res.status(200).json({
    success: true,
    count: media.length,
    data: media,
  });
});

// Get Media by Genre
export const getMediaByGenre = asyncErrorHandler(async (req, res, next) => {
  const { genre } = req.params;

  if (!genre || typeof genre !== "string") {
    return next(new ErrorHandler(400, "Valid genre parameter is required"));
  }

  const media = await Media.find({
    genres: { $regex: new RegExp(genre, "i") },
  })
    .sort({ released: -1 })
    .limit(10);

  if (!media || media.length === 0) {
    return next(new ErrorHandler(404, `No media found in ${genre} genre`));
  }

  res.status(200).json({
    success: true,
    count: media.length,
    data: media,
  });
});

// Get Popular Media
export const getPopularMedia = asyncErrorHandler(async (req, res, next) => {
  const minVotes = parseInt(req.query.minVotes) || 1000;
  const limit = parseInt(req.query.limit) || 10;

  if (minVotes < 0) {
    return next(
      new ErrorHandler(400, "Minimum votes must be a positive number")
    );
  }

  const popularMedia = await Media.find({
    "imdb.votes": { $exists: true, $gte: minVotes },
  })
    .sort({ "imdb.votes": -1 })
    .limit(limit);

  if (!popularMedia || popularMedia.length === 0) {
    return next(new ErrorHandler(404, "No popular media found"));
  }

  res.status(200).json({
    success: true,
    count: popularMedia.length,
    data: popularMedia,
  });
});

// Get Featured Media
export const getFeaturedMedia = asyncErrorHandler(async (req, res, next) => {
  const minRating = parseFloat(req.query.minRating) || 7;
  const minVotes = parseInt(req.query.minVotes) || 1000;

  if (minRating < 0 || minRating > 10) {
    return next(
      new ErrorHandler(400, "Minimum rating must be between 0 and 10")
    );
  }

  if (minVotes < 0) {
    return next(
      new ErrorHandler(400, "Minimum votes must be a positive number")
    );
  }

  const featuredMedia = await Media.find({
    "imdb.rating": { $exists: true, $gte: minRating },
    "imdb.votes": { $exists: true, $gte: minVotes },
    posterUrl: { $exists: true, $ne: "" },
  })
    .sort({ released: -1 })
    .limit(15);

  if (!featuredMedia || featuredMedia.length === 0) {
    return next(new ErrorHandler(404, "No featured media found"));
  }

  res.status(200).json({
    success: true,
    count: featuredMedia.length,
    data: featuredMedia,
  });
});

// Get Single Media Details
export const getSingleMedia = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler(400, "Media ID is required"));
  }

  const media = await Media.findById(id);

  if (!media) {
    return next(new ErrorHandler(404, "Media not found"));
  }

  res.status(200).json({
    success: true,
    data: media,
  });
});


//Stream Media API
export const streamVideo = asyncErrorHandler(async (req, res, next) => {
  const { mediaId } = req.params;
  const { quality = '1080p' } = req.query;

  const media = await Media.findById(mediaId);
  if (!media || !media.videoUrl?.resolutions?.[quality]) {
    return next(new ErrorHandler(404, "Video not found"));
  }

  const videoPath = path.join(__dirname, '../public', media.videoUrl.resolutions[quality]);
  console.log("Video Path:", videoPath);
  // Get video stats
  const stat = await fs.promises.stat(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Handle range request
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };
    
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Handle full file request
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

export const getAllMovies = asyncErrorHandler(async (req, res, next) => {
  try {
    const movies = await Media.find({ type: "movie" }).sort({ released: -1 });
    
    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(500, "Internal Server Error"));
  }
});


// Get Featured Movies for Banner
export const getFeaturedMovies = asyncErrorHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 5;
  const minRating = parseFloat(req.query.minRating) || 8;
  const minVotes = parseInt(req.query.minVotes) || 5000;

  const featuredMovies = await Media.find({
    type: "movie",
    "imdb.rating": { $exists: true, $gte: minRating },
    "imdb.votes": { $exists: true, $gte: minVotes },
    posterUrl: { $exists: true, $ne: "" },
  })
    .sort({ released: -1 })
    .limit(limit);

  if (!featuredMovies || featuredMovies.length === 0) {
    return next(new ErrorHandler(404, "No featured movies found"));
  }

  res.status(200).json({
    success: true,
    count: featuredMovies.length,
    data: featuredMovies,
  });
});

export const getMoviesByGenre = asyncErrorHandler(async (req, res, next) => {
  const { genre } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  if (!genre || typeof genre !== "string") {
    return next(new ErrorHandler(400, "Valid genre parameter is required"));
  }

  const movies = await Media.find({
    type: "movie",
    genres: { $regex: new RegExp(genre, "i") },
  })
    .sort({ released: -1 })
    .limit(limit);

  if (!movies || movies.length === 0) {
    return next(new ErrorHandler(404, `No movies found in ${genre} genre`));
  }

  res.status(200).json({
    success: true,
    count: movies.length,
    data: movies,
  });
});

// Get Latest Movies
export const getLatestMovies = asyncErrorHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;

  if (page < 1 || limit < 1) {
    return next(
      new ErrorHandler(400, "Page and limit must be positive numbers")
    );
  }

  const latestMovies = await Media.find({ type: "movie" })
    .sort({ released: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  if (!latestMovies || latestMovies.length === 0) {
    return next(new ErrorHandler(404, "No movies found"));
  }

  res.status(200).json({
    success: true,
    count: latestMovies.length,
    data: latestMovies,
  });
});

// Get Trending Movies
export const getTrendingMovies = asyncErrorHandler(async (req, res, next) => {
  const minRating = parseFloat(req.query.minRating) || 7;
  const limit = parseInt(req.query.limit) || 10;

  if (minRating < 0 || minRating > 10) {
    return next(new ErrorHandler(400, "Rating must be between 0 and 10"));
  }

  const trendingMovies = await Media.find({
    type: "movie",
    "imdb.rating": { $exists: true, $gte: minRating },
  })
    .sort({ "imdb.rating": -1 })
    .limit(limit);

  if (!trendingMovies || trendingMovies.length === 0) {
    return next(new ErrorHandler(404, "No trending movies found"));
  }

  res.status(200).json({
    success: true,
    count: trendingMovies.length,
    data: trendingMovies,
  });
});

// Get Popular Movies
export const getPopularMovies = asyncErrorHandler(async (req, res, next) => {
  const minVotes = parseInt(req.query.minVotes) || 1000;
  const limit = parseInt(req.query.limit) || 10;

  if (minVotes < 0) {
    return next(
      new ErrorHandler(400, "Minimum votes must be a positive number")
    );
  }

  const popularMovies = await Media.find({
    type: "movie",
    "imdb.votes": { $exists: true, $gte: minVotes },
  })
    .sort({ "imdb.votes": -1 })
    .limit(limit);

  if (!popularMovies || popularMovies.length === 0) {
    return next(new ErrorHandler(404, "No popular movies found"));
  }

  res.status(200).json({
    success: true,
    count: popularMovies.length,
    data: popularMovies,
  });
});

// Get Movie by ID
export const getMovieById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler(400, "Movie ID is required"));
  }

  const movie = await Media.findOne({ _id: id, type: "movie" });

  if (!movie) {
    return next(new ErrorHandler(404, "Movie not found"));
  }

  res.status(200).json({
    success: true,
    data: movie,
  });
});


// Get TV Shows by Category/Genre
export const getTvShowsByCategory = asyncErrorHandler(async (req, res, next) => {
  const { genre, limit = 10, page = 1 } = req.query;
  
  let query = { 
    type: 'tvshow',
    genres: genre 
  };

  const tvShows = await Media.find(query)
    .sort({ 'imdb.rating': -1, 'tomatoes.viewer.numReviews': -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: tvShows
  });
});

// Get Latest TV Shows
export const getLatestTvShows = asyncErrorHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;
  
  const tvShows = await Media.find({ type: 'tvshow' })
    .sort({ released: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: tvShows
  });
});

// Get Trending TV Shows
export const getTrendingTvShows = asyncErrorHandler(async (req, res, next) => {
  const { limit = 10, days = 7 } = req.query;
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - parseInt(days));

  const tvShows = await Media.find({
    type: 'tvshow',
    lastupdated: { $gte: dateThreshold }
  })
    .sort({ 'tomatoes.viewer.numReviews': -1, 'imdb.rating': -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: tvShows
  });
});

// Get Popular TV Shows
export const getPopularTvShows = asyncErrorHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;
  
  const tvShows = await Media.find({ type: 'tvshow' })
    .sort({ 'imdb.rating': -1, 'imdb.votes': -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: tvShows
  });
});

// Get Live Sports
export const getLiveSports = asyncErrorHandler(async (req, res, next) => {
  const { limit = 8 } = req.query;
  const currentTime = getCurrentUTC();

  const liveSports = await Media.find({
    type: 'sport',
    'videoUrl.masterPlaylist': { $exists: true },
    startTime: { $lte: currentTime },
    endTime: { $gt: currentTime }
  })
  .sort({ startTime: 1 })
  .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: liveSports
  });
});

// Get Upcoming Sports Events
export const getUpcomingSports = asyncErrorHandler(async (req, res, next) => {
  const { limit = 8 } = req.query;
  const currentTime = getCurrentUTC();

  const upcomingSports = await Media.find({
    type: 'sport',
    // startTime: { $gt: currentTime }
  })
  .sort({ startTime: 1 })
  .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: upcomingSports
  });
});

// Get Sports by Category
export const getSportsByCategory = asyncErrorHandler(async (req, res, next) => {
  const { category } = req.params;
  const { limit = 8 } = req.query;
  const currentTime = getCurrentUTC();

  const sports = await Media.find({
    type: 'sport',
    genres: category,
    startTime: { $gt: currentTime }
  })
  .sort({ startTime: 1 })
  .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: sports
  });
});

// Get Popular Sports
export const getPopularSports = asyncErrorHandler(async (req, res, next) => {
  const { limit = 8 } = req.query;

  const popularSports = await Media.find({
    type: 'sport',
    // 'imdb.rating': { $exists: true }
  })
  .sort({ 'imdb.rating': -1, 'tomatoes.viewer.numReviews': -1 })
  .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: popularSports
  });
});

// Get Sports Categories
export const getSportsCategories = asyncErrorHandler(async (req, res, next) => {
  const categories = await Media.distinct('genres', { type: 'sport' });

  res.status(200).json({
    success: true,
    data: categories
  });
});

// Get Sport Details
export const getSportDetails = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const sport = await Media.findOne({
    _id: id,
    type: 'sport'
  });

  if (!sport) {
    return next(new ErrorHandler('Sport event not found', 404));
  }

  res.status(200).json({
    success: true,
    data: sport
  });
});

// Update View Count
export const updateSportViewCount = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const sport = await Media.findOneAndUpdate(
    { _id: id, type: 'sport' },
    { $inc: { viewCount: 1 } },
    { new: true }
  );

  if (!sport) {
    return next(new ErrorHandler('Sport event not found', 404));
  }

  res.status(200).json({
    success: true,
    data: sport
  });
});


// Get Breaking News
export const getBreakingNews = asyncErrorHandler(async (req, res, next) => {
  const { limit = 6 } = req.query;

  const breakingNews = await Media.find({
    type: 'news',
    isBreaking: true
  })
    .sort({ released: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: breakingNews
  });
});

// Get Trending News
export const getTrendingNews = asyncErrorHandler(async (req, res, next) => {
  const { limit = 6 } = req.query;

  const trendingNews = await Media.find({
    type: 'news'
  })
    .sort({ viewCount: -1, released: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: trendingNews
  });
});


// Get Latest News
export const getLatestNews = asyncErrorHandler(async (req, res, next) => {
  const { limit = 6 } = req.query;

  const latestNews = await Media.find({
    type: 'news',
    released: { $lte: new Date() }
  })
    .sort({ released: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: latestNews
  });
});

// Get News by Category
export const getNewsByCategory = asyncErrorHandler(async (req, res, next) => {
  const { category } = req.params;
  const { limit = 6 } = req.query;

  const news = await Media.find({
    type: 'news',
    genres: category,
    released: { $lte: new Date() }
  })
    .sort({ released: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: news
  });
});

// Get News Details
export const getNewsDetails = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const news = await Media.findOne({
    _id: id,
    type: 'news'
  });

  if (!news) {
    return next(new ErrorHandler('News article not found', 404));
  }

  // Increment view count
  news.viewCount = (news.viewCount || 0) + 1;
  await news.save();

  res.status(200).json({
    success: true,
    data: news
  });
});

// Get Featured News
export const getFeaturedNews = asyncErrorHandler(async (req, res, next) => {
  const { limit = 5 } = req.query;

  const featuredNews = await Media.find({
    type: 'news',
    isFeatured: true,
    released: { $lte: new Date() }
  })
    .sort({ released: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: featuredNews
  });
});

// Search News
export const searchNews = asyncErrorHandler(async (req, res, next) => {
  const { query, category, page = 1, limit = 10 } = req.query;

  const searchQuery = {
    type: 'news',
    released: { $lte: new Date() },
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { plot: { $regex: query, $options: 'i' } }
    ]
  };

  if (category) {
    searchQuery.genres = category;
  }

  const total = await Media.countDocuments(searchQuery);
  const news = await Media.find(searchQuery)
    .sort({ released: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: news,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      count: news.length,
      total_count: total
    }
  });
});