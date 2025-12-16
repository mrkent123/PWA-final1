@echo off
REM Setup script for ImageJ integration

echo 🚀 Setting up ImageJ integration for Screenshot-to-PWA Framework
echo.

REM Check if ImageJ directory exists
if exist "C:\Program Files\ImageJ" (
    echo ✅ Found ImageJ in Program Files
    set IMAGEJ_DIR="C:\Program Files\ImageJ"
) else if exist "C:\Program Files (x86)\ImageJ" (
    echo ✅ Found ImageJ in Program Files (x86)
    set IMAGEJ_DIR="C:\Program Files (x86)\ImageJ"
) else if exist "%USERPROFILE%\ImageJ" (
    echo ✅ Found ImageJ in User directory
    set IMAGEJ_DIR="%USERPROFILE%\ImageJ"
) else (
    echo ❌ ImageJ not found in standard locations.
    echo Please install ImageJ from: https://imagej.nih.gov/ij/download.html
    echo Or specify the path manually.
    goto :eof
)

echo 📂 ImageJ directory: %IMAGEJ_DIR%

REM Create macros directory if it doesn't exist
if not exist %IMAGEJ_DIR%\macros (
    mkdir %IMAGEJ_DIR%\macros
    echo 📁 Created macros directory
)

REM Copy macro file
if exist "imagej-macros\hotspot-exporter.ijm" (
    copy "imagej-macros\hotspot-exporter.ijm" %IMAGEJ_DIR%\macros\
    echo ✅ Copied hotspot-exporter.ijm to ImageJ macros directory
) else (
    echo ❌ Macro file not found: imagej-macros\hotspot-exporter.ijm
)

echo.
echo 🎯 Setup complete! 
echo.
echo 📋 Next steps:
echo 1. Open ImageJ
echo 2. The macro should appear in Plugins → Macros
echo 3. Run 'npm run watch:hotspots' in your project
echo 4. Start creating hotspots in ImageJ!
echo.
echo 📖 For detailed instructions, see README.md
echo.
pause
