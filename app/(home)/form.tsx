// app/(home)/form.tsx
"use client"
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BuildTracklist, SpotifyPlaylistCreator } from "@/utils/spotifyPlaylist";
import { useSpotifyOauth } from "@/app/(authPages)/oauth/client";

export function Form() {
  const [phrase, setPhrase] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, login } = useSpotifyOauth();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phrase.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      if (!isAuthenticated) {
        await login();
        return;
      }

      const buildTracklist = new BuildTracklist(phrase, true);
      const result = await buildTracklist.getTracksForPhrase();

      if (!result.isSuccess || !result.resultTracks || result.resultTracks.length === 0) {
        throw new Error("No tracks found for the given phrase. Please try a different phrase.");
      }

      const playlistCreator = new SpotifyPlaylistCreator(result.resultTracks, `Notably: ${phrase}`);
      const playlistUrl = await playlistCreator.createPlaylist();

      router.push(`/playlist-success?url=${encodeURIComponent(playlistUrl)}`);
    } catch (error) {
      console.error("Error generating playlist:", error);
      if (error instanceof Error) {
        if (error.message.includes("Spotify API error")) {
          setError("There was an issue connecting to Spotify. Please try logging in again.");
        } else {
          setError(error.message);
        }
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [phrase, isAuthenticated, login, router]);
  


  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center w-full max-w-xl mx-auto gap-4"
    >
      <input
        type="text"
        placeholder="Type a phrase"
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
        className="w-full border-2 border-palette-text px-4 py-3 text-lg font-medium text-palette-text"
      />
      <button
        type="submit"
        disabled={isLoading || !phrase.trim()}
        className="px-6 py-2 border-2 border-palette-text bg-palette-tertiary text-lg font-medium text-palette-text shadow-button transition-all duration-300 ease-out hover:shadow-buttonHover disabled:opacity-50"
      >
        {isLoading ? "Generating..." : (isAuthenticated ? "Generate Playlist" : "Login with Spotify")}
      </button>
      {error && (
        <div className="text-red-500 mt-2">
          {error}
        </div>
      )}
    </form>
  );
}