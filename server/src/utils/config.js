require('dotenv').config();

const config = {
  port: Number(process.env.PORT) || 4000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  openai: {
    key: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  isProd: process.env.NODE_ENV === 'production',
};

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is not set. Copy .env.example to .env and set it.');
}

module.exports = config;
