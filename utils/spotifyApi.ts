// utils/spotifyApi.ts
import { getSpotifyClient } from "@/app/lib/spotifyClient";




export async function searchTracks(query: string, limit: number = 50) {
  try {
    const spotify = await getSpotifyClient();
    const result = await spotify.search(query, ['track'], undefined, 50);
    return result.tracks?.items.map(track => ({
      name: track.name,
      id: track.id,
      artists: track.artists.map(artist => artist.name).join(', '),
      albumArtURL: track.album.images[1]?.url || null
    })) || [];
  } catch (error) {
    console.error("Error searching for tracks:", error);
    throw new Error("Spotify API error: Failed to search for tracks");
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


export async function getPlaylistCoverImage(playlistId: string) {
  try {
    const spotify = await getSpotifyClient();
    const images = await spotify.playlists.getPlaylistCoverImage(playlistId);
    return images[0]?.url || null;
  } catch (error) {
    console.error("Error fetching playlist cover image:", error);
    return null;
  }

}

export async function unfollowPlaylist(playlistId: string) {
  try {
    const spotify = await getSpotifyClient();
    await spotify.currentUser.playlists.unfollow(playlistId);
  } catch (error) {
    console.error("Error unfollowing playlist:", error);
    throw new Error("Spotify API error: Failed to unfollow playlist");
  }
}