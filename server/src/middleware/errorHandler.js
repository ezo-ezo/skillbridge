const config = require('../utils/config');

const notFound = (req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  if (err.code === 'P2002') { status = 409; message = 'A record with these details already exists'; }
  if (err.code === 'P2025') { status = 404; message = 'Record not found'; }
  if (err.name === 'MulterError') status = 400;
  if (status >= 500) {
    console.error(err);
    if (config.isProd) message = 'Internal server error';
  }
  res.status(status).json({ error: message, details: err.details });
};

module.exports = { notFound, errorHandler };
