FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arg for the API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production stage: Nginx serves the built files ────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
