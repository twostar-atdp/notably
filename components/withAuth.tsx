// components/withAuth.tsx

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PocketBase from "pocketbase";

export function WithAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

  useEffect(() => {
    const checkAuth = async () => {
      if (!pb.authStore.isValid) {
        setIsAuthenticated(false);
        router.push("/login");
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (isAuthenticated === false) {
    return null; // The useEffect will handle the redirect
  }

  return <>{children}</>;
}