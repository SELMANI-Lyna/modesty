import prisma from "@/app/lib/prisma";

const variantSelect = {
  id: true,
  size: true,
  colorName: true,
  colorHex: true,
  image: true,
  price: true,
  reducedPrice: true,
  quantity: true,
  isActive: true,
};

const productInclude = {
  colors: { select: { id: true, name: true, hex: true } },
  variants: { select: variantSelect },
};

export async function getProductsSortedByOrders({ category, take } = {}) {
  await prisma.$connect();
  const where = {};
  if (category) where.category = category;

  const products = await prisma.product.findMany({
    where,
    include: {
      colors: productInclude.colors,
      variants: {
        select: {
          ...variantSelect,
          orderItems: {
            where: { order: { status: { not: "cancelled" } } },
            select: { quantity: true },
          },
        },
      },
    },
  });

  const ranked = products
    .map((product) => {
      const sold = product.variants.reduce(
        (sum, variant) =>
          sum + variant.orderItems.reduce((s, item) => s + item.quantity, 0),
        0
      );
      const variants = product.variants.map(({ orderItems, ...variant }) => variant);
      return { ...product, variants, soldCount: sold };
    })
    .sort((a, b) => {
      if (b.soldCount !== a.soldCount) return b.soldCount - a.soldCount;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return typeof take === "number" ? ranked.slice(0, take) : ranked;
}

export async function getPromoProducts() {
  await prisma.$connect();
  return prisma.product.findMany({
    where: { isOnSale: true },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductById(id) {
  return prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
}
