import ErrorHandler from '../../utils/errorHandler.js';
import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import { sendMail } from '../../utils/emailUtils.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User} from '../../models/userModel.js';
import validator from 'validator';
import getEnvConfig from '../../config/envConfig.js';

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// User Registration
export const UserRegistration = asyncErrorHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!email || !password  || !name) {
    return next(new ErrorHandler(400, "Please provide all required fields"));
  }

  if (!validator.isEmail(email)) {
    return next(new ErrorHandler(400, "Invalid email format"));
  }

  if (!passwordRegex.test(password)) {
    return next(
      new ErrorHandler(
        400,
        "Password must be at least 8 characters long, including 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
      )
    );
  }

  // Check if the user email already exists
  const existingUser = await User.exists({ email });
  if (existingUser) {
    return next(new ErrorHandler(400, "User already exists"));
  }

  try {
   

    // Create the new user
    const newUser = new User({
      name,
      password,
      email,
    });

    const savedUser = await newUser.save();

    // Send confirmation email
    // const confirmationToken = jwt.sign(
    //   { email },
    //   getEnvConfig.get("jwtSecret"),
    //   {
    //     expiresIn: "24h",
    //   }
    // );

    // const confirmationLink = `${getEnvConfig.get(
    //   "frontendURL"
    // )}/email-verification?token=${confirmationToken}`;

    // const subject = "Confirm Email Address";
    // const htmlContent = generateEmailTemplate(
    //   firstname,
    //   lastname,
    //   confirmationLink
    // );

    // await sendMail(email, subject, htmlContent);

    res.status(201).json({
      success: true,
      message:
        "Registration successful. We have sent a confirmation email to your email address, please verify it.",
      user: savedUser,
    });
  } catch (error) {
    console.log(error.message);
      console.error("Failed during registration process:", error);
    return next(new ErrorHandler(500, "An error occurred during registration"));
  }
});

// User Login
export const userLogin = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler(400, "Please provide email and password"));
  }

  if (!validator.isEmail(email)) {
    return next(new ErrorHandler(400, "Invalid email format"));
  }

  if (!passwordRegex.test(password)) {
    return next(
      new ErrorHandler(
        400,
        "Password must be at least 8 characters long, including 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
      )
    );
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler(400, "Invalid credentials"));
  }

  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    return next(new ErrorHandler(400, "Invalid credentials"));
  }

  req.session.userId = user._id;

  res.status(200).json({
    success: true,
    user: user,
  });
});

// Load User
export const loadUser = asyncErrorHandler(async (req, res, next) => {
  // The userId is already attached by the isAuthenticatedUser middleware
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      user: user 
    });
  } catch (error) {
    console.error("Error loading user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

export const logout = asyncErrorHandler(async (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(new ErrorHandler(500, "Could not log out user"));
    }
    res.clearCookie("user.sid"); // Clear the session ID cookie
    res.status(200).json({ success: true, message: "Logged out successfully" });
  });
});

export const forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler(400, 'Please provide an email'));
  }

  const userExists = await User.exists({ email });

  if (!userExists) {
    return next(new ErrorHandler(404, 'User not found'));
  }

  const passwordResetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

  try {
    await sendMail(email, 'Password Reset', `Click the link to reset your password: http://localhost:3031/auth/jwt/password-reset?token=${passwordResetToken}`);
    res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return next(new ErrorHandler(500, 'Failed to send password reset email'));
  }
});


export const updateUserPassword = asyncErrorHandler(async (req, res, next) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findOneAndUpdate({ email }, { password: hashedPassword });
    if (!user) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ErrorHandler(401, 'Invalid or expired token'));
    }
    console.error('Error updating password:', error);
    return next(new ErrorHandler(500, 'Internal Server Error'));
  }
});

export const userUpdate = asyncErrorHandler(async (req, res, next) => {
  const { id, name, email, in_active, company, role } = req.body;
  const user_photo = req.imagePath || null;

  if (!id || !name || !email || in_active === undefined || !company) {
    return next(new ErrorHandler(400, 'Please provide all required fields'));
  }

  const updatedUser = await User.findByIdAndUpdate(id, {
    name,
    email,
    user_photo,
    in_active,
    company,
    role_id: role.id
  }, { new: true });

  if (!updatedUser) {
    return next(new ErrorHandler(404, 'User not found'));
  }

  res.status(200).json({ success: true, message: 'User updated successfully', user: updatedUser });
});

export const updatePassword = asyncErrorHandler(async (req, res, next) => {
  const { id, oldPassword, newPassword } = req.body;

  if (!id || !newPassword) {
    return next(new ErrorHandler(400, 'Please provide user ID and new password'));
  }

  const existingUser = await User.findById(id).select('+password');
  if (!existingUser) {
    return next(new ErrorHandler(404, 'User not found'));
  }

  if (oldPassword) {
    const passwordMatch = await bcrypt.compare(oldPassword, existingUser.password);
    if (!passwordMatch) {
      return next(new ErrorHandler(401, 'Incorrect old password'));
    }
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(id, { password: hashedNewPassword });

  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

export const getAllUsers = asyncErrorHandler(async (req, res, next) => {
  const userId = req.query.id;
  const fields = req.query.fields;

  if (userId) {
    const user = await User.findById(userId).populate('role_id', 'name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user: mapUser(user) });
  } else if (fields) {
    const users = await User.find().select('name _id').lean();
    const updatedData = users.map(({ _id, name, ...rest }) => ({
      id: _id.toString(),
      name: name,
      ...rest
    }));
    res.status(200).json({ success: true, users: updatedData });
  } else {
    const users = await User.find().populate('role_id', 'name');
    res.status(200).json({ success: true, users: users.map(mapUser) });
  }
});

export const deleteUser = asyncErrorHandler(async (req, res, next) => {
  const userId = req.query.id;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'Please provide user ID' });
  }

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({ success: true, message: 'User deleted successfully' });
});

export const getAllRoles = asyncErrorHandler(async (req, res, next) => {
  const roles = await Role.find().lean();
  const modifiedData = roles.map(({ _id, ...rest }) => ({
    id: _id.toString(),
    ...rest
  }));

  res.status(200).json({
    success: true,
    roles: modifiedData
  });
});

export const getPermissionsOfUser = asyncErrorHandler(async (req, res, next) => {
  const pool = req.pool;
  const { id } = req.query;

  pool.query("SELECT * FROM roles", (error, results) => {
    if (error) {
      console.error("Error fetching user roles:", error);
      return next(new ErrorHandler(500, 'Internal Server Error'));
    }
    res.status(200).json({
      success: true,
      roles: results
    });
  });
});