import { jest, describe, it, expect } from "@jest/globals";
import jwt from "jsonwebtoken";
import { z } from "zod";
import protect from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validation/authSchemas.js";
import { addIncomeSchema } from "../validation/incomeSchemas.js";
import { addExpenseSchema } from "../validation/expenseSchemas.js";

// Helper to build mock Express req/res/next
const mockReqResNext = (overrides = {}) => {
  const req = { headers: {}, body: {}, ...overrides };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
};

// ── authMiddleware ────────────────────────────────────────────────────────────

describe("protect middleware", () => {
  it("calls next() with valid token", () => {
    const token = jwt.sign({ id: "user123" }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: "user123" });
  });

  it("returns 401 NO_TOKEN when no authorization header", () => {
    const { req, res, next } = mockReqResNext();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "NO_TOKEN" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 TOKEN_EXPIRED for an expired token", () => {
    const token = jwt.sign({ id: "user123" }, process.env.JWT_SECRET, { expiresIn: "-1s" });
    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "TOKEN_EXPIRED" })
    );
  });

  it("returns 401 TOKEN_INVALID for a tampered token", () => {
    const { req, res, next } = mockReqResNext({
      headers: { authorization: "Bearer tampered.token.here" },
    });

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "TOKEN_INVALID" })
    );
  });
});

// ── validate middleware ───────────────────────────────────────────────────────

describe("validate middleware — registerSchema", () => {
  it("calls next() for valid input", () => {
    const { req, res, next } = mockReqResNext({
      body: { fullName: "Jane Doe", email: "jane@example.com", password: "password123" },
    });

    validate(registerSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 VALIDATION_ERROR for missing fullName", () => {
    const { req, res, next } = mockReqResNext({
      body: { email: "jane@example.com", password: "password123" },
    });

    validate(registerSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "VALIDATION_ERROR" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid email", () => {
    const { req, res, next } = mockReqResNext({
      body: { fullName: "Jane", email: "bademail", password: "password123" },
    });

    validate(registerSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("strips unknown fields from req.body", () => {
    const { req, res, next } = mockReqResNext({
      body: {
        fullName: "Jane Doe",
        email: "jane@example.com",
        password: "password123",
        isAdmin: true,
      },
    });

    validate(registerSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.isAdmin).toBeUndefined();
  });
});

describe("validate middleware — addIncomeSchema", () => {
  it("passes valid income data", () => {
    const { req, res, next } = mockReqResNext({
      body: { source: "Salary", amount: 1000, date: "2026-10-01" },
    });

    validate(addIncomeSchema)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("rejects missing source", () => {
    const { req, res, next } = mockReqResNext({
      body: { amount: 1000, date: "2026-10-01" },
    });

    validate(addIncomeSchema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects negative amount", () => {
    const { req, res, next } = mockReqResNext({
      body: { source: "Salary", amount: -50, date: "2026-10-01" },
    });

    validate(addIncomeSchema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("validate middleware — addExpenseSchema", () => {
  it("passes valid expense data", () => {
    const { req, res, next } = mockReqResNext({
      body: { title: "Groceries", amount: 50, date: "2026-10-05" },
    });

    validate(addExpenseSchema)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("rejects zero amount", () => {
    const { req, res, next } = mockReqResNext({
      body: { title: "Groceries", amount: 0, date: "2026-10-05" },
    });

    validate(addExpenseSchema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── validate middleware — query source ───────────────────────────────────────

describe("validate middleware — query source", () => {
  it("places validated data on req.validatedQuery not req.query", () => {
    const schema = z.object({ limit: z.string().optional() });
    const { req, res, next } = mockReqResNext();
    req.query = { limit: "10" };

    validate(schema, "query")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.validatedQuery).toBeDefined();
  });
});
