# Use official Node.js Alpine image
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
# RUN npm install

# Copy the rest of the application
COPY . .

# Copy the start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Expose the default NestJS port
EXPOSE 3000

# Use the start script as the container's command
CMD ["sh", "./start.sh"]
