import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockCategoryFind = jest.fn();
const mockCategoryCreate = jest.fn();
const mockCategoryFindOneAndDelete = jest.fn();
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), http: jest.fn() };

jest.unstable_mockModule("../models/Category.js", () => ({
  default: { find: mockCategoryFind, create: mockCategoryCreate, findOneAndDelete: mockCategoryFindOneAndDelete },
}));
jest.unstable_mockModule("../config/logger.js", () => ({ default: mockLogger }));

const { getCategories, createCategory, deleteCategory } = await import("../controllers/categoryControllers.js");

const userId = "64a1b2c3d4e5f6a7b8c9d0e1";

const mockRRN = (body = {}, overrides = {}) => ({
  req: { body, user: { id: userId }, params: {}, id: "req-id", ...overrides },
  res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
  next: jest.fn(),
});

const makeCat = (overrides = {}) => ({
  _id: "64d1b2c3d4e5f6a7b8c9d0e4",
  userId,
  name: "Transport",
  icon: "LuCar",
  type: "expense",
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

// ── getCategories ─────────────────────────────────────────────────────────────

describe("getCategories", () => {
  it("returns system + user categories", async () => {
    mockCategoryFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        makeCat({ userId: null, name: "Food & Dining" }),
        makeCat(),
      ]),
    });

    const { req, res } = mockRRN();

    await getCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.data.categories).toHaveLength(2);
  });
});

// ── createCategory ────────────────────────────────────────────────────────────

describe("createCategory", () => {
  it("creates and returns a new category", async () => {
    mockCategoryCreate.mockResolvedValue(makeCat());

    const { req, res } = mockRRN({ name: "Transport", icon: "LuCar", type: "expense" });

    await createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.data.category.name).toBe("Transport");
  });

  it("returns 409 for a duplicate category name", async () => {
    const dupError = new Error("duplicate");
    dupError.code = 11000;
    mockCategoryCreate.mockRejectedValue(dupError);

    const { req, res, next } = mockRRN({ name: "Transport", icon: "LuCar", type: "expense" });

    await createCategory(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "DUPLICATE_CATEGORY" }));
  });
});

// ── deleteCategory ────────────────────────────────────────────────────────────

describe("deleteCategory", () => {
  it("deletes a user-owned category and returns success", async () => {
    mockCategoryFindOneAndDelete.mockResolvedValue(makeCat());

    const { req, res } = mockRRN({}, { params: { id: "64d1b2c3d4e5f6a7b8c9d0e4" } });

    await deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
  });

  it("returns 404 for system categories or missing records", async () => {
    mockCategoryFindOneAndDelete.mockResolvedValue(null);

    const { req, res } = mockRRN({}, { params: { id: "64d1b2c3d4e5f6a7b8c9d0e4" } });

    await deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOT_FOUND" }));
  });
});
