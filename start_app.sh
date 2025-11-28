#!/bin/bash

echo "Starting Mutima Application..."

# Start existing containers (same as Windows)
docker-compose up -d

echo "Application is running!"

# 'sleep' is the Linux equivalent of 'timeout'
sleep 2

# 'xdg-open' is the standard Linux command to open the default browser
# It works on Ubuntu, Fedora, Debian, etc.
xdg-open "http://localhost:8080/pages/sign-in.html" > /dev/null 2>&1 &

# Terminal closes automatically when script ends
exit 0