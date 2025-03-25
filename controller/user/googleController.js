// authController.js
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import getEnvConfig from '../../config/envConfig.js';
import { User } from '../../models/userModel.js';

const client = new OAuth2Client(getEnvConfig.get('googleClientId'));

export const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: getEnvConfig.get('googleClientId'),
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return null;
  }
};

// In your handleGoogleLogin function
export const handleGoogleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const payload = await verifyGoogleToken(token);
    
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token',
      });
    }

    let user = await User.findOne({ email: payload.email });
    
    if (!user) {
      user = await User.create({
        email: payload.email,
        name: payload.name,
        remember_token: payload.sub,
        profile_picture: payload.picture,
        email_verified_at: new Date(),
      });
    } else {
      user.remember_token = payload.sub;
      user.profile_picture = payload.picture;
      await user.save();
    }

    // Set session userId - critical for loadUser functionality
    req.session.userId = user._id;
    
    // No need to send a JWT token since you're using session-based auth
    res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};