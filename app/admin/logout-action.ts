"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";

export async function logoutAdminAction() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
