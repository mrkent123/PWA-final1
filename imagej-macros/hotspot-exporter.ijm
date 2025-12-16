// ImageJ Macro: Hotspot Coordinate Exporter
// Version: 1.0
// Description: Export ROI coordinates as JSON for PWA prototype hotspots

// Global variables - Use relative path for portability
var projectRoot = getDirectory("current"); // Get current working directory
// Go up from macros directory to project root
var rootParts = split(projectRoot, File.separator);
var outputDir = "";
for (i = 0; i < rootParts.length - 2; i++) {
    outputDir += rootParts[i] + File.separator;
}
outputDir += "src" + File.separator + "assets" + File.separator + "screens" + File.separator;

var imageTitle = getTitle();
var baseName = substring(imageTitle, 0, lastIndexOf(imageTitle, "."));

// Function to export hotspots
function exportHotspots() {
    // Get number of ROIs
    roiCount = roiManager("count");

    if (roiCount == 0) {
        showMessage("No ROIs found! Please create ROIs first.");
        return;
    }

    // Get image dimensions
    getDimensions(width, height, channels, slices, frames);

    // Prepare JSON structure
    json = "{\n";
    json += '  "hotspots": [\n';

    // Process each ROI
    for (i = 0; i < roiCount; i++) {
        roiManager("select", i);

        // Get ROI bounds
        getSelectionBounds(x, y, w, h);

        // Convert to percentage
        xPercent = (x / width) * 100;
        yPercent = (y / height) * 100;
        wPercent = (w / width) * 100;
        hPercent = (h / height) * 100;

        // Format coordinates
        xStr = d2s(xPercent, 2) + "%";
        yStr = d2s(yPercent, 2) + "%";
        wStr = d2s(wPercent, 2) + "%";
        hStr = d2s(hPercent, 2) + "%";

        // Add to JSON
        json += '    {\n';
        json += '      "id": "hotspot_' + i + '",\n';
        json += '      "x": "' + xStr + '",\n';
        json += '      "y": "' + yStr + '",\n';
        json += '      "width": "' + wStr + '",\n';
        json += '      "height": "' + hStr + '"\n';
        json += '    }';

        if (i < roiCount - 1) {
            json += ',';
        }
        json += '\n';
    }

    json += '  ]\n';
    json += '}';

    // Create output filename
    outputFile = outputDir + baseName + ".json";

    // Write to file
    File.saveString(json, outputFile);

    showMessage("Hotspots exported to:\n" + outputFile);

    // Optional: Auto-run processing script
    autoProcess = getBoolean("Auto-run processing script?", "Yes", "No");
    if (autoProcess) {
        runProcessingScript();
    }
}

// Function to run Node.js processing script
function runProcessingScript() {
    // Run the processing script via command line
    cmd = "cmd /c cd /d C:\\Users\\mrken\\myApp && npm run process:hotspots";
    exec(cmd);
    showMessage("Processing script executed!");
}

// Main execution
macro "Export Hotspots [e]" {
    exportHotspots();
}

// Keyboard shortcut: Ctrl+E
macro "Export Hotspots (Shortcut) [E]" {
    exportHotspots();
}
