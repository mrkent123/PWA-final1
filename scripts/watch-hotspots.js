const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { processHotspots } = require('./process-hotspots');

// File watcher để tự động sync JSON từ ImageJ
function startWatcher() {
  const screensDir = path.join(__dirname, '..', 'src', 'assets', 'screens');

  console.log('🔍 Đang theo dõi thư mục:', screensDir);
  console.log('💡 Mỗi khi có file JSON mới/sửa đổi sẽ tự động sync vào hotspot.json');
  console.log('❌ Nhấn Ctrl+C để dừng');

  // Watch for changes in screens directory
  const watcher = chokidar.watch(screensDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  // Handle file changes
  watcher.on('add', (filePath) => {
    if (path.extname(filePath) === '.json' && path.basename(filePath) !== 'screens.json') {
      console.log(`📄 File mới được thêm: ${path.basename(filePath)}`);
      processHotspots();
    }
  });

  watcher.on('change', (filePath) => {
    if (path.extname(filePath) === '.json' && path.basename(filePath) !== 'screens.json') {
      console.log(`✏️  File được sửa đổi: ${path.basename(filePath)}`);
      processHotspots();
    }
  });

  watcher.on('unlink', (filePath) => {
    if (path.extname(filePath) === '.json') {
      console.log(`🗑️  File bị xóa: ${path.basename(filePath)}`);
      // Có thể thêm logic để remove khỏi main hotspot.json
    }
  });

  // Handle errors
  watcher.on('error', (error) => {
    console.error('❌ Lỗi watcher:', error);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Đang dừng watcher...');
    watcher.close();
    process.exit(0);
  });
}

// Check if chokidar is available
try {
  require.resolve('chokidar');
} catch (e) {
  console.log('⚠️  Chokidar chưa được cài đặt. Cài đặt bằng: npm install chokidar --save-dev');
  console.log('⚠️  Trong lúc đó, bạn có thể chạy thủ công: npm run process:hotspots');
  process.exit(1);
}

// Start the watcher
if (require.main === module) {
  startWatcher();
}

module.exports = { startWatcher };
