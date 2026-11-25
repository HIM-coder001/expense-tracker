import React, { useRef, useState } from "react";
import { LuX, LuCamera, LuUser, LuUpload } from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API } from "../../utils/apiPaths";
import useProfileImage from "../../hooks/useProfileImage";
import toast from "react-hot-toast";

/**
 * Modal that lets the logged-in user change their profile picture.
 * Uses the existing authenticated upload endpoint.
 * Props:
 *   onClose – () => void
 */
const ProfileModal = ({ onClose }) => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const currentBlobUrl = useProfileImage(user?.profileImageUrl);

  const [preview, setPreview]   = useState(null);  // local object URL for instant preview
  const [file, setFile]         = useState(null);   // the actual File to upload
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // Close on Escape
  React.useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [onClose, preview]);

  const handleFileChange = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    if (!picked.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (picked.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(picked));
    setFile(picked);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await axiosInstance.post(API.AUTH.UPLOAD_IMAGE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update the user in context so the avatar refreshes everywhere immediately
      setUser((prev) => ({ ...prev, profileImageUrl: data.data.profileImageUrl }));
      toast.success("Profile picture updated");
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Profile Picture</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <LuX size={20} />
          </button>
        </div>

        {/* Avatar preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-28 w-28 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center ring-4 ring-violet-50">
              {preview ? (
                <img src={preview} alt="New profile" className="h-full w-full object-cover" />
              ) : currentBlobUrl ? (
                <img
                  src={currentBlobUrl}
                  alt={user?.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-violet-500">
                  {user?.fullName?.[0]?.toUpperCase() ?? <LuUser size={40} />}
                </span>
              )}
            </div>

            {/* Camera overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-md hover:bg-violet-700 transition-colors"
              aria-label="Choose photo"
            >
              <LuCamera size={16} />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* File name indicator */}
          {file ? (
            <p className="text-xs text-violet-600 font-medium truncate max-w-[200px]">
              {file.name}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-500 hover:text-violet-600 transition-colors"
            >
              Click to choose a photo
            </button>
          )}

          {error && (
            <p className="text-xs text-red-500 text-center" role="alert">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            <LuUpload size={15} />
            {loading ? "Uploading…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
