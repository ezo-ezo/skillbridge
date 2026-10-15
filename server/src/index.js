const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./utils/config');
const routes = require('./routes');
const misc = require('./controllers/miscController');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Behind a load balancer / reverse proxy (Elastic Beanstalk, nginx): use the real client IP for rate limiting.
if (config.isProd) app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https:'],
        // Only set ALLOW_HTTP=true when serving over plain HTTP (e.g. a demo without a certificate);
        // otherwise browsers would rewrite asset requests to https:// and the page would not load.
        'upgrade-insecure-requests': process.env.ALLOW_HTTP === 'true' ? null : [],
      },
    },
    hsts: process.env.ALLOW_HTTP === 'true' ? false : undefined,
  }),
);
app.use(cors({ origin: config.clientUrl.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
if (!config.isProd) app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.get('/uploads/:filename', misc.serveUpload);
app.use('/api', routes);

// Single-service deployment: if the client has been built, serve it (with SPA fallback) from this process.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/|uploads\/).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => console.log(`SkillBridge API listening on http://localhost:${config.port}`));
}

module.exports = app;
