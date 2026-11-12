import type { NextRequest } from "next/server";
import { forwardToBackend } from "@/server/backendProxy";

type RouteContext = { params: Promise<{ path: string[] }> };

const handle = async (request: NextRequest, { params }: RouteContext) => {
  const { path } = await params;
  return forwardToBackend(request, path);
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
