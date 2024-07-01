import PocketBase from "pocketbase";

// This function will return a new instance every time on the server,
// and the same instance on the client
export function getPocketBase() {
  if (typeof window === "undefined") {
    // We're on the server, return a new instance
    return new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  } else {
    // We're on the client, use a singleton instance
    if (!(globalThis as any).pocketBase) {
      (globalThis as any).pocketBase = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    }
    return (globalThis as any).pocketBase;
  }
}

// For backwards compatibility
const pb = getPocketBase();
export default pb;