import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
    },
    email_verified_at: {
        type: Date,
        default: null,
    },
    password: {
        type: String,
        select: false,
        default: null,
    },
    profile_picture: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    subscription_status: {
        type: String,
        enum: ['active', 'inactive', 'cancelled'],
        default: 'inactive',
    },
    subscription_plan: {
        type: String,
        default: null, // Example: 'basic', 'standard', 'premium'
    },
    watch_history: [{
        movie_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Movie',
        },
        watched_at: {
            type: Date,
            default: Date.now,
        },
    }],
    preferred_genres: [{
        type: String,
    }],
    payment_methods: [{
        card_type: {
            type: String,
        },
        last_four_digits: {
            type: String,
        },
    }],
    remember_token: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

// Hash password before saving
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function(enteredPassword) {
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
};  

const userModel = mongoose.model("User", userSchema);

export { userModel as User };
