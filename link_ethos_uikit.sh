#!/bin/bash

# This script is used to link the ethos-uikit package to the ethos frontend package. Download the ethos-uikit, the script will then link the ethos-uikit package to the ethos frontend package.

# Check if the script is being run as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo "This script requires sudo privileges. Please run with sudo."
  exit 1
fi

# Get the directory of the script
frontend_ethos_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
default_ethos_ui_kit_path="$HOME/Downloads/ethos-uikit.zip"

# Prompt user for folder location of ethos-uikit or use default location if no input is given
read -p "Enter the path to the ethos-uikit folder (default: $default_ethos_ui_kit_path): " ethos_ui_kit_path

# If no input is given, use default location in the users downloads folder
if [ -z "$ethos_ui_kit_path" ]; then
    ethos_ui_kit_path=$default_ethos_ui_kit_path
fi

# If the input path is a zip file, extract without user input into a folder at the same location with the same name as the zip file without the .zip extension and use that folder as the ethos_ui_kit_path
if [[ $ethos_ui_kit_path == *.zip ]]; then
    unzip -o $ethos_ui_kit_path -d ${ethos_ui_kit_path%.*}
    ethos_ui_kit_path=${ethos_ui_kit_path%.*}
fi

# Go to ethos-uikit folder 
cd $ethos_ui_kit_path || { echo "Error: ethos-uikit folder not found."; exit 1; }

# Remove the package-lock.json file, the node_modules folder and the dist folder if they exist
rm package-lock.json 
rm -rf node_modules
rm -rf dist

# Install npm packages
npm i

# Build the package
ng build ethos-uikit

# Go to the dist folder and run npm link
cd dist/ethos-uikit || { echo "Error: dist/ethos-uikit folder not found."; exit 1; }
npm link

# Go to the frontend-ethos package and run npm link
cd $frontend_ethos_path || { echo "Error: "${frontend_ethos_path}" not found."; exit 1; }
npm link ethos-uikit

# Inform user that linking is complete
echo "Linking complete."