// app/(authPages)/login/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SpotifyOauthButton } from "../oauth/buttons";
import { useSpotifyOauth } from "../oauth/client";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useSpotifyOauth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null; 
  }

  return (
    <div className="flex flex-col items-center justify-start w-full min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-130px)] p-5 bg-palette-background">
      <div className="w-full max-w-md mx-auto mt-10 md:mt-20">
        <SpotifyOauthButton />
      </div>
    </div>
  );
}