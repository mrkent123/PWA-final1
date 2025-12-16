const fs = require('fs');
const path = require('path');

// Script để tự động merge hotspot files từ thư mục screens vào main hotspot.json

function processHotspots() {
  const screensDir = path.join(__dirname, '..', 'src', 'assets', 'screens');
  const mainHotspotPath = path.join(__dirname, '..', 'hotspot.json');

  // Đọc main hotspot.json
  let mainHotspots = {};
  if (fs.existsSync(mainHotspotPath)) {
    mainHotspots = JSON.parse(fs.readFileSync(mainHotspotPath, 'utf8'));
  } else {
    mainHotspots = { screens: {} };
  }

  // Duyệt qua các file trong thư mục screens
  const files = fs.readdirSync(screensDir);

  files.forEach(file => {
    if (file.endsWith('.json') && file !== 'screens.json' && file !== 'hotspot.json') {
      const filePath = path.join(screensDir, file);
      const screenName = path.parse(file).name; // Tên file không có extension

      try {
        const hotspotData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (hotspotData.hotspots && Array.isArray(hotspotData.hotspots)) {
          // Thêm actions mặc định cho hotspots
          const hotspotsWithActions = hotspotData.hotspots.map(hotspot => ({
            ...hotspot,
            action: hotspot.action || 'navigate',
            target: hotspot.target || 'dashboard'
          }));

          mainHotspots.screens[screenName] = hotspotsWithActions;

          console.log(`✅ Đã thêm hotspots cho màn hình: ${screenName}`);
        }
      } catch (error) {
        console.error(`❌ Lỗi đọc file ${file}:`, error.message);
      }
    }
  });

  // Ghi lại main hotspot.json
  fs.writeFileSync(mainHotspotPath, JSON.stringify(mainHotspots, null, 2));
  console.log('🎉 Đã cập nhật hotspot.json chính!');
}

// Chạy script
if (require.main === module) {
  processHotspots();
}

module.exports = { processHotspots };
