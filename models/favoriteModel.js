import mongoose from 'mongoose';

const favoritesSchema = new mongoose.Schema({
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

const favoritesModel = mongoose.model("Favorites", favoritesSchema);

export { favoritesModel as Favorites };
