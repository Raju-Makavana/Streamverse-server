import session from 'express-session';
import MongoStore from 'connect-mongo';
import getEnvConfig from './envConfig.js';
import connectDatabase from '../database/db.js';

// Database connection
const DbClinet = connectDatabase(); // Database connection

const createSessionConfig = (name, prefix = '') => {
  return session({
    name: name,
    secret: getEnvConfig.get('jwtSecret'),
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: DbClinet,
      dbName: getEnvConfig.get('dbName'),
      collectionName: `${prefix}sessions`,
    }),
    cookie: {
      httpOnly: true,
      secure: getEnvConfig.get('nodeEnv') === 'production',
      sameSite: getEnvConfig.get('nodeEnv') === 'production' ? 'none' : 'lax',
      // domain: getEnvConfig.get('nodeEnv') === 'production' ? getEnvConfig.get('domain') : undefined,
      maxAge: getEnvConfig.get('cookieExpire') * 24 * 60 * 60 * 1000,
    },
  });
};

const sessionHandler = (req, res, next) => {
  // If path starts with /api/v1/admin, use admin session
  if (req.path.startsWith('/api/v1/admin')) {
    return createSessionConfig('admin.sid', 'admin_')(req, res, next);
  }
  // For all other routes, use user session
  return createSessionConfig('user.sid', 'user_')(req, res, next);
};

export default sessionHandler;