"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Link from "next/link";

const STATUS_COLORS = {
  pending: "#9CA3AF",
  confirmed: "#8B7CD8",
  shipped: "#7A6BC7",
  delivered: "#6555B6",
  returned: "#D1D5DB",
  cancelled: "#E5E7EB",
};

const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  returned: "Retournée",
  cancelled: "Annulée",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonth(monthStr) {
  const [year, month] = monthStr.split("-");
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString("fr-DZ", { month: "short", year: "2-digit" });
}

function formatDay(dateStr) {
  const [year, month, day] = dateStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" });
}

function formatWeek(weekStart) {
  return `Sem. du ${formatDay(weekStart)}`;
}

function StatCard({ title, value, icon, trend }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl bg-[#8B7CD8]/10 text-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7CD8] mx-auto"></div>
          <p className="text-gray-500 text-sm mt-4">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700 text-sm">Erreur: {error || "Données non disponibles"}</p>
        </div>
      </div>
    );
  }

  const returnRate = analytics.totalOrders > 0
    ? ((analytics.ordersByStatus.returned || 0) / analytics.totalOrders * 100).toFixed(1)
    : 0;

  const pendingOrders = analytics.ordersByStatus.pending || 0;

  const statusData = Object.entries(analytics.ordersByStatus).map(([status, count]) => ({
    status: STATUS_LABELS[status] || status,
    statusKey: status,
    count,
  }));

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-200/80">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-gray-500 hover:text-[#8B7CD8] transition">
              ← Dashboard
            </Link>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-semibold text-[#6555B6]">Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Aperçu des performances, commandes et revenus.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Commandes totales"
            value={analytics.totalOrders}
            icon="📦"
          />
          <StatCard
            title="Revenu total"
            value={formatCurrency(analytics.totalRevenue)}
            icon="💰"
          />
          <StatCard
            title="Commandes en attente"
            value={pendingOrders}
            icon="⏳"
          />
          <StatCard
            title="Taux de retour"
            value={`${returnRate}%`}
            icon="↩️"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Chart */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
              Répartition des commandes par statut
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                  formatter={(value) => [value, "Commandes"]}
                />
                <Bar dataKey="count" fill="#8B7CD8" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry) => (
                    <Cell
                      key={`cell-${entry.statusKey}`}
                      fill={STATUS_COLORS[entry.statusKey] || "#8B7CD8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
              Revenu des 6 derniers mois
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.revenueByPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  tickFormatter={formatMonth}
                />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                  formatter={(value) => [
                    new Intl.NumberFormat("fr-DZ").format(value),
                    "Revenu (DA)",
                  ]}
                  labelFormatter={(label) => formatMonth(label)}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B7CD8"
                  strokeWidth={2.5}
                  dot={{ fill: "#8B7CD8", r: 4 }}
                  activeDot={{ fill: "#6555B6", r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
              Commandes par jour (30 derniers jours)
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.ordersPerDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickFormatter={formatDay} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                  labelFormatter={(label) => formatDay(label)}
                  formatter={(value) => [value, "Commandes"]}
                />
                <Bar dataKey="count" fill="#8B7CD8" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
              Retours par jour (30 derniers jours)
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.returnsPerDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickFormatter={formatDay} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                  labelFormatter={(label) => formatDay(label)}
                  formatter={(value) => [value, "Retours"]}
                />
                <Bar dataKey="count" fill="#A599E2" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
            Revenu par semaine (8 dernières semaines)
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.revenuePerWeek || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={formatWeek} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
                labelFormatter={(label) => formatWeek(label)}
                formatter={(value) => [
                  new Intl.NumberFormat("fr-DZ").format(value),
                  "Revenu (DA)",
                ]}
              />
              <Bar dataKey="revenue" fill="#8B7CD8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best Selling Products Table */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
            Meilleurs produits vendus
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] uppercase font-semibold text-gray-500">
                  <th className="text-left px-4 py-3">
                    Produit
                  </th>
                  <th className="text-right px-4 py-3">
                    Quantité
                  </th>
                  <th className="text-right px-4 py-3">
                    Revenu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.bestSellingProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-400">
                      Aucune donnée disponible
                    </td>
                  </tr>
                ) : (
                  analytics.bestSellingProducts.map((product, index) => (
                    <tr key={product.productId} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/products/${product.productId}/edit`}
                          className="text-[#8B7CD8] hover:text-[#7A6BC7] font-medium"
                        >
                          {index + 1}. {product.productName}
                        </Link>
                      </td>
                      <td className="text-right px-4 py-3 font-medium text-gray-900">
                        {product.quantity}
                      </td>
                      <td className="text-right px-4 py-3 font-semibold text-[#6555B6] font-mono">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Selling Variants Table */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
            Meilleures variantes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] uppercase font-semibold text-gray-500">
                  <th className="text-left px-4 py-3">
                    Produit
                  </th>
                  <th className="text-left px-4 py-3">
                    Taille
                  </th>
                  <th className="text-left px-4 py-3">
                    Couleur
                  </th>
                  <th className="text-right px-4 py-3">
                    Quantité
                  </th>
                  <th className="text-right px-4 py-3">
                    Revenu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.bestSellingVariants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      Aucune donnée disponible
                    </td>
                  </tr>
                ) : (
                  analytics.bestSellingVariants.map((variant, index) => (
                    <tr key={variant.variantId} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {index + 1}. {variant.productName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] rounded font-medium">
                          {variant.size}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-gray-200"
                            style={{ backgroundColor: variant.colorName }}
                            title={variant.colorName}
                          />
                          <span className="text-gray-600 text-xs">
                            {variant.colorName}
                          </span>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3 font-medium text-gray-900">
                        {variant.quantity}
                      </td>
                      <td className="text-right px-4 py-3 font-semibold text-[#6555B6] font-mono">
                        {formatCurrency(variant.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Searched Table */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
            Recherches les plus fréquentes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] uppercase font-semibold text-gray-500">
                  <th className="text-left px-4 py-3">
                    Requête
                  </th>
                  <th className="text-right px-4 py-3">
                    Occurrences
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(analytics.mostSearched || []).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center py-8 text-gray-400">
                      Aucune recherche enregistrée pour le moment
                    </td>
                  </tr>
                ) : (
                  analytics.mostSearched.map((item, index) => (
                    <tr key={`${item.query}-${index}`} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {index + 1}. {item.query}
                      </td>
                      <td className="text-right px-4 py-3 font-medium text-gray-900 font-mono">
                        {item.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
