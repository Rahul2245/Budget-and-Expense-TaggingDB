# Base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# 3. Copy package files first to leverage Docker layer caching
COPY package*.json ./

#4. install depenedies
RUN npm install

#5. copy to rest of our application code
COPY . .

# 6. Expose the port your backend runs on (e.g., 5000 or 8080)
EXPOSE 5000

# 7. Command to run the application in development mode
CMD ["npm", "run", "dev"]