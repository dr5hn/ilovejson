# Base on official Node.js Alpine image
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json before other files
COPY ./package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose the listening port
EXPOSE 3000

# Run npm script when container starts
CMD "npm" "run" "dev"
