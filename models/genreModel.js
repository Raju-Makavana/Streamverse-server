import mongoose from 'mongoose';

const genreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        default: "",
    },
}, {
    timestamps: true,
});

const genreModel = mongoose.model("Genre", genreSchema);

export { genreModel as Genre };
