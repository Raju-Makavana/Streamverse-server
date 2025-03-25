import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ['super admin', 'content manager', 'moderator'],
        default: 'moderator',
    },
}, {
    timestamps: true,
}
);

// Hash password before saving
adminSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare entered password with stored hash
adminSchema.methods.comparePassword = async function(enteredPassword) {
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
};

const AdminModel = mongoose.model("Admin", adminSchema);

export { AdminModel as Admin };
