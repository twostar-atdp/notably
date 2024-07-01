// utils/spotifyApi.ts
import { getSpotifyClient } from "@/app/lib/spotifyClient";

export async function searchTrack(query: string) {
  try {
    const spotify = await getSpotifyClient();
    const result = await spotify.search(query, ['track'], undefined, 1);
    return result.tracks?.items[0]?.id || null;
  } catch (error) {
    console.error("Error searching for track:", error);
    throw new Error("Spotify API error: Failed to search for track");
  }
}

export async function generatePlaylist(name: string, trackIds: string[]) {
  try {
    const spotify = await getSpotifyClient();
    const user = await spotify.currentUser.profile();
    const playlist = await spotify.playlists.createPlaylist(user.id, {
      name,
      public: false
    });
    await spotify.playlists.addItemsToPlaylist(playlist.id, trackIds.map(id => `spotify:track:${id}`));
    return playlist.id;
  } catch (error) {
    console.error("Error generating playlist:", error);
    throw new Error("Spotify API error: Failed to generate playlist");
  }
}