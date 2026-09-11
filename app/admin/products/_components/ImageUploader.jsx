"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/**
 * Uploads a file to Cloudinary using a server-issued signature.
 * The API secret never leaves the server.
 */
async function uploadToCloudinary(file, folder = "shop-products") {
  // 1. Get signature from our server
  const sigRes = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  if (!sigRes.ok) {
    const contentType = sigRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const err = await sigRes.json();
      throw new Error(err.error || "Failed to get upload signature");
    }
    const text = await sigRes.text();
    if (text.includes("/admin/login") || text.includes("Admin session required")) {
      throw new Error("Admin session expired or not logged in. Please sign in again.");
    }
    throw new Error("Failed to get upload signature");
  }
  const { signature, timestamp, apiKey, cloudName, folder: signedFolder } = await sigRes.json();

  // 2. Upload directly to Cloudinary
  const formData = new FormData();
  formData.append("file", file);
  formData.append("signature", signature);
  formData.append("timestamp", timestamp);
  formData.append("api_key", apiKey);
  formData.append("folder", signedFolder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!uploadRes.ok) {
    const errorData = await uploadRes.json().catch(() => null);
    throw new Error(errorData?.error?.message || "Cloudinary upload failed");
  }
  const data = await uploadRes.json();
  return data.secure_url;
}

/**
 * Multi-image uploader for product images.
 * Props:
 *   images: string[]          — current list of Cloudinary URLs
 *   onChange: (urls) => void  — called when images list changes
 *   folder?: string           — Cloudinary folder (default "shop-products")
 */
export default function ImageUploader({ images = [], onChange, folder = "shop-products" }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploadError("");
    setUploading(true);

    const newUrls = [];
    for (const file of Array.from(files)) {
      // Basic client-side validation
      if (!file.type.startsWith("image/")) {
        setUploadError("Only image files are accepted.");
        setUploading(false);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("Each image must be under 10 MB.");
        setUploading(false);
        return;
      }
      try {
        const url = await uploadToCloudinary(file, folder);
        newUrls.push(url);
      } catch (err) {
        setUploadError(err.message || "Upload failed. Check Cloudinary configuration.");
        setUploading(false);
        return;
      }
    }

    onChange([...images, ...newUrls]);
    setUploading(false);
    // Reset file input
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (index) => {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div>
      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((url, i) => (
            <div key={url + i} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Product image ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-lg font-bold"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <p className="text-sm text-gray-500 animate-pulse">Uploading…</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">Click to upload images</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — max 10 MB each</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
      />

      {uploadError && (
        <p className="mt-2 text-sm text-red-600">{uploadError}</p>
      )}
    </div>
  );
}
