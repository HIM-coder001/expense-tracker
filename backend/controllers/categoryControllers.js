import Category from "../models/Category.js";

// ─── List categories ──────────────────────────────────────────────────────────
// Returns system defaults (userId: null) + user's own categories

export const getCategories = async (req, res) => {
  const userId = req.user.id;

  const categories = await Category.find({
    $or: [{ userId: null }, { userId }],
  })
    .sort({ userId: 1, name: 1 }) // system first, then user-defined
    .lean();

  return res.status(200).json({ status: "success", data: { categories } });
};

// ─── Create user category ─────────────────────────────────────────────────────

export const createCategory = async (req, res) => {
  const userId = req.user.id;
  const { name, icon, type } = req.body;

  try {
    const category = await Category.create({ userId, name, icon, type });
    return res.status(201).json({ status: "success", data: { category } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        status: "error",
        code: "DUPLICATE_CATEGORY",
        message: "A category with that name already exists",
      });
    }
    throw err;
  }
};

// ─── Delete user category ─────────────────────────────────────────────────────

export const deleteCategory = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  // Users can only delete their own categories — not system ones (userId: null)
  const deleted = await Category.findOneAndDelete({ _id: id, userId });

  if (!deleted) {
    return res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: "Category not found or cannot be deleted",
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Category deleted",
  });
};
