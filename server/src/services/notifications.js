const prisma = require('../utils/prisma');

const notify = (userId, title, body, link) =>
  prisma.notification.create({ data: { userId, title, body, link } }).catch((e) => console.error('notify failed', e.message));

module.exports = { notify };
