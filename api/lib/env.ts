import "dotenv/config";

// Trước đây chỉ throw khi NODE_ENV==='production' — một bản deploy staging/preview quên set
// biến đó sẽ âm thầm chạy với secret rỗng (JWT ký bằng chuỗi rỗng, ai cũng đoán được) mà không
// một cảnh báo nào. Giờ luôn throw trừ khi người vận hành CHỦ ĐỘNG khai LOCAL_ONLY=1 (chế độ
// demo offline không dùng đăng nhập/DB — xem router.ts) — không còn dựa vào NODE_ENV nữa.
function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.LOCAL_ONLY !== "1") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
};
