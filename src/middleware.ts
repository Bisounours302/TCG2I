import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_: NextRequest) {
  return new NextResponse("<h1>Site en maintenance</h1>", {
    status: 503,
    headers: { "Content-Type": "text/html" },
  });
}
