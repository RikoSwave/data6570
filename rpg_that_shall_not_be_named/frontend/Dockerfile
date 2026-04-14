# Stage 1: Build the React Native web app
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Export the app for web
ENV EXPO_PUBLIC_API_URL=/api
ENV EXPO_NO_TELEMETRY=1
ENV CI=1
RUN npx expo export --platform web

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy exported static files
# Expo exports to `dist` folder by default in modern SDKs
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
