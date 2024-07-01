// utils/spotifyPlaylist.ts
import { searchTracks, generatePlaylist, unfollowPlaylist } from "./spotifyApi";

const MAX_TRACK_LENGTH_WORDS = 10;
const SEARCH_LIMIT = 50;

export interface TrackInfo {
  name: string;
  id: string;
  artists: string;
  albumArtURL: string | null;
}

export class BuildTracklist {
  private phrase: string;
  private minimizeTrackCount: boolean;

  constructor(phrase: string, minimizeTrackCount: boolean) {
    this.phrase = phrase;
    this.minimizeTrackCount = minimizeTrackCount;
  }

  private sanitizedPhrase(phrase: string): string {
    return phrase.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase();
  }

  private async findTracksWithString(targetString: string): Promise<TrackInfo[]> {
    const sanitizedTargetString = this.sanitizedPhrase(targetString);
    const tracks = await searchTracks(`track:"${sanitizedTargetString}"`, SEARCH_LIMIT);
    return tracks.filter(track => this.sanitizedPhrase(track.name) === sanitizedTargetString);
  }

  async getTracksForPhrase(): Promise<{ isSuccess: boolean; resultTracks?: TrackInfo[]; checkedTracks: TrackInfo[] }> {
    const sanitizedTargetString = this.sanitizedPhrase(this.phrase).replace(' +', ' ').trim();
    const inputArr = sanitizedTargetString.split(' ');
    const n = inputArr.length;

    const isPossible: boolean[] = new Array(n + 1).fill(false);
    const wordCountInLatestPhrase: number[] = new Array(n + 1).fill(0);
    const trackForLatestPhrase: (TrackInfo | null)[] = new Array(n + 1).fill(null);
    isPossible[0] = true;

    const checkedTracks: TrackInfo[] = [];

    for (let i = 1; i <= n; i++) {
      await new Promise(resolve => setTimeout(resolve, 100)); // To mitigate hitting rate limits
      const phrasesToCheck = Array.from({ length: i }, (_, j) => inputArr.slice(i - j - 1, i))
        .filter(phrase => phrase.length <= MAX_TRACK_LENGTH_WORDS);

      for (const phrase of phrasesToCheck) {
        const joinedPhrase = phrase.join(' ');
        const tracks = await this.findTracksWithString(joinedPhrase);
        
        for (const track of tracks) {
          checkedTracks.push(track);
          const phraseLength = phrase.length;
          
          if (isPossible[i - phraseLength]) {
            const comparisonFactor = this.minimizeTrackCount ? 1 : -1;
            const currentDifference = wordCountInLatestPhrase[i] - phraseLength;
            const isBetterOption = !trackForLatestPhrase[i] || (currentDifference * comparisonFactor > 0);

            if (isBetterOption) {
              isPossible[i] = true;
              wordCountInLatestPhrase[i] = phraseLength;
              trackForLatestPhrase[i] = track;
            }
          }
        }
      }
    }

    if (!isPossible[n]) {
      return {
        isSuccess: false,
        checkedTracks: Array.from(new Set(checkedTracks.map(track => track.id))).map(id => checkedTracks.find(track => track.id === id)!)
      };
    }

    const resultTracks: TrackInfo[] = [];
    let i = n;
    while (i > 0) {
      resultTracks.unshift(trackForLatestPhrase[i]!);
      i -= wordCountInLatestPhrase[i];
    }

    return {
      isSuccess: true,
      resultTracks,
      checkedTracks
    };
  }

  generateSuggestions(tracks: TrackInfo[], originalPhrase: string, checkedTracks: TrackInfo[]): string[] {
    const exactMatches = checkedTracks.filter(track => track);
    const unmatchedTracks = tracks.filter(track => !exactMatches.includes(track));
    const inputTokens = new Set(originalPhrase.toLowerCase().split(''));
    let suggestions: string[] = [];
  
    if (exactMatches.length > 0) {
      const basePhrase = exactMatches.map(track => track.name).join(" ");
      suggestions.push(basePhrase);
    }
  
    for (const track of unmatchedTracks) {
      const trackTokens = new Set(track.name.toLowerCase().split(''));
      const similarity = [...inputTokens].filter(token => trackTokens.has(token)).length;
      if (similarity > 0) {
        suggestions.push(track.name);
      }
    }
  
    if (suggestions.length > 3) {
      suggestions.sort((a, b) => {
        const aTokens = new Set(a.toLowerCase().split(''));
        const bTokens = new Set(b.toLowerCase().split(''));
        return [...bTokens].filter(token => inputTokens.has(token)).length - 
               [...aTokens].filter(token => inputTokens.has(token)).length;
      });
      suggestions = suggestions.slice(0, 3);
    }
  
    const finalSuggestions = suggestions.map(suggestion => {
      return exactMatches.length > 0 ? `${exactMatches.map(track => track.name).join(" ")} ${suggestion}`.trim() : suggestion;
    });
  
    return Array.from(new Set(finalSuggestions)).slice(0, 3);
  }
}


export class SpotifyPlaylistCreator {
  private tracks: TrackInfo[];
  private playlistName: string;

  constructor(
    tracks: TrackInfo[],
    playlistName: string = "Notably Playlist"
  ) {
    this.tracks = tracks;
    this.playlistName = playlistName;
  }

  async createTemporaryPlaylist(): Promise<{ url: string; id: string }> {
    try {
      const trackIds = this.tracks.filter(track => track).map(track => track.id);
      if (trackIds.length === 0) {
        throw new Error("No tracks available to add to the playlist");
      }
      const playlistId = await generatePlaylist(this.playlistName, trackIds);
      return {
        url: `https://open.spotify.com/playlist/${playlistId}`,
        id: playlistId
      };
    } catch (error) {
      console.error("Error creating temporary playlist:", error);
      throw new Error("Failed to create temporary playlist. Please try again later.");
    }
  }

  async removePlaylist(playlistId: string): Promise<void> {
    try {
      await unfollowPlaylist(playlistId);
    } catch (error) {
      console.error("Error removing temporary playlist:", error);
    }
  }
}