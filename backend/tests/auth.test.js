import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock all external dependencies before importing the controller
const mockFindOne = jest.fn().mockReturnValue({ lean: jest.fn() });
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUserSave = jest.fn();

const mockRefreshCreate = jest.fn();
const mockRefreshFindOne = jest.fn();
const mockRefreshFindOneAndUpdate = jest.fn();
const mockRefreshUpdateMany = jest.fn();

const mockSendEmail = jest.fn();
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), http: jest.fn() };

jest.unstable_mockModule("../models/User.js", () => ({
  default: { findOne: mockFindOne, findById: mockFindById, create: mockCreate },
}));
jest.unstable_mockModule("../models/RefreshToken.js", () => ({
  default: {
    create: mockRefreshCreate,
    findOne: mockRefreshFindOne,
    findOneAndUpdate: mockRefreshFindOneAndUpdate,
    updateMany: mockRefreshUpdateMany,
  },
}));
jest.unstable_mockModule("../config/email.js", () => ({ sendEmail: mockSendEmail }));
jest.unstable_mockModule("../config/logger.js", () => ({ default: mockLogger }));
jest.unstable_mockModule("path", () => ({
  default: { resolve: jest.fn(() => "/fake/path/img.jpg"), basename: jest.fn(() => "img.jpg") },
}));
jest.unstable_mockModule("fs", () => ({
  default: { existsSync: jest.fn(() => false), unlinkSync: jest.fn() },
}));

const {
  registerUser,
  loginUser,
  logoutUser,
  getUserInfo,
  forgotPassword,
  resetPassword,
} = await import("../controllers/authControllers.js");

// Build mock req/res/next
const mockRRN = (body = {}, overrides = {}) => {
  const req = { body, cookies: {}, headers: {}, id: "req-id", user: null, params: {}, ...overrides };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), cookie: jest.fn(), clearCookie: jest.fn(), sendFile: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
};

const makeUser = (overrides = {}) => ({
  _id: { toString: () => "64a1b2c3d4e5f6a7b8c9d0e1" },
  fullName: "Jane Doe",
  email: "jane@example.com",
  password: "$2b$12$hashedpassword",
  profileImageUrl: null,
  defaultCurrency: "USD",
  comparePassword: jest.fn().mockResolvedValue(true),
  save: mockUserSave,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

// ── Register ──────────────────────────────────────────────────────────────────

describe("registerUser", () => {
  it("creates a user and returns a 201 with token", async () => {
    mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockCreate.mockResolvedValue(makeUser());

    const { req, res } = mockRRN({
      fullName: "Jane Doe", email: "jane@example.com", password: "password123",
    });

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success", data: expect.objectContaining({ token: expect.any(String) }) })
    );
  });

  it("returns 409 when email is already registered", async () => {
    mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(makeUser()) });

    const { req, res } = mockRRN({
      fullName: "Jane Doe", email: "jane@example.com", password: "password123",
    });

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "EMAIL_IN_USE" }));
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe("loginUser", () => {
  it("returns 200 with token and sets cookie on success", async () => {
    mockFindOne.mockResolvedValue(makeUser());
    mockRefreshCreate.mockResolvedValue({});

    const { req, res } = mockRRN({ email: "jane@example.com", password: "password123" });

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ token: expect.any(String) }) })
    );
    expect(res.cookie).toHaveBeenCalledWith("refreshToken", expect.any(String), expect.any(Object));
  });

  it("returns 401 for unknown email", async () => {
    mockFindOne.mockResolvedValue(null);
    const { req, res } = mockRRN({ email: "nobody@example.com", password: "pw" });

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "INVALID_CREDENTIALS" }));
  });

  it("returns 401 for wrong password", async () => {
    mockFindOne.mockResolvedValue(
      makeUser({ comparePassword: jest.fn().mockResolvedValue(false) })
    );
    const { req, res } = mockRRN({ email: "jane@example.com", password: "wrong" });

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "INVALID_CREDENTIALS" }));
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────

describe("logoutUser", () => {
  it("revokes the token and clears the cookie", async () => {
    mockRefreshFindOneAndUpdate.mockResolvedValue({});
    const { req, res } = mockRRN({}, { cookies: { refreshToken: "sometoken" } });

    await logoutUser(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
  });

  it("still succeeds when no cookie is present", async () => {
    const { req, res } = mockRRN({}, { cookies: {} });

    await logoutUser(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
  });
});

// ── Get user ──────────────────────────────────────────────────────────────────

describe("getUserInfo", () => {
  it("returns user data for the authenticated user", async () => {
    const user = makeUser();
    mockFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(user) }),
    });

    const { req, res } = mockRRN({}, { user: { id: "64a1b2c3d4e5f6a7b8c9d0e1" } });

    await getUserInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ user: expect.any(Object) }) })
    );
  });

  it("returns 404 when user is not found", async () => {
    mockFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    const { req, res } = mockRRN({}, { user: { id: "64a1b2c3d4e5f6a7b8c9d0e1" } });

    await getUserInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "USER_NOT_FOUND" }));
  });
});

// ── Forgot password ───────────────────────────────────────────────────────────

describe("forgotPassword", () => {
  it("returns 200 even when no user exists (prevents enumeration)", async () => {
    mockFindOne.mockResolvedValue(null);
    const { req, res } = mockRRN({ email: "nobody@example.com" });

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("sends a reset email when user exists", async () => {
    mockFindOne.mockResolvedValue(makeUser());
    mockSendEmail.mockResolvedValue({});
    const { req, res } = mockRRN({ email: "jane@example.com" });

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockSendEmail).toHaveBeenCalled();
  });
});

// ── Reset password ────────────────────────────────────────────────────────────

describe("resetPassword", () => {
  it("returns 400 for an invalid token length", async () => {
    const { req, res } = mockRRN(
      { password: "newpassword123" },
      { params: { token: "tooshort" } }
    );

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "INVALID_TOKEN" }));
  });

  it("returns 400 when token is not found in DB", async () => {
    mockFindOne.mockResolvedValue(null);
    const { req, res } = mockRRN(
      { password: "newpassword123" },
      { params: { token: "a".repeat(64) } }
    );

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "INVALID_TOKEN" }));
  });
});
