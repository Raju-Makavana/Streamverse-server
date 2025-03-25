import mongoose from "mongoose";

const videoUrlSchema = new mongoose.Schema({
  resolutions: {
    "240p": String,
    "480p": String,
    "720p": String,
    "1080p": String,
    "4k": String,
    masterPlaylist: String,
  },
  languages: {
    type: Map,
    of: {
      resolutions: {
        "240p": String,
        "480p": String,
        "720p": String,
        "1080p": String,
        "4k": String,
        masterPlaylist: String,
      },
    },
  },
});

const mediaSchema = new mongoose.Schema(
  {
    plot: {
      type: String,
      // required: true,
    },
    genres: [
      {
        type: String,
      },
    ],
    runtime: {
      type: String,
    },
    rated: {
      type: String,
    },
    cast: [
      {
        type: String,
      },
    ],
    title: {
      type: String,
      //   required: true,
    },
    videoUrl: videoUrlSchema,
    posterUrl: {
      type: String,
    },
    fullplot: {
      type: String,
    },
    languages: [
      {
        type: String,
      },
    ],
    released: {
      type: Date,
    },
    directors: [
      {
        type: String,
      },
    ],
    writers: [
      {
        type: String,
      },
    ],
    awards: {
      wins: {
        type: Number,
        default: 0,
      },
      nominations: {
        type: Number,
        default: 0,
      },
      text: {
        type: String,
      },
    },
    lastupdated: {
      type: Date,
    },
    year: {
      type: Number,
    },
    imdb: {
      rating: {
        type: Number,
        min: 0,
        max: 10,
      },
      votes: {
        type: Number,
      },
      id: {
        type: Number,
      },
    },
    countries: [
      {
        type: String,
      },
    ],
    type: {
      type: String,
      enum: [
        "movie",
        "tvshow",
        "documentary",
        "shortfilm",
        "sport",
        "news",
        "music",
        "game",
      ],
      // required: true,
    },
    tomatoes: {
      viewer: {
        rating: {
          type: Number,
          min: 0,
          max: 5,
        },
        numReviews: {
          type: Number,
        },
        meter: {
          type: Number,
        },
      },
      production: {
        type: String,
      },
      lastUpdated: {
        type: Date,
      },
    },
    num_mflix_comments: {
      type: Number,
      default: 0,
    },

    // Sports-specific fields
    startTime: {
      type: Date,
      // required: function () {
      //   return this.type === "sport";
      // },
    },
    endTime: {
      type: Date,
      // required: function () {
      //   return this.type === "sport";
      // },
    },
    tournament: {
      type: String,
      // required: function () {
      //   return this.type === "sport";
      // },
    },
    teams: [
      {
        name: String,
        logo: String,
        score: Number,
      },
    ],
    venue: {
      name: String,
      location: String,
      timezone: String,
    },
    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
    },
    // News-specific fields
    isBreaking: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    author: {
      type: String,
      // required: function () {
      //   return this.type === "news";
      // },
    },
    source: {
      name: String,
      url: String,
    },
    tags: [
      {
        type: String,
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
    relatedArticles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
      },
    ],
  },
  {
    timestamps: true,
  }
);

mediaSchema.index({ type: 1, startTime: 1 });
mediaSchema.index({ type: 1, genres: 1 });
mediaSchema.index({ type: 1, 'imdb.rating': -1 });
mediaSchema.index({ type: 1, viewCount: -1 });
mediaSchema.index({ type: 1, released: -1 });
mediaSchema.index({ type: 1, genres: 1, released: -1 });
mediaSchema.index({ type: 1, isBreaking: 1, released: -1 });
mediaSchema.index({ type: 1, viewCount: -1 });
mediaSchema.index(
  {
    type: 1,
    title: "text",
    plot: "text",
  },
  {
    weights: {
      title: 10,
      plot: 5,
    },
  }
);

const mediaModel = mongoose.model("Media", mediaSchema);

export { mediaModel as Media };
