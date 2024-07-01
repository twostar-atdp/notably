"use server";
import { cookies } from "next/headers";
import { getPocketBase } from "@/app/lib/pocketbase";
import type { RecordModel } from "pocketbase";

export async function OauthAction(token: string, model: RecordModel) {
  try {
    // Create a serializable version of the model
    const serializableModel = JSON.parse(JSON.stringify(model));
    const cookie = JSON.stringify({ token, model: serializableModel });
    console.log("Attempting to set cookie:", cookie);
    cookies().set("pb_auth", cookie, {
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    console.log("Cookie set successfully");
    const user = {
      id: model.id,
      username: model.username,
      name: model.name,
      display_name: model.display_name,
      avatar_url: model.avatar_url,
      country: model.country,
      spotify_id: model.spotify_id,
      spotify_url: model.spotify_url,
      spotify_email: model.spotify_email,
      spotify_token_expiry: model.spotify_token_expiry,
      product: model.product,
      type: model.type,
      verified: model.verified,
      created: model.created,
      updated: model.updated,
    };
    return {
      status: 200,
      message: "Logged in Successfully",
      user: user,
    };
  } catch (error: any) {
    console.error("OAuth Action error:", error);
    return {
      status: 400,
      message: error.message,
    };
  }
}


export async function refreshSpotifyToken(userId: string, refreshToken: string) {
  const pb = getPocketBase();
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    if (!response.ok) {
      throw new Error('Failed to refresh Spotify token');
    }
    const data = await response.json();
    const newTokens = {
      spotify_access_token: data.access_token,
      spotify_refresh_token: data.refresh_token || refreshToken,
      spotify_token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString()
    };
    // Update the user record with new tokens
    await pb.collection('users').update(userId, newTokens);
    return newTokens;
  } catch (error) {
    console.error("Error refreshing Spotify token:", error);
    throw new Error("Failed to refresh Spotify token");
  }
}