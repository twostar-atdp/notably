// app/(authPages)/oauth/buttons.tsx

"use client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useSpotifyOauth } from "./client";
import { toast } from "react-toastify";

export function SpotifyOauthButton() {
  const [pending, setPending] = useState(false);
  const { login } = useSpotifyOauth();

  const handleAuth = async () => {
    if (pending) return;
    setPending(true);
    try {
      await login();
      toast.success("User logged in successfully");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      disabled={pending}
      onClick={handleAuth}
      className="flex h-[50px] w-full items-center justify-center gap-2 border-2 border-palette-text bg-palette-tertiary text-lg font-medium text-palette-text shadow-button transition-all duration-300 ease-out hover:shadow-buttonHover"
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        "Login with Spotify"
      )}
    </button>
  );
}