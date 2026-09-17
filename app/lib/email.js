import { Resend } from 'resend';

export async function sendLowStockEmail(product, variant, currentQuantity) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  console.log(`[sendLowStockEmail] Triggered for ${product.name} (qty: ${currentQuantity}). Key present: ${!!apiKey}, To: ${toEmail}`);

  if (!apiKey) {
    console.warn("[sendLowStockEmail] Skipped: RESEND_API_KEY is not configured in environment.");
    return;
  }
  if (!toEmail || toEmail === "votre_email@exemple.com") {
    console.warn("[sendLowStockEmail] Skipped: ADMIN_NOTIFICATION_EMAIL is missing or default.");
    return;
  }

  const resend = new Resend(apiKey);
  const color = variant.colorName || variant.color || '';

  try {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: toEmail,
      subject: `Stock faible : ${product.name}`,
      html: `
        <p>Le produit <strong>${product.name}</strong> (${variant.size} / ${color}) n'a plus que <strong>${currentQuantity}</strong> pièce(s) en stock.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/admin/products/${product.id}/edit">Voir le produit</a></p>
      `,
    });
    console.log("[sendLowStockEmail] Resend API Result:", response);
    if (response.error) {
      console.error("[sendLowStockEmail] Resend API Error:", response.error);
    }
  } catch (err) {
    console.error("[sendLowStockEmail] Exception sending email:", err);
  }
}
