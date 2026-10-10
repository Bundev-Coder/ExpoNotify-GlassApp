# VietinBank iPay - Trình Tạo Thông Báo Biến Động Số Dư iOS

Ứng dụng di động **React Native (Expo SDK 57)** chuyên tạo và mô phỏng thông báo **Biến Động Số Dư Ngân Hàng** chuẩn iOS (Physical Device ARM64) với đầy đủ icon ngân hàng VietinBank iPay, chuông báo, rung và badge icon.

---

## 🌟 Tính Năng Nổi Bật

1. **Khớp 100% Thông Báo Ngân Hàng Thật:**
   - Cú pháp chuẩn VietinBank: `TK 59xxx783|GD: -30,000VND 09/10/26 17:04 |SD: 882VND|DEN: NGUYEN PHUONG DUY - 105887004147|ND: NGUYEN HOANG VINH chuyen tien`.
   - Hỗ trợ đổi loại giao dịch: 🔴 Chuyển tiền (`-`) hoặc 🟢 Nhận tiền (`+`).
   - Tự động định dạng số tiền (`30,000`, `50,000,000 VND`).
   - Tự động cập nhật ngày giờ giao dịch theo thời gian thực (`DD/MM/YY HH:mm`).

2. **Khung Xem Trước Banner iOS (Live Preview):**
   - Mô phỏng trực quan banner thông báo iOS ngay trên màn hình app trước khi gửi.

3. **Hẹn Giờ Thông Báo (Countdown Timer - Siêu Tiện Lợi):**
   - Gửi ngay (0s) hoặc hẹn giờ **5s / 10s / 30s**.
   - Sau khi bấm hẹn giờ, người dùng có thể **khóa màn hình iPhone**; hết thời gian đếm ngược, điện thoại sẽ tự động sáng màn hình, nổ chuông và hiện banner thông báo như có tiền gửi về thật.

4. **Nạp Mẫu Nhanh 1-Click (Presets):**
   - Mẫu ảnh (-30K)
   - Nhận lương (+35Tr)
   - Nhận cọc (+50Tr)

---

## 📲 Tải Về & Cài Đặt File `.ipa`

File `.ipa` được biên dịch chuẩn kiến trúc **ARM64 Physical Device** (không bị văng app trên iPhone thật):

- **Đường dẫn cục bộ:** `C:\Users\ad\Documents\ExpoNotify_GlassApp\NotifyGlass_Device.ipa`
- **Tải trực tiếp:** [Tải NotifyGlass_Device.ipa (Build 13)](https://github.com/Bundev-Coder/ExpoNotify-GlassApp/releases/download/release-13/NotifyGlass_Device.ipa)
- **Cài đặt qua:** Sideloadly, AltStore, TrollStore, Scarlet hoặc chứng chỉ cá nhân.
