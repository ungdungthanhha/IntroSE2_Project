# 🔐 Cấu hình Environment Variables

## Tổng quan

Dự án này sử dụng file `.env` để lưu trữ các API key và thông tin nhạy cảm. File này **KHÔNG** được commit lên Git.

## Cách thiết lập

1. **Tạo file `.env`** từ template:
   ```bash
   copy .env.example .env
   ```

2. **Điền các giá trị API key** vào file `.env`:

### Gemini API Key
- Truy cập: https://aistudio.google.com/app/apikey
- Tạo API key mới
- Copy và dán vào `GEMINI_API_KEY`

### Firebase Configuration
- Mở file `android/app/google-services.json`
- Lấy các giá trị tương ứng:
  - `current_key` → `FIREBASE_API_KEY`
  - `project_id` → `FIREBASE_PROJECT_ID`
  - `storage_bucket` → `FIREBASE_STORAGE_BUCKET`
  - `project_number` → `FIREBASE_MESSAGING_SENDER_ID`
  - `mobilesdk_app_id` → `FIREBASE_APP_ID`
  - `firebase_url` → `FIREBASE_DATABASE_URL`

## Cấu trúc file .env

```env
GEMINI_API_KEY=your_actual_gemini_api_key
FIREBASE_API_KEY=your_actual_firebase_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_DATABASE_URL=your_database_url
```

## Lưu ý quan trọng

⚠️ **KHÔNG BAO GIỜ** commit file `.env` lên Git

✅ File `.env` đã được thêm vào `.gitignore`

✅ Chỉ commit file `.env.example` (không chứa API key thật)

## Sử dụng trong code

```typescript
import { GEMINI_API_KEY, FIREBASE_API_KEY } from '@env';

// Sử dụng biến
const api = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
```

## Build lại sau khi thay đổi .env

Sau khi thay đổi file `.env`, cần clean và build lại:

```bash
# Android
cd android && ./gradlew clean && cd ..
npm run android

# iOS (nếu có)
cd ios && pod install && cd ..
npm run ios
```

## Troubleshooting

Nếu gặp lỗi không đọc được environment variables:
1. Đảm bảo đã tạo file `.env` từ `.env.example`
2. Kiểm tra `babel.config.js` có cấu hình plugin `react-native-dotenv`
3. Clean cache và build lại project
