# ── Build Stage ──
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig*.json vite.config.ts tailwind.config.ts postcss.config.js index.html ./
COPY public ./public
COPY src ./src

# Build-time API URLs (defaults to localhost for dev-on-host access)
ARG VITE_USER_SERVICE_URL=http://localhost:8001
ARG VITE_ORDER_SERVICE_URL=http://localhost:8002
ARG VITE_NOTIFICATION_SERVICE_URL=http://localhost:8003
ENV VITE_USER_SERVICE_URL=$VITE_USER_SERVICE_URL
ENV VITE_ORDER_SERVICE_URL=$VITE_ORDER_SERVICE_URL
ENV VITE_NOTIFICATION_SERVICE_URL=$VITE_NOTIFICATION_SERVICE_URL

RUN npm run build

# ── Serve Stage ──
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config with SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
