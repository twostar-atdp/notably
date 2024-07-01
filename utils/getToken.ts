// app/lib/getToken.ts
"use server"
import pb from "@/app/lib/pocketbase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getToken() {
  const cookie = cookies().get("pb_auth")?.value;
  if (!cookie) redirect("/login");

  try {
    const parsedCookie = JSON.parse(cookie);
    const token = parsedCookie.token;
    if (!token) throw new Error("No token found in cookie");

    // Verify token validity with PocketBase
    pb.authStore.loadFromCookie(`pb_auth=${cookie}`);
    if (!pb.authStore.isValid) {
      throw new Error("Invalid token");
    }

    console.log("Token:", token);
    return token;
  } catch (error) {
    console.error("Error parsing token:", error);
    redirect("/login");
  }
}