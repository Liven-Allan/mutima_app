# Use Nginx to serve static files
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy your frontend files to the nginx html folder
COPY . /usr/share/nginx/html

# Expose port 80 (default for web traffic)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]