@echo off
echo =======================================================
echo CaseJoy Hub - Backend Startup Script
echo =======================================================
echo.
echo Make sure Docker Desktop is RUNNING before continuing!
echo.
pause

cd Backend

echo [1/3] Checking dependencies...
IF NOT EXIST vendor\bin\sail (
    echo [2/3] Installing Composer dependencies via Docker...
    docker run --rm -v "%cd%:/var/www/html" -w /var/www/html laravelsail/php83-composer:latest composer install --ignore-platform-reqs
) ELSE (
    echo [2/3] Dependencies already installed!
)

echo [3/3] Starting Laravel Sail (Docker)...
call vendor\bin\sail up -d

echo.
echo =======================================================
echo Backend is starting in the background!
echo Setting up the database and seeding mock data...
echo =======================================================
timeout /t 10 /nobreak > NUL

call vendor\bin\sail artisan migrate:fresh --seed

echo.
echo Done! The backend is running at http://localhost
echo.
pause
