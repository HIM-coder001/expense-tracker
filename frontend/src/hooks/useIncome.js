import { useState, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API } from "../utils/apiPaths";
import { downloadBlob } from "../utils/helper";
import toast from "react-hot-toast";

export const useIncome = () => {
  const [income, setIncome]     = useState([]);
  const [pagination, setPagination] = useState({ hasNextPage: false, nextCursor: null });
  const [loading, setLoading]   = useState(false);

  const fetchIncome = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(API.INCOME.GET, { params });
      if (params.cursor) {
        setIncome((prev) => [...prev, ...data.data.income]);
      } else {
        setIncome(data.data.income);
      }
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load income");
    } finally {
      setLoading(false);
    }
  }, []);

  const addIncome = useCallback(async (payload) => {
    const { data } = await axiosInstance.post(API.INCOME.ADD, payload);
    setIncome((prev) => [data.data.income, ...prev]);
    return data.data.income;
  }, []);

  const deleteIncome = useCallback(async (id) => {
    await axiosInstance.delete(API.INCOME.DELETE(id));
    setIncome((prev) => prev.filter((i) => i._id !== id));
  }, []);

  const downloadExcel = useCallback(async () => {
    const response = await axiosInstance.get(API.INCOME.DOWNLOAD_EXCEL, {
      responseType: "blob",
    });
    downloadBlob(response.data, "income-details.xlsx");
  }, []);

  return { income, pagination, loading, fetchIncome, addIncome, deleteIncome, downloadExcel };
};
