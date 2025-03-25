import express from 'express';
import { getAllMovies, getBreakingNews, getFeaturedMedia, getFeaturedMovies, getFeaturedNews, getLatestMedia, getLatestMovies, getLatestNews, getLatestTvShows, getLiveSports, getMedia, getMediaByGenre, getMediaByType, getMovieById, getMoviesByGenre, getNewsByCategory, getNewsDetails, getPopularMedia, getPopularMovies, getPopularSports, getPopularTvShows, getSingleMedia, getSportDetails, getSportsByCategory, getSportsCategories, getTrendingMedia, getTrendingMovies, getTrendingNews, getTrendingTvShows, getTvShowsByCategory, getUpcomingSports, searchNews, streamVideo, updateSportViewCount } from '../../controller/media/mediaProvideController.js';

const router = express.Router();

// App routes
router.get("/all", getMedia);
router.get('/latest', getLatestMedia);
router.get('/trending', getTrendingMedia);
router.get('/type/:type', getMediaByType);
router.get('/genre/:genre', getMediaByGenre);
router.get('/popular', getPopularMedia);
router.get('/featured', getFeaturedMedia);
router.get("/media/:id", getSingleMedia);
router.get('/media/:mediaId', streamVideo);
router.get('/', getAllMovies);
router.get('/featured', getFeaturedMovies);
router.get('/latest', getLatestMovies);
router.get('/trending', getTrendingMovies);
router.get('/popular', getPopularMovies);
router.get('/genre/:genre', getMoviesByGenre);
router.get('/:id', getMovieById);
router.get('/category', getTvShowsByCategory);
router.get('/tvshows/latest', getLatestTvShows);
router.get('/tvshows/trending', getTrendingTvShows);
router.get('/tvshows/popular', getPopularTvShows);
router.get('/sports/live', getLiveSports);
router.get('/sports/upcoming', getUpcomingSports);
router.get('/sports/category/:category', getSportsByCategory);
router.get('/sports/popular', getPopularSports);
router.get('/sports/categories', getSportsCategories);
router.get('/sports/details/:id', getSportDetails);
router.get('/news/breaking', getBreakingNews);
router.get('/news/trending', getTrendingNews);
router.get('/news/latest', getLatestNews);
router.get('/news/category/:category', getNewsByCategory);
router.get('/news/featured', getFeaturedNews);
router.get('/news/search', searchNews);
router.get('/news/:id', getNewsDetails);

// Protected routes
router.put('/sports/view/:id', updateSportViewCount);


export default router;      