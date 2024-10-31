# Use a specific Node.js version
FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json separately to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set the environment variable for production (optional)
ENV NODE_ENV=development

# Start the application
CMD ["npm", "run", "start:dev"]
