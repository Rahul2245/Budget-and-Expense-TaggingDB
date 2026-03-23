FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build # Vite builds to a 'dist' folder


FROM nginx:alpine
# Copy the built assets from Stage 1 into the Nginx server
COPY --from=build /app/dist /usr/share/nginx/html
# Expose port 80 for Nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]