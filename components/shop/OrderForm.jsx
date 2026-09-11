"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getWilayas, getDeliveryFee } from "@/lib/delivery";
import { formatPrice, getProductUnitPrice } from "@/lib/pricing";

export default function OrderForm({ product, selectedVariant }) {
  const t = useTranslations("order");
  const tp = useTranslations("product");
  const locale = useLocale();
  const wilayas = useMemo(() => getWilayas(), []);

  const [form, setForm] = useState({
    clientName: "",
    phone: "",
    wilaya: "",
    commune: "",
    deliveryType: "home",
    quantity: 1,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const communes = useMemo(() => {
    const w = wilayas.find((item) => item.name === form.wilaya);
    return w?.communes || [];
  }, [wilayas, form.wilaya]);

  const unitPrice = selectedVariant ? getProductUnitPrice(product, selectedVariant) : getProductUnitPrice(product);
  const deliveryFee = form.wilaya ? getDeliveryFee(form.wilaya, form.deliveryType) : 0;
  const qty = Math.max(1, parseInt(form.quantity, 10) || 1);
  const total = unitPrice * qty + deliveryFee;

  const update = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "wilaya") next.commune = "";
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!selectedVariant || selectedVariant.quantity < 1) {
      setError(tp("selectVariant"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: qty,
          variantId: selectedVariant.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setSuccess(true);
      setForm((prev) => ({ ...prev, quantity: 1 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900">{t("title")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">{t("fullName")}</span>
          <input
            required
            value={form.clientName}
            onChange={(e) => update("clientName", e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">{t("phone")}</span>
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">{t("wilaya")}</span>
          <select
            required
            value={form.wilaya}
            onChange={(e) => update("wilaya", e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 bg-white"
          >
            <option value="">{t("chooseWilaya")}</option>
            {wilayas.map((w) => (
              <option key={w.code} value={w.name}>
                {locale === "ar" ? w.nameAr : w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">{t("commune")}</span>
          <select
            required
            disabled={!form.wilaya}
            value={form.commune}
            onChange={(e) => update("commune", e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 bg-white disabled:bg-neutral-50"
          >
            <option value="">{t("chooseCommune")}</option>
            {communes.map((c) => (
              <option key={c.name} value={c.name}>
                {locale === "ar" ? c.nameAr : c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="text-sm">
        <legend className="mb-2 text-neutral-600">{t("delivery")}</legend>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="deliveryType"
              checked={form.deliveryType === "home"}
              onChange={() => update("deliveryType", "home")}
            />
            {t("home")}
            {form.wilaya ? ` — ${formatPrice(getDeliveryFee(form.wilaya, "home"))}` : ""}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="deliveryType"
              checked={form.deliveryType === "agency"}
              onChange={() => update("deliveryType", "agency")}
            />
            {t("agency")}
            {form.wilaya ? ` — ${formatPrice(getDeliveryFee(form.wilaya, "agency"))}` : ""}
          </label>
        </div>
      </fieldset>

      <label className="block text-sm max-w-32">
        <span className="mb-1 block text-neutral-600">{tp("quantity")}</span>
        <input
          type="number"
          min="1"
          max={selectedVariant?.quantity || 1}
          value={form.quantity}
          onChange={(e) => update("quantity", e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2.5"
        />
      </label>

      <div className="space-y-1 border-t border-neutral-100 pt-4 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>{t("subtotal")}</span>
          <span>{formatPrice(unitPrice * qty)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>{t("deliveryFee")}</span>
          <span>{form.wilaya ? formatPrice(deliveryFee) : "—"}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-neutral-900">
          <span>{t("total")}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{tp("orderSuccess")}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-black py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? tp("ordering") : tp("order")}
      </button>
    </form>
  );
}
