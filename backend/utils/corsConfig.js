const normalizeOrigin = (url) => String(url || "").trim().replace(/\/$/, "");

const buildAllowedOrigins = () =>
  [
    normalizeOrigin(process.env.FRONTEND_URL),
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "https://personal-finance-expense-app.vercel.app",
  ].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  const allowed = buildAllowedOrigins();
  if (allowed.includes(normalized)) return true;
  // Vercel preview deployments, e.g. personal-finance-expense-app-xxx.vercel.app
  if (/^https:\/\/[\w-]+\.vercel\.app$/.test(normalized)) return true;
  return false;
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      // Must echo the exact origin (never "*") when credentials are enabled
      return callback(null, origin || buildAllowedOrigins()[0] || true);
    }
    console.warn("CORS blocked origin:", origin);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
};

module.exports = { corsOptions, authCookieOptions, buildAllowedOrigins };
