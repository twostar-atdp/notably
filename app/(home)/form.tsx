"use client";
import { useCallback, useState } from "react";
import { BuildTracklist, SpotifyPlaylistCreator } from "@/utils/spotifyPlaylist";
import { useSpotifyOauth } from "@/app/(authPages)/oauth/client";

interface PlaylistInfo {
  url: string;
  id: string;
}

export function Form(): JSX.Element {
  const [phrase, setPhrase] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [playlistCreator, setPlaylistCreator] = useState<SpotifyPlaylistCreator | null>(null);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  
  const { isAuthenticated, login, logout }: { 
    isAuthenticated: boolean; 
    login: (authWindow: Window | null) => Promise<void>;
    logout: () => Promise<void>;
  } = useSpotifyOauth();

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phrase.trim()) return;
    setIsLoading(true);
    setError(null);
    setPlaylistInfo(null);

    try {
      if (!isAuthenticated) {
        await login(typeof window !== 'undefined' ? window : null);
        return;
      }

      const buildTracklist = new BuildTracklist(phrase, true);
      const result = await buildTracklist.getTracksForPhrase();

      if (!result.isSuccess || !result.resultTracks || result.resultTracks.length === 0) {
        throw new Error("No tracks found for the given phrase. Please try a different phrase.");
      }

      const creator = new SpotifyPlaylistCreator(result.resultTracks, `Notably: ${phrase}`);
      setPlaylistCreator(creator);
      const newPlaylistInfo = await creator.createTemporaryPlaylist();
      setPlaylistInfo(newPlaylistInfo);
    } catch (error) {
      console.error("Error generating playlist:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [phrase, isAuthenticated, login]);

  const handleCopyLink = useCallback(() => {
    if (playlistInfo) {
      navigator.clipboard.writeText(playlistInfo.url)
        .then(() => {
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        })
        .catch(err => {
          console.error("Failed to copy link: ", err);
          setError("Failed to copy link");
          setTimeout(() => setError(null), 3000);
        });
    }
  }, [playlistInfo]);

  const handleUnfollowPlaylist = useCallback(async () => {
    if (playlistCreator && playlistInfo) {
      try {
        await playlistCreator.removePlaylist(playlistInfo.id);
        setPlaylistInfo(null);
        setPlaylistCreator(null);
        setError("Playlist unfollowed successfully");
        setTimeout(() => setError(null), 3000);
      } catch (error) {
        console.error("Error unfollowing playlist:", error);
        setError("Failed to unfollow playlist");
        setTimeout(() => setError(null), 3000);
      }
    }
  }, [playlistCreator, playlistInfo]);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto gap-4">
      {showNotification && (
        <div className="fixed top-0 left-0 right-0 bg-green-500 text-white py-2 px-4 text-center transition-opacity duration-300">
          Link copied to clipboard!
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center w-full gap-4"
      >
        <input
          type="text"
          placeholder="Type a phrase"
          value={phrase}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhrase(e.target.value)}
          className="w-full border-2 border-palette-text px-4 py-3 text-lg font-medium text-palette-text"
        />
        <button
          type="submit"
          disabled={isLoading || !phrase.trim()}
          className="w-full px-6 py-2 border-2 border-palette-text bg-palette-tertiary text-lg font-medium text-palette-text shadow-button transition-all duration-300 ease-out hover:shadow-buttonHover disabled:opacity-50"
        >
          {isLoading ? "Generating..." : (isAuthenticated ? "Generate Playlist" : "Login with Spotify")}
        </button>
      </form>
      {error && (
        <div className="text-palette-text mt-2 p-2 bg-palette-tertiary border-2 border-palette-text">
          {error}
        </div>
      )}
      {playlistInfo && (
        <div className="mt-8 text-center w-full">
          <div className="border-2 border-palette-text bg-palette-tertiary shadow-button transition-all duration-300 ease-out hover:shadow-buttonHover p-8 md:p-12 lg:p-16 max-w-5xl mx-auto">
            <iframe
              src={`https://open.spotify.com/embed/playlist/${playlistInfo.id}?theme=0`}
              width="100%"
              height="500"
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="border-none"
            />
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={handleCopyLink}
                className="px-6 py-2 border-2 border-palette-text bg-palette-tertiary text-lg font-medium text-palette-text shadow-button transition-all duration-300 ease-out hover:shadow-buttonHover"
                title="Copy playlist link"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
              <button
                onClick={handleUnfollowPlaylist}
                className="px-6 py-2 border-2 border-palette-text bg-palette-tertiary text-lg font-medium text-palette-text shadow-button transition-all duration-300 ease-out hover:shadow-buttonHover"
                title="Unfollow playlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}