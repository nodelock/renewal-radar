export const ENV = {
  cookieSecret: process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  // A GitHub OAuth client ID is intentionally public; one VITE_ value serves both sides.
  githubClientId: process.env.VITE_GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID ?? "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  githubAllowedUsername: process.env.GITHUB_ALLOWED_USERNAME ?? process.env.GITHUB_ALLOWED_USER ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
