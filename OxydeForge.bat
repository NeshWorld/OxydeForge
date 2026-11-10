@echo off
title OxydeForge
cd /d "%~dp0"

if not exist node_modules (
  echo Premiere installation des dependances...
  call npm install
  if errorlevel 1 goto failed
)

echo Allumage de la forge : la premiere compilation Rust peut prendre quelques minutes.
echo Ferme cette fenetre pour arreter l'application.
call npm run app
if errorlevel 1 goto failed
exit /b 0

:failed
echo.
echo OxydeForge n'a pas pu demarrer. L'erreur est affichee ci-dessus.
pause
exit /b 1
