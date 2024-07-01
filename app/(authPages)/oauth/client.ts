"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getPocketBase } from "@/app/lib/pocketbase";
import { OauthAction } from "./server";

async function storeUserData(authData: any) {
  const pb = getPocketBase(); 
  const { id, name, avatarUrl, accessToken, refreshToken, expiry } = authData.meta;
  const { country, display_name, email, product, followers, external_urls, href, type, uri } = authData.meta.rawUser;
  const recordId = authData.record.id;

  try {
    const userData = {
      spotify_id: id,
      name: name,
      display_name: display_name,
      spotify_email: email || '',
      country: country || '',
      spotify_url: external_urls?.spotify || '',
      followers_count: followers?.total || 0,
      href: href || '',
      product: product || '',
      type: type || '',
      uri: uri || '',
      avatar_url: avatarUrl || '',
      spotify_access_token: accessToken,
      spotify_refresh_token: refreshToken,
      spotify_token_expiry: expiry,
    };

    const updatedUser = await pb.collection('users').update(recordId, userData);
    console.log("User updated with additional info:", updatedUser);

    // Update the auth cookie with the new user data
    const result = await OauthAction(authData.token, updatedUser);
    
    if (result.status !== 200) {
      throw new Error(result.message);
    }

    return result.user; // Return the serializable user data
  } catch (error) {
    console.error("Error storing user data:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    throw error;
  }
}

export function useSpotifyOauth() {
  const pb = useMemo(() => getPocketBase(), []); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      setIsAuthenticated(pb.authStore.isValid);
    } catch (error) {
      console.error("Error checking authentication status:", error);
      setIsAuthenticated(false);
    }
  }, [pb]);

  const login = async () => {
    try {
      const authData = await pb.collection("users").authWithOAuth2({
        provider: "spotify",
        scopes: ['user-read-email', 'user-read-private', 'playlist-modify-public', 'playlist-modify-private']
      });
      console.log("Spotify auth successful:", authData);
      await storeUserData(authData);
      setIsAuthenticated(true);
      router.push("/");
    } catch (error) {
      console.error("Spotify OAuth error:", error);
      throw error;
    }
  };

  const logout = async () => {
    pb.authStore.clear();
    setIsAuthenticated(false);
    router.push("/login");
  };

  return { isAuthenticated, login, logout };
}