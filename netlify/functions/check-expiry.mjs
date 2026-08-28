export default async () => {
  const appUrl = process.env.APP_URL || process.env.URL;
  const secret = process.env.SCHEDULED_TASK_SECRET;
  if (!appUrl || !secret) return new Response(JSON.stringify({ ok: false, error: "APP_URL or SCHEDULED_TASK_SECRET is not configured" }), { status: 500, headers: { "content-type": "application/json" } });
  const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/scheduled/check-expiry`, { method: "POST", headers: { "x-scheduled-secret": secret } });
  return new Response(await response.text(), { status: response.status, headers: { "content-type": "application/json" } });
};

export const config = { schedule: "0 1 * * *" };
