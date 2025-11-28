@echo off
echo Starting Mutima Application...

:: This will start existing containers. 
:: It will ONLY build if this is the very first time you run it.
docker-compose up -d

echo Application is running!

:: Wait 2 seconds just to be safe
timeout /t 2

:: Opens your specific sign-in page
start http://localhost:8080/pages/sign-in.html

:: Closes the terminal window automatically so it doesn't clutter your screen
exit