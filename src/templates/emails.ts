const BRAND_COLOR = "#FF5A5F";

const baseLayout = (content: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${BRAND_COLOR};padding:24px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:-0.5px;">airbnb</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background:#f7f7f7;border-top:1px solid #ebebeb;text-align:center;">
              <p style="margin:0;color:#888;font-size:12px;">© ${new Date().getFullYear()} Airbnb, Inc. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const h2 = (text: string) =>
  `<h2 style="margin:0 0 16px;color:${BRAND_COLOR};font-size:22px;">${text}</h2>`;

const p = (text: string) =>
  `<p style="margin:0 0 12px;color:#444;font-size:15px;line-height:1.6;">${text}</p>`;

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;">${label}</a>`;

const infoRow = (label: string, value: string) => `
  <tr>
    <td style="padding:8px 12px;color:#888;font-size:14px;">${label}</td>
    <td style="padding:8px 12px;color:#222;font-size:14px;font-weight:bold;">${value}</td>
  </tr>
`;

export const welcomeEmail = (name: string, role: string): string => {
  const isHost = role === "HOST";

  const cta = isHost
    ? `${p("You're all set to start hosting. Create your first listing and welcome guests from around the world.")}
       ${btn("http://localhost:3000/listings", "Create Your First Listing")}`
    : `${p("Start exploring thousands of unique places to stay — from cozy apartments to stunning villas.")}
       ${btn("http://localhost:3000/listings", "Explore Listings")}`;

  return baseLayout(`
    ${h2(`Welcome to Airbnb, ${name}! 🎉`)}
    ${p(`Thanks for joining as a <strong>${isHost ? "Host" : "Guest"}</strong>. We're thrilled to have you.`)}
    ${cta}
  `);
};

export const bookingConfirmationEmail = (
  guestName: string,
  listingTitle: string,
  location: string,
  checkIn: string,
  checkOut: string,
  totalPrice: number
): string => {
  return baseLayout(`
    ${h2("Booking Confirmed ✓")}
    ${p(`Hi ${guestName}, your booking is confirmed. Here are your details:`)}

    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #ebebeb;border-radius:6px;overflow:hidden;">
      <tbody>
        ${infoRow("Listing", listingTitle)}
        ${infoRow("Location", location)}
        ${infoRow("Check-in", checkIn)}
        ${infoRow("Check-out", checkOut)}
        ${infoRow("Total", `$${totalPrice.toFixed(2)}`)}
      </tbody>
    </table>

    <div style="margin-top:20px;padding:14px 16px;background:#fff8f0;border-left:4px solid ${BRAND_COLOR};border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#666;">
        <strong>Cancellation Policy:</strong> Free cancellation up to 48 hours before check-in.
        Cancellations within 48 hours of check-in are non-refundable.
      </p>
    </div>
  `);
};

export const bookingCancellationEmail = (
  guestName: string,
  listingTitle: string,
  checkIn: string,
  checkOut: string
): string => {
  return baseLayout(`
    ${h2("Booking Cancelled")}
    ${p(`Hi ${guestName}, your booking has been cancelled. Here's what was cancelled:`)}

    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #ebebeb;border-radius:6px;overflow:hidden;">
      <tbody>
        ${infoRow("Listing", listingTitle)}
        ${infoRow("Check-in", checkIn)}
        ${infoRow("Check-out", checkOut)}
      </tbody>
    </table>

    ${p("Don't worry — there are plenty of great stays waiting for you.")}
    ${btn("http://localhost:3000/listings", "Find Another Listing")}
  `);
};

export const passwordResetEmail = (name: string, resetLink: string): string => {
  return baseLayout(`
    ${h2("Reset Your Password")}
    ${p(`Hi ${name}, we received a request to reset your Airbnb password.`)}
    ${p("Click the button below to choose a new password. This link <strong>expires in 1 hour</strong>.")}
    ${btn(resetLink, "Reset Password")}
    <p style="margin-top:24px;color:#aaa;font-size:13px;">
      If you did not request this, you can safely ignore this email. Your password will not change.
    </p>
  `);
};
