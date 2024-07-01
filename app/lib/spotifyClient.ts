import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getPocketBase } from "@/app/lib/pocketbase";

export async function getSpotifyClient(): Promise<SpotifyApi> {
  const pb = getPocketBase();
  const user = pb.authStore.model;

  if (!user) {
    throw new Error("User not authenticated");
  }

  if (!user.spotify_access_token || !user.spotify_refresh_token || !user.spotify_token_expiry) {
    throw new Error("Spotify tokens not found. Please authenticate with Spotify.");
  }

  const currentTime = Date.now();
  const expiryTime = new Date(user.spotify_token_expiry).getTime();

  if (currentTime > expiryTime) {
    // Token has expired, refresh it
    const newTokens = await refreshSpotifyToken(user.id, user.spotify_refresh_token);
    user.spotify_access_token = newTokens.spotify_access_token;
    user.spotify_refresh_token = newTokens.spotify_refresh_token;
    user.spotify_token_expiry = newTokens.spotify_token_expiry;
  }

  return SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!, {
    access_token: user.spotify_access_token,
    refresh_token: user.spotify_refresh_token,
    expires_in: Math.floor((new Date(user.spotify_token_expiry).getTime() - currentTime) / 1000),
    token_type: "Bearer"
  });
}

async function refreshSpotifyToken(userId: string, refreshToken: string) {
  const pb = getPocketBase();

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')
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
      spotify_refresh_token: data.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep the old one
      spotify_token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString()
    };

    // Update the user record in PocketBase with the new tokens
    await pb.collection('users').update(userId, newTokens);

    return newTokens;
  } catch (error) {
    console.error("Error refreshing Spotify token:", error);
    throw new Error("Failed to refresh Spotify token");
  }
}