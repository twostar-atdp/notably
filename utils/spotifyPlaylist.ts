// utils/spotifyPlaylist.ts
import { searchTrack, generatePlaylist } from "./spotifyApi";

const MAX_TRACK_LENGTH_WORDS = 10;

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

  private async findTrackWithString(targetString: string): Promise<TrackInfo | null> {
    const sanitizedTargetString = this.sanitizedPhrase(targetString);
    const trackId = await searchTrack(sanitizedTargetString);
    if (trackId) {
      return {
        name: sanitizedTargetString,
        id: trackId,
        artists: "",
        albumArtURL: null
      };
    }
    return null;
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
        const track = await this.findTrackWithString(joinedPhrase);
        if (track) {
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

  async createPlaylist(): Promise<string> {
    try {
      const trackIds = this.tracks.filter(track => track).map(track => track.id);
      if (trackIds.length === 0) {
        throw new Error("No tracks available to add to the playlist");
      }

      const playlistId = await generatePlaylist(this.playlistName, trackIds);
      return `https://open.spotify.com/playlist/${playlistId}`;
    } catch (error) {
      console.error("Error creating playlist:", error);
      throw new Error("Failed to create playlist. Please try again later.");
    }
  }
}