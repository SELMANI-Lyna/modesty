"use client";

import { useEffect, useMemo, useState } from "react";
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

  const maxStock = selectedVariant ? selectedVariant.quantity : 1;

  useEffect(() => {
    setForm((prev) => {
      const currentQty = parseInt(prev.quantity, 10) || 1;
      const max = selectedVariant ? selectedVariant.quantity : 1;
      if (currentQty > max) {
        return { ...prev, quantity: 1 };
      }
      return prev;
    });
  }, [selectedVariant]);

  const communes = useMemo(() => {
    const w = wilayas.find((item) => item.name === form.wilaya);
    return w?.communes || [];
  }, [wilayas, form.wilaya]);

  const unitPrice = selectedVariant ? getProductUnitPrice(product, selectedVariant) : getProductUnitPrice(product);
  const deliveryFee = form.wilaya ? getDeliveryFee(form.wilaya, form.deliveryType) : 0;
  const qty = Math.max(1, parseInt(form.quantity, 10) || 1);
  const total = unitPrice * qty + deliveryFee;

  const isStockExceeded = selectedVariant ? qty > selectedVariant.quantity : false;
  const isOutOfStock = !selectedVariant || selectedVariant.quantity < 1;
  const isSubmitDisabled = saving || isOutOfStock || isStockExceeded;

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
    if (!selectedVariant || selectedVariant.quantity < 1 || qty > selectedVariant.quantity) {
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

      <div>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-600">{tp("quantity")}</span>
          <div className="flex items-center rounded-xl border border-neutral-200 bg-white w-fit overflow-hidden">
            <button
              type="button"
              onClick={() => {
                const current = parseInt(form.quantity, 10) || 1;
                if (current > 1) update("quantity", current - 1);
              }}
              disabled={qty <= 1 || !selectedVariant}
              className="flex h-10 w-10 items-center justify-center text-lg font-medium text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={maxStock}
              value={form.quantity}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  update("quantity", "");
                  return;
                }
                const parsed = parseInt(val, 10);
                if (isNaN(parsed)) return;
                if (parsed > maxStock) {
                  update("quantity", maxStock);
                } else if (parsed < 1) {
                  update("quantity", 1);
                } else {
                  update("quantity", parsed);
                }
              }}
              onBlur={() => {
                if (form.quantity === "" || parseInt(form.quantity, 10) < 1) {
                  update("quantity", 1);
                } else if (parseInt(form.quantity, 10) > maxStock) {
                  update("quantity", maxStock);
                }
              }}
              className="h-10 w-12 text-center text-sm font-medium text-neutral-900 border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => {
                const current = parseInt(form.quantity, 10) || 1;
                if (current < maxStock) update("quantity", current + 1);
              }}
              disabled={qty >= maxStock || !selectedVariant}
              className="flex h-10 w-10 items-center justify-center text-lg font-medium text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </label>
        {selectedVariant && selectedVariant.quantity > 0 && selectedVariant.quantity <= 5 && (
          <p className="mt-1.5 text-xs font-medium text-amber-600">
            {tp("lowStock", { quantity: selectedVariant.quantity })}
          </p>
        )}
      </div>

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
        disabled={isSubmitDisabled}
        className="w-full rounded-full bg-black py-3 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? tp("ordering") : tp("order")}
      </button>
    </form>
  );
}
