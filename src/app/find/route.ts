import { NextResponse, type NextRequest } from "next/server";

/**
 * The home page search form submits here. It sends the visitor to the
 * hospital results or the pediatrician search for the same ZIP and distance,
 * so the form works without JavaScript.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const target = params.get("find") === "pediatricians" ? "/pediatricians" : "/results";
  const url = new URL(target, request.url);
  for (const key of ["zip", "radius"]) {
    const value = params.get(key);
    if (value) url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url, 303);
}
