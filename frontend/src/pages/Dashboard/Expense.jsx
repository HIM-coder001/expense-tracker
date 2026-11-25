import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/Layouts/DashboardLayout";
import TransactionList from "../../components/ui/TransactionList";
import TransactionForm from "../../components/ui/TransactionForm";
import Modal from "../../components/ui/Modal";
import { useExpense } from "../../hooks/useExpense";
import { LuPlus, LuDownload } from "react-icons/lu";
import toast from "react-hot-toast";

const Expense = () => {
  const { expenses, pagination, loading, fetchExpenses, addExpense, deleteExpense, downloadExcel } =
    useExpense();

  const [showModal, setShowModal]   = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleDelete = useCallback(async (id) => {
    setDeletingId(id);
    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  }, [deleteExpense]);

  const handleDownload = async () => {
    try {
      await downloadExcel();
      toast.success("Download started");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleLoadMore = () => {
    if (pagination.nextCursor) {
      fetchExpenses({ cursor: pagination.nextCursor });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Expenses</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track where your money goes
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <LuDownload size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 transition-colors"
            >
              <LuPlus size={16} />
              Add Expense
            </button>
          </div>
        </div>

        {/* List */}
        {loading && !expenses.length ? (
          <div className="flex justify-center py-16 text-slate-400 text-sm">Loading…</div>
        ) : (
          <>
            <TransactionList
              items={expenses}
              type="expense"
              onDelete={handleDelete}
              loadingId={deletingId}
            />

            {pagination.hasNextPage && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <Modal title="Add Expense" onClose={() => setShowModal(false)}>
          <TransactionForm
            type="expense"
            onSubmit={addExpense}
            onClose={() => setShowModal(false)}
          />
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Expense;
