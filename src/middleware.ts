import { NextResponse } from "next/server";

export function middleware() {
  return new NextResponse("<h1>Site en maintenance</h1>", {
    status: 503,
    headers: { "Content-Type": "text/html" },
  });
}
