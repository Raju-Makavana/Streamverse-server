import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
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

// Create a compound index to ensure a user can only like a media once
likeSchema.index({ user: 1, media: 1 }, { unique: true });

const likeModel = mongoose.model("Like", likeSchema);

export { likeModel as Like }; 