const nodemailer = require("nodemailer");

let transporter;

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendBudgetAlertEmail({
  to,
  userName,
  categoryName,
  percent,
  budgetAmount,
  spent,
  threshold,
}) {
  const transport = getTransporter();
  if (!transport) {
    console.warn("SMTP not configured — skipping budget alert email");
    return false;
  }

  const isExceeded = percent >= 100;
  const subject = isExceeded
    ? `Budget exceeded: ${categoryName}`
    : `Budget alert: ${categoryName} at ${threshold}%`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">FinTrack Budget Alert</h2>
      <p>Hi ${userName || "there"},</p>
      <p>Your spending in <strong>${categoryName}</strong> has reached
      <strong>${percent.toFixed(1)}%</strong> of your monthly budget
      (₹${spent.toFixed(2)} / ₹${budgetAmount.toFixed(2)}).</p>
      <p>${isExceeded ? "You have exceeded your budget limit." : `This is your ${threshold}% spending warning.`}</p>
      <p style="color: #64748b; font-size: 13px;">— FinTrack Personal Finance</p>
    </div>
  `;

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });

  return true;
}

module.exports = { sendBudgetAlertEmail, isMailConfigured };
