import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockIncomeCreate = jest.fn();
const mockIncomeFind = jest.fn();
const mockIncomeFindOneAndDelete = jest.fn();
const mockUserFindById = jest.fn();
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), http: jest.fn() };

jest.unstable_mockModule("../models/Income.js", () => ({
  default: { create: mockIncomeCreate, find: mockIncomeFind, findOneAndDelete: mockIncomeFindOneAndDelete },
}));
jest.unstable_mockModule("../models/User.js", () => ({
  default: { findById: mockUserFindById },
}));
jest.unstable_mockModule("../config/logger.js", () => ({ default: mockLogger }));
// stub exceljs to avoid loading the whole library
jest.unstable_mockModule("exceljs", () => ({
  default: { Workbook: jest.fn() },
}));

const { addIncome, getAllIncome, deleteIncome } = await import("../controllers/incomeControllers.js");

const userId = "64a1b2c3d4e5f6a7b8c9d0e1";

const mockRRN = (body = {}, overrides = {}) => {
  const req = {
    body,
    user: { id: userId },
    params: {},
    query: {},
    validatedQuery: null,
    id: "req-id",
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    end: jest.fn(),
  };
  const next = jest.fn();
  return { req, res, next };
};

const makeIncomeDoc = () => ({
  _id: "64b1b2c3d4e5f6a7b8c9d0e2",
  userId,
  source: "Salary",
  amount: 500000,
  currencyCode: "USD",
  date: new Date("2026-10-01"),
  toObject: jest.fn().mockReturnValue({
    _id: "64b1b2c3d4e5f6a7b8c9d0e2",
    userId,
    source: "Salary",
    amount: 500000,
    currencyCode: "USD",
    date: new Date("2026-10-01"),
  }),
});

beforeEach(() => jest.clearAllMocks());

// ── addIncome ─────────────────────────────────────────────────────────────────

describe("addIncome", () => {
  it("creates a record and returns amount in major units", async () => {
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ defaultCurrency: "USD" }),
      }),
    });
    mockIncomeCreate.mockResolvedValue(makeIncomeDoc());

    const { req, res } = mockRRN({ source: "Salary", amount: 5000, date: "2026-10-01T00:00:00.000Z" });

    await addIncome(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.data.income.amount).toBe(5000); // 500000 / 100
  });

  it("stores amount as minor units in the DB", async () => {
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ defaultCurrency: "USD" }),
      }),
    });
    mockIncomeCreate.mockResolvedValue(makeIncomeDoc());

    const { req } = mockRRN({ source: "Salary", amount: 5000, date: "2026-10-01T00:00:00.000Z" });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await addIncome(req, res);

    expect(mockIncomeCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 500000 })
    );
  });

  it("falls back to USD when user has no defaultCurrency", async () => {
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });
    mockIncomeCreate.mockResolvedValue(makeIncomeDoc());

    const { req, res } = mockRRN({ source: "Salary", amount: 100, date: "2026-10-01T00:00:00.000Z" });

    await addIncome(req, res);

    expect(mockIncomeCreate).toHaveBeenCalledWith(
      expect.objectContaining({ currencyCode: "USD" })
    );
  });
});

// ── getAllIncome ───────────────────────────────────────────────────────────────

describe("getAllIncome", () => {
  it("returns a list with correct pagination shape", async () => {
    mockIncomeFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([makeIncomeDoc()]),
    });

    const { req, res } = mockRRN();

    await getAllIncome(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.data.income).toHaveLength(1);
    expect(body.data.pagination.hasNextPage).toBe(false);
  });

  it("sets hasNextPage true when more records exist beyond the page", async () => {
    // Return pageSize+1 items to trigger hasNextPage
    const docs = Array.from({ length: 21 }, () => makeIncomeDoc());
    mockIncomeFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(docs),
    });

    const { req, res } = mockRRN();

    await getAllIncome(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.data.pagination.hasNextPage).toBe(true);
    expect(body.data.income).toHaveLength(20); // trimmed to pageSize
  });
});

// ── deleteIncome ──────────────────────────────────────────────────────────────

describe("deleteIncome", () => {
  it("deletes a record and returns success", async () => {
    mockIncomeFindOneAndDelete.mockResolvedValue(makeIncomeDoc());

    const { req, res } = mockRRN({}, { params: { id: "64b1b2c3d4e5f6a7b8c9d0e2" } });

    await deleteIncome(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
  });

  it("returns 404 when record is not found", async () => {
    mockIncomeFindOneAndDelete.mockResolvedValue(null);

    const { req, res } = mockRRN({}, { params: { id: "64b1b2c3d4e5f6a7b8c9d0e2" } });

    await deleteIncome(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOT_FOUND" }));
  });

  it("returns 400 for an invalid MongoDB ObjectId", async () => {
    const { req, res } = mockRRN({}, { params: { id: "not-a-valid-id" } });

    await deleteIncome(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "INVALID_ID" }));
  });
});
