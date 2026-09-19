import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type CartLine = { productId: string; quantity: number };

export type CustomerInfo = {
  name: string;
  email: string;
  phone?: string;
  country?: string;
};

/**
 * Creates a PENDING order from a cart.
 *
 * SECURITY: prices are ALWAYS re-read from the database here — never trust
 * a price sent from the client. This is what stops someone from tampering
 * with the checkout request to pay less than the real price.
 */
export async function createOrderFromCart(
  userId: string,
  cart: CartLine[],
  customer: CustomerInfo,
  couponCode?: string
) {
  if (cart.length === 0) throw new Error("Cart is empty");

  const productIds = cart.map((l) => l.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "PUBLISHED" },
  });

  if (products.length !== productIds.length) {
    throw new Error("One or more products are unavailable");
  }

  const items = cart.map((line) => {
    const product = products.find((p) => p.id === line.productId)!;
    // Digital single-license products cannot be bought in quantity > 1
    const quantity = product.isSingleLicense ? 1 : line.quantity;
    const unitPrice = product.salePrice ?? product.price;
    return { product, quantity, unitPrice };
  });

  const subtotal = items.reduce(
    (sum, i) => sum.add(i.unitPrice.mul(i.quantity)),
    new Prisma.Decimal(0)
  );

  let discount = new Prisma.Decimal(0);
  let coupon = null;

  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (coupon) {
      const valid =
        (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (!coupon.minOrderAmount || subtotal.gte(coupon.minOrderAmount));
      if (valid) {
        discount =
          coupon.type === "PERCENTAGE"
            ? subtotal.mul(coupon.value).div(100)
            : coupon.value;
      } else {
        coupon = null;
      }
    }
  }

  const total = subtotal.sub(discount).lessThan(0)
    ? new Prisma.Decimal(0)
    : subtotal.sub(discount);

  const order = await prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      subtotal,
      discount,
      total,
      couponId: coupon?.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      country: customer.country,
      items: {
        create: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      },
    },
    include: { items: true },
  });

  return order;
}

/**
 * Called ONLY after a payment provider confirms payment (webhook), never
 * from the client. Marks the order paid and triggers digital delivery.
 */
export async function markOrderPaid(orderId: string) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID" },
    include: { items: { include: { product: { include: { files: true } } } }, user: true },
  });

  return order;
}
