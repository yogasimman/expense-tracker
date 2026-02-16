@echo off
REM PostgreSQL Database Setup for Expense Tracker
REM This script will prompt for password and create the database

echo.
echo ===================================
echo  Expense Tracker Database Setup
echo ===================================
echo.

REM Set PostgreSQL path
set PSQL_PATH=C:\Program Files\PostgreSQL\18\bin\psql.exe

REM Check if psql exists
if not exist "%PSQL_PATH%" (
    echo ERROR: PostgreSQL not found at %PSQL_PATH%
    echo Please update PSQL_PATH in this script to match your installation
    pause
    exit /b 1
)

echo This script will:
echo 1. Create the 'expense_tracker' database
echo 2. Create all required tables
echo.
echo You will be prompted for the PostgreSQL password.
echo.
pause

REM Create database
echo.
echo Creating database 'expense_tracker'...
"%PSQL_PATH%" -U postgres -c "CREATE DATABASE expense_tracker;" 2>nul
if errorlevel 1 (
    echo Database may already exist or authentication failed.
    echo Continuing anyway...
)

REM Run schema file
echo.
echo Creating tables and schema...
"%PSQL_PATH%" -U postgres -d expense_tracker -f "%~dp0schema.sql"

if errorlevel 1 (
    echo.
    echo ERROR: Failed to create schema.
    echo Please check your password and try again.
    pause
    exit /b 1
)

echo.
echo ===================================
echo  SUCCESS!
echo ===================================
echo.
echo Database 'expense_tracker' is ready!
echo.
echo Next steps:
echo 1. Update config/database.js with your PostgreSQL password
echo 2. Run: npm start
echo.
pause
