import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4040', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crm_sales_db',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_crm_jwt_token_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieExpiresInDays: parseInt(process.env.COOKIE_EXPIRES_IN_DAYS || '7', 10),
};
