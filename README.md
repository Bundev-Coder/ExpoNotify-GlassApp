# NotifyGlass - Expo Local Push Notifications (iOS Glassmorphism)

Ứng dụng di động được xây dựng bằng **React Native** & **Expo SDK 57**, tích hợp tính năng **Local Push Notifications** và giao diện phong cách **Glassmorphism (Dark Mode #0f172a) với hiệu ứng Neon Glow Cyan**.

Dự án hỗ trợ xuất file `.ipa` trực tiếp trên hệ điều hành Windows thông qua **EAS (Expo Application Services)** mà không cần máy Mac.

---

## 📁 Cấu Trúc Dự Án

- `App.js`: Giao diện Glassmorphism với thẻ kính mờ `BlurView`, nút bấm Neon Cyan Glow, logic xin cấp quyền iOS và kích hoạt thông báo tức thì.
- `app.json`: Cấu hình `bundleIdentifier: "com.antigravity.notifyglass"`, icon, splash screen và plugin `expo-notifications`.
- `eas.json`: Cấu hình profile build đám mây cho iOS (`preview` để xuất file `.ipa` thiết bị thật, `preview-simulator` cho giả lập).

---

## 🚀 Chạy Thử Nghiệm Trực Tiếp (Local Development)

Trong thư mục dự án:
```powershell
cd c:\Users\ad\Documents\ExpoNotify_GlassApp
npx expo start
```
- Mở ứng dụng **Expo Go** trên điện thoại iPhone của bạn và quét mã QR trên màn hình terminal.
- Nhấn vào thông báo cấp quyền khi mở app và thử gửi các tin nhắn thông báo.

---

## 📦 Quy Trình Build Xuất File `.ipa` Trên Windows Bằng EAS

### 1. Cài đặt EAS CLI và Đăng nhập
```powershell
npm install -g eas-cli
eas login
```

### 2. Khởi tạo liên kết dự án
```powershell
eas init
```

### 3. Chạy lệnh xuất file `.ipa`
- **Dành cho máy thật (Cần tài khoản Apple Developer):**
  ```powershell
  eas build --platform ios --profile preview
  ```
  *EAS sẽ tự động kết nối tài khoản Apple Developer của bạn để tạo Provisioning Profile, Distribution Certificate và ký số file `.ipa`.*

- **Dành cho iOS Simulator (Không cần tài khoản Apple Developer):**
  ```powershell
  eas build --platform ios --profile preview-simulator
  ```

---

## 🎨 Thông Tin Giao Diện & Màu Sắc
- **Màu nền Dark Mode**: `#0f172a` (Slate 900)
- **Ánh sáng phản chiếu nền**: Cyan (`#00f2fe`), Purple (`#8b5cf6`), Blue (`#0284c7`)
- **Thẻ kính mờ**: `BlurView` độ mờ 45 tint dark, viền `rgba(255, 255, 255, 0.18)`
- **Nút bấm hành động**: Neon Glow Cyan (`#00f2fe`) với `shadowRadius: 22`
