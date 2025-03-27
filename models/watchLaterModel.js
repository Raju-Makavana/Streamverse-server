import mongoose from 'mongoose';
const watchLaterSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    media: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
        required: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Ensure each user can only have a media item once in their watch later list
watchLaterSchema.index({ user: 1, media: 1 }, { unique: true });

const WatchLater = mongoose.model("WatchLater", watchLaterSchema);

export { WatchLater as WatchLater };