const jwt = require('jsonwebtoken');
const config = require('../utils/config');
const prisma = require('../utils/prisma');
const { HttpError, asyncHandler } = require('../utils/httpError');

// Verifies the bearer token and loads the current user (with role profile ids).
const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Authentication required');
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { student: true, institution: true, employer: true },
  });
  if (!user) throw new HttpError(401, 'User no longer exists');
  req.user = user;
  next();
});

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have access to this resource'));
  next();
};

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

module.exports = { authenticate, authorize, signToken };
