FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (cached layer unless package.json changes)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 && \
    mkdir -p private_uploads uploads && \
    chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 5000

CMD ["node", "server.js"]
