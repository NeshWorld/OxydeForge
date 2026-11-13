#!/usr/bin/env sh
# Lanceur d'OxydeForge pour macOS et Linux (l'équivalent d'OxydeForge.bat).
# Usage : ./OxydeForge.sh
set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Première installation des dépendances..."
  npm install
fi

echo "Allumage de la forge : la première compilation Rust peut prendre quelques minutes."
echo "Ctrl + C dans ce terminal pour arrêter l'application."
npm run app
