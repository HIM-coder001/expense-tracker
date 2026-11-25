import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API } from "../utils/apiPaths";

/**
 * Fetches the current user's profile image via the authenticated endpoint
 * and returns a local blob URL safe to use in <img src>.
 *
 * Returns null while loading or if no image exists.
 * Revokes the object URL on unmount to avoid memory leaks.
 *
 * @param {string|null} profileImageUrl  — the user.profileImageUrl field.
 *   Re-fetches whenever this value changes (e.g. after an upload).
 */
const useProfileImage = (profileImageUrl) => {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!profileImageUrl) {
      setBlobUrl(null);
      return;
    }

    let objectUrl = null;
    let cancelled = false;

    axiosInstance
      .get(API.AUTH.PROFILE_IMAGE, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profileImageUrl]);

  return blobUrl;
};

export default useProfileImage;
