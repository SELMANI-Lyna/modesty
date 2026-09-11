"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
    dotClass: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-300",
    dotClass: "bg-blue-500",
  },
  shipped: {
    label: "Shipped",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-300",
    dotClass: "bg-indigo-500",
  },
  delivered: {
    label: "Delivered",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dotClass: "bg-emerald-500",
  },
  returned: {
    label: "Returned",
    badgeClass: "bg-orange-50 text-orange-800 border-orange-300",
    dotClass: "bg-orange-500",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-red-50 text-red-800 border-red-300",
    dotClass: "bg-red-500",
  },
};

const ALL_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
];

function formatPrice(amount) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + " DA";
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function OrderDetailClient({ initialOrder }) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  const handleStatusChange = async (newStatus) => {
    if (order.status === newStatus || updating) return;
    const oldStatus = order.status;

    setOrder((prev) => ({ ...prev, status: newStatus }));
    setUpdating(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setMessage({ text: `Status successfully updated to "${newStatus}"`, type: "success" });
      router.refresh();
    } catch (err) {
      console.error(err);
      setOrder((prev) => ({ ...prev, status: oldStatus }));
      setMessage({ text: err.message || "Failed to update status", type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between shadow-xs ${
            message.type === "error"
              ? "bg-red-50 text-red-800 border-red-200"
              : "bg-green-50 text-green-800 border-green-200"
          }`}
        >
          <span>{message.type === "error" ? "⚠️" : "✓"} {message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold px-2">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin/orders"
              className="text-xs text-gray-500 hover:text-gray-900 transition flex items-center gap-1 font-medium"
            >
              <span>← Back to all orders</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
              {statusInfo.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Placed on {formatDate(order.createdAt)} • ID: <span className="font-mono text-gray-700">{order.id}</span>
          </p>
        </div>

        {/* Status quick changer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <label className="text-[10px] uppercase font-semibold text-gray-500 block mb-1">
              Change Order Status
            </label>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
              className={`text-xs font-semibold py-2 pl-3 pr-8 rounded-lg border focus:outline-none focus:ring-2 cursor-pointer transition ${statusInfo.badgeClass} ${
                updating ? "opacity-50 cursor-wait" : ""
              }`}
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st} className="text-gray-900 bg-white font-normal">
                  {STATUS_CONFIG[st].label}
                </option>
              ))}
            </select>
          </div>

          {/* PLACEHOLDER: Create shipment button (Requirement #5) */}
          <div className="sm:self-end">
            <button
              type="button"
              disabled
              title="Courier API integration coming soon (dzship/Ecotrack)"
              className="py-2 px-4 rounded-lg text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed flex items-center gap-1.5"
            >
              <span>🚚 Create Shipment</span>
              <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.2 rounded">
                Coming soon
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ordered Items Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Order Items ({order.items?.length || 0})
              </h2>
              <span className="text-xs text-gray-500">
                Unit prices recorded at checkout
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {(order.items || []).map((item) => {
                const variant = item.variant;
                const product = variant?.product;
                const imageSrc =
                  variant?.image ||
                  (product?.images && product.images[0]) ||
                  null;
                const itemSubtotal = (item.priceAtOrder || 0) * (item.quantity || 1);

                return (
                  <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-gray-50/50 transition">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageSrc}
                          alt={product?.name || "Product"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {product?.name || "Product"}
                          </h3>
                          {product?.category && (
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                              Category: {product.category}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900 font-mono">
                            {formatPrice(itemSubtotal)}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {formatPrice(item.priceAtOrder)} × {item.quantity}
                          </div>
                        </div>
                      </div>

                      {/* Variant Specs */}
                      {variant && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 font-semibold text-gray-800 text-[11px]">
                            Size: {variant.size}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px]">
                            <span
                              className="w-3 h-3 rounded-full border border-gray-300 shrink-0"
                              style={{ backgroundColor: variant.colorHex || "#ccc" }}
                            />
                            <span>Color: {variant.colorName}</span>
                          </span>
                          {variant.sku && (
                            <span className="text-gray-400 font-mono text-[11px]">
                              SKU: {variant.sku}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Footer */}
            <div className="bg-gray-50/80 p-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Order Amount</span>
              <span className="text-lg font-bold text-gray-900 font-mono">
                {formatPrice(order.totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Client & Delivery Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Customer Information
            </h2>

            <div>
              <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                Full Name
              </span>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">
                {order.clientName}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                Phone Number
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <a
                  href={`tel:${order.phone}`}
                  className="font-mono text-sm text-blue-600 hover:underline font-semibold"
                >
                  {order.phone}
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">
                Destination Address
              </span>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Wilaya:</span>
                  <span className="font-semibold text-gray-900">{order.wilaya}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Commune:</span>
                  <span className="font-semibold text-gray-900">{order.commune}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">
                Delivery Preference
              </span>
              {order.deliveryType === "home" ? (
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs">
                  <div className="font-semibold text-purple-900 flex items-center gap-1.5">
                    <span>🏠 Home Delivery</span>
                  </div>
                  <p className="text-purple-700 text-[11px] mt-0.5">
                    Delivered directly to the customer&apos;s doorstep.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <span>🏢 Stop Desk / Agency Pickup</span>
                  </div>
                  <p className="text-amber-700 text-[11px] mt-0.5">
                    Customer collects parcel from the courier branch office.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
