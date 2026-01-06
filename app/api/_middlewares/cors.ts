import { NextResponse } from "next/server";

export function cors(req: Request) {
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  return res;
}