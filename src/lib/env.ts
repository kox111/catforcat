function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable de entorno requerida no encontrada: ${name}. Configúrala en .env o en Vercel.`,
    );
  }
  return value;
}

export const env = {
  NEXTAUTH_SECRET: requireEnv("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  DATABASE_URL: requireEnv("DATABASE_URL"),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY || "",
  DEEPL_API_KEY: process.env.DEEPL_API_KEY || "",
};
