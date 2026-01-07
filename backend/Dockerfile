FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port (Railway will override with its own PORT)
EXPOSE 5001

# Start the server
CMD ["node", "src/server.js"]
