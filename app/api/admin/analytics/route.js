import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// Helper: Get date range for last N months
function getLastNMonthsRange(n) {
  const now = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - (n - 1));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate: now };
}

// Helper: Format dates for grouping
function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Helper: Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfWeekMonday(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function buildDaySeries(days, countsByKey) {
  const series = [];
  const cursor = startOfDay(new Date());
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = dateKey(cursor);
    series.push({ date: key, count: countsByKey.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return series;
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Total Orders
    const totalOrders = await prisma.order.count();

    // 2. Total Revenue (excluding cancelled)
    const revenueData = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { status: { not: "cancelled" } },
    });
    const totalRevenue = revenueData._sum.totalPrice || 0;

    // 3. Orders by Status
    const ordersByStatusRaw = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
    });
    const ordersByStatus = ordersByStatusRaw.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {}
    );

    // 4. Best Selling Products (top 10)
    const bestSellingProductsRaw = await prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      where: {
        order: { status: { not: "cancelled" } },
      },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    // Fetch variant and product details
    const bestSellingProducts = [];
    for (const item of bestSellingProductsRaw) {
      const variant = await prisma.variant.findUnique({
        where: { id: item.variantId },
        include: {
          product: {
            select: { id: true, name: true, price: true },
          },
        },
      });

      if (variant && variant.product) {
        // Calculate revenue for this product from this variant
        const revenue = await prisma.orderItem.aggregate({
          _sum: { quantity: true },
          where: {
            variantId: item.variantId,
            order: { status: { not: "cancelled" } },
          },
        });

        const quantity = item._sum.quantity || 0;
        const variantRevenue = quantity * (variant.price || variant.product.price || 0);

        bestSellingProducts.push({
          productId: variant.product.id,
          productName: variant.product.name,
          quantity,
          revenue: variantRevenue,
        });
      }
    }

    // Group by product and sum quantities/revenue
    const productMap = new Map();
    for (const item of bestSellingProducts) {
      const key = item.productId;
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          revenue: 0,
        });
      }
      const existing = productMap.get(key);
      existing.quantity += item.quantity;
      existing.revenue += item.revenue;
    }

    const bestSellingProductsList = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 5. Best Selling Variants (top 10)
    const bestSellingVariantsRaw = await prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      where: {
        order: { status: { not: "cancelled" } },
      },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    const bestSellingVariants = [];
    for (const item of bestSellingVariantsRaw) {
      const variant = await prisma.variant.findUnique({
        where: { id: item.variantId },
        include: {
          product: {
            select: { id: true, name: true, price: true },
          },
        },
      });

      if (variant && variant.product) {
        const quantity = item._sum.quantity || 0;
        const revenue = quantity * (variant.price || variant.product.price || 0);

        bestSellingVariants.push({
          variantId: variant.id,
          productName: variant.product.name,
          size: variant.size,
          colorName: variant.colorName,
          quantity,
          revenue,
        });
      }
    }

    // 6. Revenue by Period (last 6 months)
    const { startDate } = getLastNMonthsRange(6);
    const ordersInPeriod = await prisma.order.findMany({
      where: {
        status: { not: "cancelled" },
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, totalPrice: true },
    });

    const revenueByPeriod = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      d.setDate(1);
      const key = getMonthKey(d);
      revenueByPeriod[key] = 0;
    }

    for (const order of ordersInPeriod) {
      const key = getMonthKey(order.createdAt);
      if (key in revenueByPeriod) {
        revenueByPeriod[key] += order.totalPrice || 0;
      }
    }

    // Convert to array format for charts
    const revenueByPeriodArray = Object.entries(revenueByPeriod).map(
      ([month, revenue]) => ({
        month,
        revenue: Math.round(revenue),
      })
    );

    const now = new Date();
    const start30Days = startOfDay(now);
    start30Days.setDate(start30Days.getDate() - 29);
    const thisWeekStart = startOfWeekMonday(now);
    const start8Weeks = new Date(thisWeekStart);
    start8Weeks.setDate(start8Weeks.getDate() - 7 * 7);

    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: start8Weeks } },
      select: { createdAt: true, status: true, totalPrice: true },
    });

    const ordersPerDayCounts = new Map();
    const returnsPerDayCounts = new Map();
    for (const order of recentOrders) {
      if (order.createdAt < start30Days) continue;
      const key = dateKey(order.createdAt);
      ordersPerDayCounts.set(key, (ordersPerDayCounts.get(key) || 0) + 1);
      if (order.status === "returned") {
        returnsPerDayCounts.set(key, (returnsPerDayCounts.get(key) || 0) + 1);
      }
    }

    const ordersPerDay = buildDaySeries(30, ordersPerDayCounts);
    const returnsPerDay = buildDaySeries(30, returnsPerDayCounts);

    const revenuePerWeekMap = new Map();
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(start8Weeks);
      weekStart.setDate(weekStart.getDate() + i * 7);
      revenuePerWeekMap.set(dateKey(weekStart), 0);
    }
    for (const order of recentOrders) {
      if (order.status === "cancelled") continue;
      const weekKey = dateKey(startOfWeekMonday(order.createdAt));
      if (revenuePerWeekMap.has(weekKey)) {
        revenuePerWeekMap.set(weekKey, revenuePerWeekMap.get(weekKey) + (order.totalPrice || 0));
      }
    }
    const revenuePerWeek = Array.from(revenuePerWeekMap.entries()).map(([week, revenue]) => ({
      week,
      revenue: Math.round(revenue),
    }));

    let mostSearched = [];
    try {
      const searchGrouped = await prisma.searchLog.groupBy({
        by: ["query"],
        _count: { query: true },
        orderBy: { _count: { query: "desc" } },
        take: 10,
      });
      mostSearched = searchGrouped.map((item) => ({
        query: item.query,
        count: item._count.query,
      }));
    } catch {
      mostSearched = [];
    }

    return NextResponse.json(
      {
        totalOrders,
        totalRevenue: Math.round(totalRevenue),
        ordersByStatus,
        bestSellingProducts: bestSellingProductsList,
        bestSellingVariants,
        revenueByPeriod: revenueByPeriodArray,
        ordersPerDay,
        returnsPerDay,
        revenuePerWeek,
        mostSearched,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/admin/analytics] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
