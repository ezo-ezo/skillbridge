const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./utils/config');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.clientUrl.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
if (!config.isProd) app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => console.log(`SkillBridge API listening on http://localhost:${config.port}`));
}

module.exports = app;
