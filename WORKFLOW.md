# Quy trình làm việc hoàn toàn tự động: Hệ sinh thái chuẩn hóa ảnh

## 1. Thiết lập ban đầu
1. Đặt ảnh screenshot vào thư mục `src/assets/screens/` với bất kỳ tên file nào
2. Chạy script xử lý ảnh tự động:
```bash
python scripts/process_images.py
```
   - Script sẽ tự động: chuẩn hóa tên file, nhóm ảnh liên quan, xử lý vùng sim sóng, tạo cấu hình `screens.json`

## 2. Cấu hình hành vi ứng dụng
1. Cập nhật `hotspot.json` để xác định vùng tương tác:
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
       ]
     }
   }
   ```
2. Cập nhật `workflows.json` để xác định luồng điều hướng và mock data

## 3. Chạy ứng dụng cho người dùng cuối
```bash
npm install
npm run serve:external
```
- Người dùng truy cập: `http://[IP]:8102`
- Trải nghiệm như app native 100% (không thấy công cụ phát triển)

## 4. Tạo hotspot (chế độ phát triển)
1. Truy cập ứng dụng từ trình duyệt (hoặc thiết bị di động cùng mạng)
2. Nhấn nút **➕** để vào chế độ tạo hotspot (chỉ trong môi trường phát triển)
3. Click và kéo trên màn hình để tạo vùng hotspot
4. Nhấn lại nút **➕** để thoát chế độ tạo
5. Dữ liệu sẽ được lưu vào clipboard, dán vào `hotspot.json`

## 5. Chạy trên thiết bị di động
```bash
npm run build:pwa
npm run cap:add:android
npm run cap:run:android
```

## Ghi chú
- Hệ thống hoàn toàn tự động hóa: không cần chuẩn hóa tên file thủ công
- Không cần nhóm ảnh thủ công
- Không cần xử lý vùng sim sóng thủ công
- Người dùng chỉ thấy trải nghiệm native hoàn hảo
- Script `process_images.py` tự động phân loại ảnh tĩnh/cuộn dựa trên nội dung
