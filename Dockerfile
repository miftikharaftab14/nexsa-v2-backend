# Build dependencies
FROM node:22-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

# Build application
FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime image (production)
FROM node:22-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=deps /usr/src/app/node_modules ./node_modules
RUN npm prune --omit=dev

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/public ./public
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000
CMD ["sh", "./start.sh"]
