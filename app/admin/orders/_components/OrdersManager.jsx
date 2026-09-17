"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const STATUS_CONFIG = {
  pending: {
    label: "En attente",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200 ring-gray-400/10",
    dotClass: "bg-gray-400",
    description: "Nouvelle commande en attente de confirmation",
  },
  confirmed: {
    label: "Confirmée",
    badgeClass: "bg-[#8B7CD8]/10 text-[#5B4CAE] border-[#8B7CD8]/30 ring-[#8B7CD8]/15",
    dotClass: "bg-[#8B7CD8]",
    description: "Confirmée avec le client",
  },
  shipped: {
    label: "Expédiée",
    badgeClass: "bg-[#8B7CD8]/20 text-[#4E409D] border-[#8B7CD8]/40 ring-[#8B7CD8]/20",
    dotClass: "bg-[#8B7CD8]",
    description: "En cours d'acheminement",
  },
  delivered: {
    label: "Livrée",
    badgeClass: "bg-[#8B7CD8]/15 text-[#4E409D] border-[#8B7CD8]/30 ring-[#8B7CD8]/15",
    dotClass: "bg-[#8B7CD8]",
    description: "Colis livré et payé",
  },
  returned: {
    label: "Retournée",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200 ring-gray-300/10",
    dotClass: "bg-gray-400",
    description: "Colis retourné par le client / livreur",
  },
  cancelled: {
    label: "Annulée",
    badgeClass: "bg-gray-100 text-gray-500 border-gray-200 ring-gray-300/10",
    dotClass: "bg-gray-300",
    description: "Commande annulée",
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
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function OrdersManager({ initialOrders = [] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Status update handler (Optimistic UI + API call)
  // ARCHITECTURE RULE: Does NOT touch Variant.quantity (stock managed manually on product page)
  const handleStatusChange = async (orderId, newStatus) => {
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return;

    const previousStatus = orders[orderIndex].status;
    if (previousStatus === newStatus) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    setUpdatingId(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      showToast(`Order #${orderId.slice(-6)} updated to "${newStatus}"`, "success");
    } catch (err) {
      console.error("Status update error:", err);
      // Revert optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: previousStatus } : o))
      );
      showToast(err.message || "Failed to update order status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    ALL_STATUSES.forEach((s) => (counts[s] = 0));
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      // Delivery filter
      if (deliveryFilter !== "all" && order.deliveryType !== deliveryFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesClient = order.clientName?.toLowerCase().includes(q);
        const matchesPhone = order.phone?.toLowerCase().includes(q);
        const matchesWilaya = order.wilaya?.toLowerCase().includes(q);
        const matchesCommune = order.commune?.toLowerCase().includes(q);
        const matchesId = order.id?.toLowerCase().includes(q);
        return matchesClient || matchesPhone || matchesWilaya || matchesCommune || matchesId;
      }
      return true;
    });
  }, [orders, statusFilter, deliveryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all transform duration-300 flex items-center gap-2 ${
            toastMessage.type === "error"
              ? "bg-red-50 text-red-800 border-red-200"
              : "bg-gray-900 text-white border-gray-800"
          }`}
        >
          {toastMessage.type === "error" ? "⚠️" : "✓"} {toastMessage.message}
        </div>
      )}

      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Total Commandes</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">En attente</span>
          <div className="text-2xl font-bold text-gray-800 mt-1">{statusCounts.pending || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Confirmées</span>
          <div className="text-2xl font-bold text-[#6555B6] mt-1">{statusCounts.confirmed || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Livrées</span>
          <div className="text-2xl font-bold text-[#6555B6] mt-1">{statusCounts.delivered || 0}</div>
        </div>
      </div>

      {/* Navigation Tabs by Status & Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-[#8B7CD8] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100/80 bg-gray-50/70"
            }`}
          >
            Toutes les commandes
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                statusFilter === "all" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {statusCounts.all}
            </span>
          </button>

          {ALL_STATUSES.map((statusKey) => {
            const config = STATUS_CONFIG[statusKey];
            const count = statusCounts[statusKey] || 0;
            const isActive = statusFilter === statusKey;
            return (
              <button
                key={statusKey}
                type="button"
                onClick={() => setStatusFilter(statusKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-[#8B7CD8] text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100/80 bg-gray-50/70"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : config.dotClass}`}
                />
                {config.label}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and Secondary Filters Bar */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-gray-100">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par client, tél, wilaya, N°..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] bg-white text-gray-900 placeholder-gray-400 transition"
            />
            <svg
              className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">
              Livraison :
            </label>
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
            >
              <option value="all">Tous les modes</option>
              <option value="home">À domicile</option>
              <option value="agency">En agence</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-3 text-lg">
              📦
            </div>
            <h3 className="text-base font-semibold text-gray-900">Aucune commande trouvée</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all" || deliveryFilter !== "all"
                ? "Essayez de réinitialiser vos filtres ou termes de recherche."
                : "Aucune commande client reçue pour le moment."}
            </p>
            {(searchQuery || statusFilter !== "all" || deliveryFilter !== "all") && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setDeliveryFilter("all");
                  setSearchQuery("");
                }}
                className="mt-4 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-4">Order & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Delivery</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  const isUpdating = updatingId === order.id;
                  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const totalItemsCount = (order.items || []).reduce(
                    (acc, item) => acc + (item.quantity || 1),
                    0
                  );

                  return (
                    <tr
                      key={order.id}
                      className={`group transition-colors ${
                        isExpanded ? "bg-gray-50/60" : "hover:bg-gray-50/40"
                      }`}
                    >
                      {/* Sub-row rendering logic */}
                      <td colSpan={9} className="p-0">
                        {/* Main row */}
                        <div className="flex items-center py-3.5 px-4">
                          {/* Expand chevron */}
                          <button
                            type="button"
                            onClick={() => toggleExpand(order.id)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200/70 text-gray-400 hover:text-gray-700 transition mr-2"
                            aria-label={isExpanded ? "Collapse order" : "Expand order"}
                          >
                            <svg
                              className={`w-4 h-4 transform transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>

                          {/* Order ID & Date */}
                          <div className="w-36 pr-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold text-gray-900">
                                #{order.id.slice(-6).toUpperCase()}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(order.id, order.id)}
                                title="Copy full Order ID"
                                className="text-gray-400 hover:text-gray-600 text-[10px]"
                              >
                                {copyFeedback === order.id ? "✓" : "📋"}
                              </button>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {formatDate(order.createdAt)}
                            </div>
                          </div>

                          {/* Client Name & Phone */}
                          <div className="w-48 pr-3">
                            <div className="font-medium text-gray-900 truncate">
                              {order.clientName}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <a
                                href={`tel:${order.phone}`}
                                className="text-[11px] text-[#8B7CD8] hover:underline font-mono"
                              >
                                {order.phone}
                              </a>
                            </div>
                          </div>

                          {/* Destination (Wilaya + Commune) */}
                          <div className="w-44 pr-3">
                            <div className="font-medium text-gray-800 truncate">
                              {order.wilaya}
                            </div>
                            <div className="text-[11px] text-gray-500 truncate">
                              {order.commune}
                            </div>
                          </div>

                          {/* Delivery Type Badge */}
                          <div className="w-28 pr-3">
                            {order.deliveryType === "home" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#8B7CD8]/10 text-[#6555B6] border border-[#8B7CD8]/25">
                                🏠 Home
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                🏢 Agency
                              </span>
                            )}
                          </div>

                          {/* Items preview */}
                          <div className="w-24 pr-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                              {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
                            </span>
                          </div>

                          {/* Total Price */}
                          <div className="w-32 pr-3">
                            <div className="font-bold text-gray-900 text-sm">
                              {formatPrice(order.totalPrice)}
                            </div>
                          </div>

                          {/* Status selector */}
                          <div className="w-40 pr-3">
                            <div className="relative inline-block w-full">
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                disabled={isUpdating}
                                className={`w-full text-xs font-semibold py-1.5 pl-2.5 pr-6 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/30 appearance-none cursor-pointer transition ${statusInfo.badgeClass} ${
                                  isUpdating ? "opacity-50 cursor-wait" : ""
                                }`}
                              >
                                {ALL_STATUSES.map((statusVal) => (
                                  <option key={statusVal} value={statusVal} className="text-gray-900 bg-white font-normal">
                                    {STATUS_CONFIG[statusVal].label}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Actions: Shipment Placeholder & Detail link */}
                          <div className="flex-1 flex items-center justify-end gap-2">
                            {/* PLACEHOLDER: Create shipment button (Requirement #5) */}
                            <button
                              type="button"
                              disabled
                              title="Courier API integration coming soon (dzship/Ecotrack)"
                              className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed flex items-center gap-1"
                            >
                              <span>🚚</span>
                              <span>Shipment</span>
                            </button>

                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="p-1.5 text-gray-400 hover:text-gray-900 rounded hover:bg-gray-100 transition"
                              title="Open dedicated order page"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </Link>
                          </div>
                        </div>

                        {/* Inline Expandable Order Detail (Requirement #2) */}
                        {isExpanded && (
                          <div className="bg-gray-50/50 border-t border-b border-gray-200/80 p-5 pl-14 transition-all">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Left 2 Cols: Order Items list */}
                              <div className="lg:col-span-2 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                    Ordered Items ({order.items?.length || 0})
                                  </h4>
                                  <span className="text-[11px] text-gray-500">
                                    Prices locked at order time
                                  </span>
                                </div>

                                <div className="bg-white rounded-lg border border-gray-200/80 overflow-hidden shadow-xs">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-semibold text-gray-500 uppercase">
                                        <th className="py-2.5 px-3">Product</th>
                                        <th className="py-2.5 px-3">Variant (Size / Color)</th>
                                        <th className="py-2.5 px-3 text-center">Qty</th>
                                        <th className="py-2.5 px-3 text-right">Price</th>
                                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {(order.items || []).map((item) => {
                                        const variant = item.variant;
                                        const product = variant?.product;
                                        const imageSrc =
                                          variant?.image ||
                                          (product?.images && product.images[0]) ||
                                          null;
                                        const itemSubtotal = (item.priceAtOrder || 0) * (item.quantity || 1);

                                        return (
                                          <tr key={item.id} className="hover:bg-gray-50/50">
                                            {/* Product Image & Name */}
                                            <td className="py-3 px-3">
                                              <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                                                  {imageSrc ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                      src={imageSrc}
                                                      alt={product?.name || "Product"}
                                                      className="w-full h-full object-cover"
                                                    />
                                                  ) : (
                                                    <span className="text-gray-400 text-xs">No img</span>
                                                  )}
                                                </div>
                                                <div>
                                                  <div className="font-semibold text-gray-900">
                                                    {product?.name || "Product"}
                                                  </div>
                                                  {product?.category && (
                                                    <div className="text-[10px] text-gray-400 uppercase">
                                                      {product.category}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </td>

                                            {/* Variant Specs */}
                                            <td className="py-3 px-3">
                                              {variant ? (
                                                <div className="space-y-1">
                                                  <div className="flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 rounded bg-gray-100 font-semibold text-gray-800 text-[11px]">
                                                      {variant.size}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px]">
                                                      <span
                                                        className="w-2.5 h-2.5 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: variant.colorHex || "#ccc" }}
                                                      />
                                                      {variant.colorName}
                                                    </span>
                                                  </div>
                                                  {variant.sku && (
                                                    <div className="text-[10px] font-mono text-gray-400">
                                                      SKU: {variant.sku}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-gray-400 text-xs italic">Variant removed</span>
                                              )}
                                            </td>

                                            {/* Quantity */}
                                            <td className="py-3 px-3 text-center font-semibold text-gray-900">
                                              ×{item.quantity}
                                            </td>

                                            {/* Price at order */}
                                            <td className="py-3 px-3 text-right font-mono text-gray-700">
                                              {formatPrice(item.priceAtOrder)}
                                            </td>

                                            {/* Line Subtotal */}
                                            <td className="py-3 px-3 text-right font-bold font-mono text-gray-900">
                                              {formatPrice(itemSubtotal)}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                    <tfoot>
                                      <tr className="bg-gray-50/80 font-bold border-t border-gray-200">
                                        <td colSpan={4} className="py-2.5 px-3 text-right text-gray-700">
                                          Order Total:
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono text-base text-gray-900">
                                          {formatPrice(order.totalPrice)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>

                              {/* Right Col: Delivery & Customer Full Details */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                  Delivery & Customer Details
                                </h4>

                                <div className="bg-white rounded-lg border border-gray-200/80 p-4 space-y-3 shadow-xs text-xs">
                                  <div>
                                    <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                                      Customer Name
                                    </span>
                                    <div className="font-semibold text-gray-900 text-sm mt-0.5">
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
                                        className="font-mono text-[#8B7CD8] hover:underline font-medium"
                                      >
                                        {order.phone}
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(order.phone, "phone")}
                                        className="text-gray-400 hover:text-gray-600 text-[10px]"
                                      >
                                        {copyFeedback === "phone" ? "✓ Copied" : "Copy"}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                    <div>
                                      <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                                        Wilaya
                                      </span>
                                      <span className="font-medium text-gray-800">{order.wilaya}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                                        Commune
                                      </span>
                                      <span className="font-medium text-gray-800">{order.commune}</span>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-gray-100">
                                    <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                                      Delivery Type
                                    </span>
                                    <div className="mt-1">
                                      {order.deliveryType === "home" ? (
                                        <div className="text-[#6555B6] bg-[#8B7CD8]/10 px-2.5 py-1.5 rounded border border-[#8B7CD8]/25 font-medium">
                                          🏠 Home Delivery (Livraison à domicile)
                                        </div>
                                      ) : (
                                        <div className="text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200 font-medium">
                                          🏢 Stop Desk / Agency Pickup (Bureau)
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick status updater in details panel */}
                                  <div className="pt-3 border-t border-gray-100">
                                    <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-1.5">
                                      Change Order Status
                                    </span>
                                    <div className="grid grid-cols-3 gap-1.5">
                                      {ALL_STATUSES.map((st) => (
                                        <button
                                          key={st}
                                          type="button"
                                          onClick={() => handleStatusChange(order.id, st)}
                                          disabled={order.status === st || isUpdating}
                                          className={`py-1 px-1.5 rounded text-[10px] font-medium border text-center transition ${
                                            order.status === st
                                              ? "bg-[#8B7CD8] text-white border-[#8B7CD8] shadow-xs"
                                              : "bg-gray-50 text-gray-700 hover:bg-[#8B7CD8]/10 hover:text-[#6555B6] border-gray-200"
                                          }`}
                                        >
                                          {STATUS_CONFIG[st].label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Placeholder Courier button */}
                                  <div className="pt-2">
                                    {/* TODO: Connect to courier API (dzship / Ecotrack) when credentials are provided */}
                                    <button
                                      type="button"
                                      disabled
                                      className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed text-center flex items-center justify-center gap-1.5"
                                    >
                                      <span>🚚 Create Shipment with Courier</span>
                                      <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.2 rounded">
                                        Coming soon
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
