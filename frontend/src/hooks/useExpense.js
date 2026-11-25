import { useState, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API } from "../utils/apiPaths";
import { downloadBlob } from "../utils/helper";
import toast from "react-hot-toast";

export const useExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ hasNextPage: false, nextCursor: null });
  const [loading, setLoading]   = useState(false);

  const fetchExpenses = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(API.EXPENSE.GET, { params });
      if (params.cursor) {
        setExpenses((prev) => [...prev, ...data.data.expenses]);
      } else {
        setExpenses(data.data.expenses);
      }
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  const addExpense = useCallback(async (payload) => {
    const { data } = await axiosInstance.post(API.EXPENSE.ADD, payload);
    setExpenses((prev) => [data.data.expense, ...prev]);
    return data.data.expense;
  }, []);

  const deleteExpense = useCallback(async (id) => {
    await axiosInstance.delete(API.EXPENSE.DELETE(id));
    setExpenses((prev) => prev.filter((e) => e._id !== id));
  }, []);

  const downloadExcel = useCallback(async () => {
    const response = await axiosInstance.get(API.EXPENSE.DOWNLOAD_EXCEL, {
      responseType: "blob",
    });
    downloadBlob(response.data, "expense-details.xlsx");
  }, []);

  return { expenses, pagination, loading, fetchExpenses, addExpense, deleteExpense, downloadExcel };
};
