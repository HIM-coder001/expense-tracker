import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockExpenseCreate = jest.fn();
const mockExpenseFind = jest.fn();
const mockExpenseFindOneAndDelete = jest.fn();
const mockUserFindById = jest.fn();
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), http: jest.fn() };

jest.unstable_mockModule("../models/Expense.js", () => ({
  default: { create: mockExpenseCreate, find: mockExpenseFind, findOneAndDelete: mockExpenseFindOneAndDelete },
}));
jest.unstable_mockModule("../models/User.js", () => ({
  default: { findById: mockUserFindById },
}));
jest.unstable_mockModule("../config/logger.js", () => ({ default: mockLogger }));
jest.unstable_mockModule("exceljs", () => ({
  default: { Workbook: jest.fn() },
}));

const { addExpense, getAllExpenses, deleteExpense } = await import("../controllers/expenseControllers.js");

const userId = "64a1b2c3d4e5f6a7b8c9d0e1";

const mockRRN = (body = {}, overrides = {}) => ({
  req: { body, user: { id: userId }, params: {}, query: {}, validatedQuery: null, id: "req-id", ...overrides },
  res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), setHeader: jest.fn(), end: jest.fn() },
  next: jest.fn(),
});

const makeExpenseDoc = () => ({
  _id: "64c1b2c3d4e5f6a7b8c9d0e3",
  userId,
  title: "Groceries",
  amount: 8500,
  currencyCode: "USD",
  date: new Date("2026-10-05"),
  toObject: jest.fn().mockReturnValue({
    _id: "64c1b2c3d4e5f6a7b8c9d0e3",
    userId,
    title: "Groceries",
    amount: 8500,
    currencyCode: "USD",
    date: new Date("2026-10-05"),
  }),
});

beforeEach(() => jest.clearAllMocks());

// ── addExpense ────────────────────────────────────────────────────────────────

describe("addExpense", () => {
  it("creates a record and returns amount in major units", async () => {
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ defaultCurrency: "USD" }) }),
    });
    mockExpenseCreate.mockResolvedValue(makeExpenseDoc());

    const { req, res } = mockRRN({ title: "Groceries", amount: 85, date: "2026-10-05T00:00:00.000Z" });

    await addExpense(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.data.expense.amount).toBe(85); // 8500 / 100
  });

  it("stores amount as minor units in the DB", async () => {
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ defaultCurrency: "USD" }) }),
    });
    mockExpenseCreate.mockResolvedValue(makeExpenseDoc());

    const { req, res } = mockRRN({ title: "Groceries", amount: 85, date: "2026-10-05T00:00:00.000Z" });

    await addExpense(req, res);

    expect(mockExpenseCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 8500 })
    );
  });
});

// ── getAllExpenses ─────────────────────────────────────────────────────────────

describe("getAllExpenses", () => {
  it("returns a list with correct pagination shape", async () => {
    mockExpenseFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([makeExpenseDoc()]),
    });

    const { req, res } = mockRRN();

    await getAllExpenses(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.data.expenses).toHaveLength(1);
    expect(body.data.pagination).toBeDefined();
  });

  it("returns empty list when no records exist", async () => {
    mockExpenseFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    const { req, res } = mockRRN();

    await getAllExpenses(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.data.expenses).toHaveLength(0);
    expect(body.data.pagination.hasNextPage).toBe(false);
  });
});

// ── deleteExpense ─────────────────────────────────────────────────────────────

describe("deleteExpense", () => {
  it("deletes a record and returns success", async () => {
    mockExpenseFindOneAndDelete.mockResolvedValue(makeExpenseDoc());

    const { req, res } = mockRRN({}, { params: { id: "64c1b2c3d4e5f6a7b8c9d0e3" } });

    await deleteExpense(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 404 when record not found", async () => {
    mockExpenseFindOneAndDelete.mockResolvedValue(null);

    const { req, res } = mockRRN({}, { params: { id: "64c1b2c3d4e5f6a7b8c9d0e3" } });

    await deleteExpense(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOT_FOUND" }));
  });

  it("returns 400 for an invalid ID", async () => {
    const { req, res } = mockRRN({}, { params: { id: "bad-id" } });

    await deleteExpense(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "INVALID_ID" }));
  });
});
