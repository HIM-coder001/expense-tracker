import Income from "../models/Income.js";
import mongoose from "mongoose";
import xlsx from "xlsx";

// Add Income Source
export const addIncome = async (req, res) => {
  try {
    const userId = req.user.id;
    const { icon, source, amount, date } = req.body;

    // Validate required fields
    if (
      typeof source !== "string" ||
      !source.trim() ||
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !date
    ) {
      return res.status(400).json({
        message: "Source, amount, and date are required",
      });
    }

    // Validate amount
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be a valid number greater than zero",
      });
    }

    // Validate date
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Please provide a valid date",
      });
    }

    const newIncome = await Income.create({
      userId,
      icon,
      source: source.trim(),
      amount: parsedAmount,
      date: parsedDate,
    });

    return res.status(201).json({
      message: "Income added successfully",
      income: newIncome,
    });
  } catch (error) {
    console.error("Add income error:", error);

    return res.status(500).json({
      message: "Failed to add income",
    });
  }
};

// Get All Income Sources
export const getAllIncome = async (req, res) => {
  try {
    const userId = req.user.id;

    const income = await Income.find({ userId })
      .sort({ date: -1 });

    return res.status(200).json({
      count: income.length,
      income,
    });
  } catch (error) {
    console.error("Get income error:", error);

    return res.status(500).json({
      message: "Failed to retrieve income records",
    });
  }
};

// Download Income as Excel
export const downloadIncomeExcel = async (req, res) => {
  try {
    const userId = req.user.id;

    const income = await Income.find({ userId })
      .select("source amount date -_id")
      .sort({ date: -1 })
      .lean();

    // Prepare rows for the Excel worksheet
    const data = income.map((item) => ({
      Source: item.source,
      Amount: item.amount,
      Date: item.date
        ? new Date(item.date).toISOString().split("T")[0]
        : "",
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);

    xlsx.utils.book_append_sheet(workbook, worksheet, "Income");

    // Generate the Excel file in memory
    const buffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Send the file to the client
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="income-details.xlsx"'
    );

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Download income error:", error);

    return res.status(500).json({
      message: "Failed to export income records",
    });
  }
};

// Delete Income Source
export const deleteIncome = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Validate MongoDB document ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid income ID",
      });
    }

    // Delete only if this record belongs to the logged-in user
    const deletedIncome = await Income.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!deletedIncome) {
      return res.status(404).json({
        message: "Income record not found",
      });
    }

    return res.status(200).json({
      message: "Income deleted successfully",
    });
  } catch (error) {
    console.error("Delete income error:", error);

    return res.status(500).json({
      message: "Failed to delete income",
    });
  }
};