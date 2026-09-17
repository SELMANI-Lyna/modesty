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

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-[#8B7CD8] bg-[#8B7CD8]/5 scale-[1.005]"
            : "border-gray-200/90 hover:border-[#8B7CD8]/60 bg-gray-50/40 hover:bg-gray-50/80"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="py-2 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#8B7CD8] border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-[#6555B6]">Téléversement en cours…</p>
            <p className="text-xs text-gray-400">Optimisation et enregistrement sur Cloudinary</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#8B7CD8]/10 text-[#6555B6] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-800">
              <span className="text-[#6555B6] hover:underline font-semibold">Cliquez pour importer</span> ou glissez-déposez
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WEBP • Max 10 Mo par photo
            </p>
          </div>
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
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200/80 rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <span>{uploadError}</span>
        </div>
      )}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Photos ajoutées ({images.length})
            </span>
            <span className="text-[11px] text-gray-400">La première sera l'image principale</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((url, i) => (
              <div
                key={url + i}
                className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-2xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Product image ${i + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium rounded">
                    Principale
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-semibold gap-1 backdrop-blur-2xs"
                  aria-label="Supprimer la photo"
                >
                  <span className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                    ✕
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
