// Set environment variables before any module is loaded
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-chars-long";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-at-least-32-chars";
process.env.JWT_EXPIRES_IN = "15m";
process.env.UPLOAD_DIR = "private_uploads";
process.env.CLIENT_URL = "http://localhost:5173";
