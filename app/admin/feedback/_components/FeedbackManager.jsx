"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

async function uploadFilesToCloudinary(files) {
  const urls = [];

  for (const file of files) {
    const sigRes = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "shop-feedback" }),
    });

    if (!sigRes.ok) {
      const err = await sigRes.json();
      throw new Error(err.error || "Failed to get upload signature");
    }

    const { signature, timestamp, apiKey, cloudName, folder: signedFolder } = await sigRes.json();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature", signature);
    formData.append("timestamp", timestamp);
    formData.append("api_key", apiKey);
    formData.append("folder", signedFolder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json().catch(() => null);
      throw new Error(errorData?.error?.message || "Cloudinary upload failed");
    }

    const data = await uploadRes.json();
    urls.push(data.secure_url);
  }

  return urls;
}

function RatingStars({ rating = 0 }) {
  return (
    <div className="flex items-center gap-1 text-amber-400 text-sm" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= (rating || 0) ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </div>
  );
}

function StatusBadge({ approved }) {
  return approved ? (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-[#8B7CD8]/10 text-[#6555B6] border-[#8B7CD8]/25">
      Approved
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-200">
      Pending
    </span>
  );
}

function extractInstagramUsername(url) {
  const match = String(url || "").match(/instagram\.com\/(?:stories\/)?([a-zA-Z0-9_.]+)/i);
  if (!match) return null;
  const skip = new Set(["p", "reel", "reels", "share", "stories", "explore", "accounts"]);
  if (skip.has(match[1].toLowerCase())) return null;
  return match[1];
}

export default function FeedbackManager({ initialFeedbacks = [], products = [] }) {
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [showModal, setShowModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [changingProductId, setChangingProductId] = useState(null);
  const [form, setForm] = useState({
    clientName: "",
    message: "",
    rating: 5,
    approved: true,
    productId: "",
    photos: [],
    storyLink: "",
  });

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return products.filter((product) => product.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const allVisibleFeedbacks = useMemo(() => {
    return feedbacks;
  }, [feedbacks]);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateStoryLink = (value) => {
    const username = extractInstagramUsername(value);
    setForm((prev) => {
      const next = { ...prev, storyLink: value };
      if (username) {
        const autoName = `@${username}`;
        const wasAuto = !prev.clientName.trim() || prev.clientName.startsWith("@");
        if (wasAuto) next.clientName = autoName;
      }
      return next;
    });
  };

  const handlePhotoUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    try {
      setUploadingPhotos(true);
      const urls = await uploadFilesToCloudinary(selectedFiles);
      updateForm("photos", [...form.photos, ...urls]);
    } catch (error) {
      alert(error.message || "Photo upload failed");
    } finally {
      setUploadingPhotos(false);
      event.target.value = "";
    }
  };

  const handleAddFeedback = async () => {
    if (!form.clientName.trim() || !form.message.trim()) {
      alert("Client name and message are required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName,
          message: form.message,
          rating: Number(form.rating),
          photos: form.photos,
          approved: form.approved,
          productId: form.productId || null,
          storyLink: form.storyLink.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create feedback");
      }

      setFeedbacks((prev) => [data, ...prev]);
      setForm({
        clientName: "",
        message: "",
        rating: 5,
        approved: true,
        productId: "",
        photos: [],
        storyLink: "",
      });
      setShowModal(false);
      setProductSearch("");
    } catch (error) {
      alert(error.message || "Could not create feedback");
    } finally {
      setSaving(false);
    }
  };

  const toggleApproval = async (feedback) => {
    setTogglingId(feedback.id);
    try {
      const response = await fetch(`/api/feedback/${feedback.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: !feedback.approved }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update feedback");
      }

      setFeedbacks((prev) => prev.map((item) => (item.id === feedback.id ? data : item)));
    } catch (error) {
      alert(error.message || "Could not update approval status");
    } finally {
      setTogglingId(null);
    }
  };

  const deleteFeedback = async (id) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete feedback");
      }
      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      alert(error.message || "Could not delete feedback");
    } finally {
      setDeletingId(null);
    }
  };

  const updateProductForFeedback = async (feedbackId, newProductId) => {
    setChangingProductId(feedbackId);
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: newProductId || null }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      setFeedbacks((prev) => prev.map((item) => (item.id === feedbackId ? data : item)));
    } catch (error) {
      alert(error.message || "Could not update product");
    } finally {
      setChangingProductId(null);
    }
  };

  const updateStoryLinkForFeedback = async (feedback, newStoryLink) => {
    const nextLink = (newStoryLink || "").trim() || null;
    if ((feedback.storyLink || null) === nextLink) return;

    try {
      const response = await fetch(`/api/feedback/${feedback.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyLink: nextLink, rating: feedback.rating }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update story link");
      }

      setFeedbacks((prev) => prev.map((item) => (item.id === feedback.id ? data : item)));
    } catch (error) {
      alert(error.message || "Could not update Instagram story link");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-end gap-4 px-5 py-4 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#8B7CD8] hover:bg-[#7A6BC7] rounded-lg shadow-xs transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Feedback
          </button>
        </div>

        {allVisibleFeedbacks.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No feedback yet. Add one to get started.
          </div>
        ) : (
          <div className="grid gap-4 p-5">
            {allVisibleFeedbacks.map((feedback) => (
              <div key={feedback.id} className="rounded-xl border border-gray-200/80 bg-white p-4 hover:border-gray-300 transition">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-semibold text-gray-900">{feedback.clientName}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(feedback.createdAt).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <StatusBadge approved={feedback.approved} />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <RatingStars rating={feedback.rating || 0} />
                      {feedback.rating ? <span className="text-xs text-gray-500">{feedback.rating}/5</span> : null}
                    </div>

                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback.message}</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-xs text-gray-600 font-medium">Product:</label>
                      <select
                        value={feedback.productId || ""}
                        onChange={(event) => updateProductForFeedback(feedback.id, event.target.value || null)}
                        disabled={changingProductId === feedback.id}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition disabled:opacity-50"
                      >
                        <option value="">Not linked</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      {feedback.product && (
                        <Link
                          href={`/admin/products/${feedback.product.id}/edit`}
                          className="text-xs text-[#8B7CD8] hover:underline transition"
                        >
                          view →
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-xs text-gray-600 font-medium">Lien story Instagram:</label>
                      <input
                        type="text"
                        defaultValue={feedback.storyLink || ""}
                        placeholder="https://…"
                        onBlur={(event) => updateStoryLinkForFeedback(feedback, event.target.value)}
                        className="min-w-[220px] flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
                      />
                    </div>

                    {feedback.photos?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {feedback.photos.map((photo) =>
                          feedback.storyLink ? (
                            <a
                              key={photo}
                              href={feedback.storyLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs"
                            >
                              <img src={photo} alt="Feedback preview" className="w-16 h-16 object-cover hover:scale-[1.02] transition" />
                            </a>
                          ) : (
                            <button
                              key={photo}
                              type="button"
                              onClick={() => setExpandedPhoto(photo)}
                              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs"
                            >
                              <img src={photo} alt="Feedback preview" className="w-16 h-16 object-cover hover:scale-[1.02] transition" />
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                    <button
                      type="button"
                      onClick={() => toggleApproval(feedback)}
                      disabled={togglingId === feedback.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        feedback.approved
                          ? "bg-[#8B7CD8]/10 text-[#6555B6] border-[#8B7CD8]/25 hover:bg-[#8B7CD8]/20"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                      } disabled:opacity-60`}
                    >
                      {togglingId === feedback.id ? "Updating…" : feedback.approved ? "Approved" : "Mark Approved"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteFeedback(feedback.id)}
                      disabled={deletingId === feedback.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-60"
                    >
                      {deletingId === feedback.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Feedback</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client name</label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(event) => updateForm("clientName", event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <select
                    value={form.rating}
                    onChange={(event) => updateForm("rating", Number(event.target.value))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>{value} / 5</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Linked product</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search products…"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
                  />
                </div>

                <select
                  value={form.productId}
                  onChange={(event) => updateForm("productId", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
                >
                  <option value="">No product linked</option>
                  {filteredProducts.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(event) => updateForm("message", event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien story Instagram</label>
                <input
                  type="text"
                  value={form.storyLink}
                  onChange={(event) => updateStoryLink(event.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
                <div className="flex flex-wrap items-center gap-2">
                  {form.photos.map((photo) => (
                    <img key={photo} src={photo} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                  ))}
                </div>

                <label className="mt-3 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                  {uploadingPhotos ? "Uploading…" : "Upload photos"}
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.approved}
                  onChange={(event) => updateForm("approved", event.target.checked)}
                  className="rounded border-gray-300 text-[#8B7CD8] focus:ring-[#8B7CD8]"
                />
                Approved immediately
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddFeedback}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#8B7CD8] hover:bg-[#7A6BC7] transition shadow-xs disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

      {expandedPhoto && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setExpandedPhoto(null)}>
          <div className="max-w-3xl w-full rounded-2xl overflow-hidden border border-white/20 bg-white shadow-2xl">
            <img src={expandedPhoto} alt="Expanded feedback photo" className="w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
