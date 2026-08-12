FROM node:22-alpine AS build

WORKDIR /app

COPY server/package*.json ./server/
RUN npm ci --prefix server --include=dev

COPY server ./server
COPY data/release/questions-release.json ./data/release/questions-release.json

RUN npm run build --prefix server
RUN npm prune --prefix server --omit=dev

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV CLIENT_URLS=https://tempale.online,https://www.tempale.online

COPY --from=build /app/server/package*.json ./server/
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/data/release/questions-release.json ./data/release/questions-release.json

EXPOSE 3002

CMD ["npm", "run", "start", "--prefix", "server"]
