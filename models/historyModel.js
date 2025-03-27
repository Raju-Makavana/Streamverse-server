import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
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
    lastWatched: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const historyModel = mongoose.model("History", historySchema);

export { historyModel as History }; 