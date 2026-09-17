"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setMessage({ type: "success", text: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-start justify-center py-14 px-4">
      <div className="w-full max-w-md">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Paramètres</h1>
          <p className="text-xs text-gray-500 mt-1">Modifiez le mot de passe de votre compte admin</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 sm:p-7">
          <div className="border-b border-gray-100 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#8B7CD8]/15 text-[#6555B6] text-xs font-bold flex items-center justify-center">🔒</span>
              <h2 className="text-base font-semibold text-gray-900">Changer le mot de passe</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
              />
            </div>

            {message && (
              <div className={`text-sm px-3.5 py-2.5 rounded-lg border ${
                message.type === "error"
                  ? "bg-red-50 text-red-700 border-red-200/80"
                  : "bg-[#8B7CD8]/8 text-[#4E409D] border-[#8B7CD8]/25"
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#8B7CD8] hover:bg-[#7A6BC7] active:bg-[#6555B6] transition disabled:opacity-60 shadow-xs mt-1"
            >
              {saving ? "Enregistrement…" : "Mettre à jour le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
