import mongoose from "mongoose";

const sliderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
  },
  mediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    required: true
  },
  pageType: {   // Add this new field
    type: String,
    required: true,
    enum: ['home', 'movies', 'tvshows', 'sports', 'news'],
    default: 'home'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  buttonText: {
    type: String,
    default: "Play Now"
  },
  buttonLink: {
    type: String
  },
  backgroundColor: {
    type: String,
    default: "rgba(0,0,0,0.5)"
  }
}, {
  timestamps: true
});

// Create index for order and pageType to optimize sorting and filtering
sliderSchema.index({ order: 1, pageType: 1 });

// Method to get active slides by page type
sliderSchema.statics.getActiveSlidesByPage = function(pageType) {
  const currentDate = new Date();
  return this.find({
    isActive: true,
    pageType: pageType,
    startDate: { $lte: currentDate },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gte: currentDate } }
    ]
  })
  .sort({ order: 1 })
  .populate('mediaId', 'title posterUrl videoUrl');
};

const sliderModel = mongoose.model("Slider", sliderSchema);

export { sliderModel as Slider };