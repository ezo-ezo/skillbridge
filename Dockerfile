# Single-image build: React client is compiled, then served by the Express API.
FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client ./
RUN npm run build

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package*.json ./
# embedded-postgres (dev-only) is skipped; prisma CLI is a runtime dependency for `db push`.
RUN npm ci --omit=dev
COPY server ./
RUN npx prisma generate
COPY --from=client /app/client/dist /app/client/dist
RUN mkdir -p uploads
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/index.js"]
