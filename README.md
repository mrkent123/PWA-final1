# Screenshot to PWA Prototype Framework

Framework để biến đống screenshot/video lộn xộn thành PWA prototype trực quan, dễ quản lý mà không cần code UI phức tạp.

## 🎯 Mục tiêu

- Tạo prototype nhanh cho mobile app
- Dùng ảnh screenshot làm giao diện
- Vẽ vùng hotspot để điều hướng
- Kết hợp mock data và workflow
- Deploy như PWA native trên điện thoại

## 📁 Cấu trúc Project

```
├── src/
│   ├── assets/
│   │   ├── screens/          # Thư mục chứa ảnh screenshot
│   │   └── screens.json      # Danh sách ảnh màn hình
│   ├── screens/              # Component chính
│   └── app/                  # App routing
├── hotspot.json              # Cấu hình hotspots
├── workflows.json            # Logic điều hướng và mock data
└── README.md
```

## 🚀 Cách sử dụng

### 1. Thêm ảnh màn hình

- Đặt ảnh vào `src/assets/screens/`
- Cập nhật `src/assets/screens.json`:

```json
[
  {
    "src": "assets/screens/login.jpg",
    "id": "login"
  },
  {
    "src": "assets/screens/dashboard.jpg",
    "id": "dashboard"
  }
]
```

### 1.5 Tự động xử lý hotspots (từ ImageJ)

#### Cài đặt ImageJ Integration:

1. **Cài đặt ImageJ/Fiji** từ: https://imagej.nih.gov/ij/download.html

2. **Copy macro vào ImageJ**:
   - Mở ImageJ → Plugins → New → Macro
   - Paste nội dung từ `imagej-macros/hotspot-exporter.ijm`
   - Save as: `hotspot-exporter.ijm`

3. **Chạy watcher để auto-sync**:
```bash
npm run watch:hotspots
```

#### Quy trình làm việc:

1. **Mở ảnh trong ImageJ**: File → Open → Chọn ảnh từ `src/assets/screens/`

2. **Tạo ROIs**: Sử dụng Rectangle tool để vẽ vùng hotspots

3. **Export tọa độ**: Plugins → Macros → hotspot-exporter
   - Hoặc nhấn `E` (Ctrl+E)
   - Macro sẽ tự động export JSON và chạy processing script

4. **Kết quả**: Hotspots được merge vào `hotspot.json` và app tự động reload

#### File watcher tự động:

```bash
npm run watch:hotspots  # Theo dõi thay đổi file JSON và tự động sync
```

Khi có file JSON mới từ ImageJ, watcher sẽ tự động:
- Phát hiện file mới
- Merge vào main hotspot.json
- App tự động reload với hotspots mới

#### Manual processing:

```bash
npm run process:hotspots  # Xử lý thủ công khi cần
```

### 2. Config hotspots

Chỉnh sửa `hotspot.json`:

```json
{
  "screens": {
    "login": [
      {
        "id": "login_btn",
        "x": "10%",
        "y": "50%",
        "width": "80%",
        "height": "10%",
        "action": "navigate",
        "target": "dashboard"
      }
    ],
    "dashboard": [
      {
        "id": "logout_btn",
        "x": "5%",
        "y": "5%",
        "width": "15%",
        "height": "8%",
        "action": "navigate",
        "target": "login"
      }
    ]
  }
}
```

### 3. Config workflows

Chỉnh sửa `workflows.json`:

```json
{
  "initialScreen": "login",
  "screens": {
    "login": {
      "hotspots": "login",
      "mockData": {
        "username": "test@example.com",
        "password": "password123"
      }
    },
    "dashboard": {
      "hotspots": "dashboard",
      "mockData": {}
    }
  }
}
```

### 4. Chạy prototype

```bash
npm install
npm run serve:external
```

Truy cập từ mobile: `http://[IP]:8102`

### 5. Build PWA

```bash
npm run build:pwa
npm run cap:add:android
npm run cap:run:android
```

## 🛠 Tính năng

- ✅ Full-screen image viewer
- ✅ Swipe navigation
- ✅ Clickable hotspots
- ✅ Mock data simulation
- ✅ PWA deployment
- ✅ Mobile-first design

## 📝 Ghi chú

- Ảnh nên là screenshot thực tế của app
- Hotspots dùng % để responsive
- Mock data để simulate API responses
- PWA có thể install như app native

## 🔧 Mở rộng

- Thêm video support
- Input fields overlay
- Dynamic content từ mock API
- User flow recording
