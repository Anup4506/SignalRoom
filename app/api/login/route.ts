import { NextResponse } from "next/server";
import { safeEqual, setSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const configuredUser = process.env.APP_USERNAME ?? (process.env.NODE_ENV !== "production" ? "reviewer" : "");
  const configuredPassword = process.env.APP_PASSWORD ?? (process.env.NODE_ENV !== "production" ? "sentiment-demo" : "");

  if (!configuredUser || !configuredPassword) {
    return NextResponse.json({ error: "Application credentials are not configured." }, { status: 503 });
  }

  if (!body.username || !body.password || !safeEqual(body.username, configuredUser) || !safeEqual(body.password, configuredPassword)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await setSession(body.username);
  return NextResponse.json({ username: body.username });
}
