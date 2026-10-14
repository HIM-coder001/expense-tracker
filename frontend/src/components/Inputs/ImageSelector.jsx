import React, { useEffect, useState } from "react";
import { LuUser, LuCamera } from "react-icons/lu";

const ImageSelector = ({ onImageSelect, onError }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!preview) return;

    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const handleChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError("Profile picture must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    onError(null);
    onImageSelect(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col items-center mb-2">
      <label
        htmlFor="profilePic"
        className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-violet-300 bg-violet-50 transition hover:border-violet-500"
      >
        {preview ? (
          <img
            src={preview}
            alt="Profile preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <LuUser size={32} className="text-violet-400" />
        )}

        <span className="absolute bottom-0 right-0 rounded-full bg-violet-600 p-1.5 text-white">
          <LuCamera size={14} />
        </span>
      </label>

      <input
        id="profilePic"
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      <p className="mt-2 text-xs text-slate-500">
        Upload profile picture (optional)
      </p>
    </div>
  );
};

export default ImageSelector;
