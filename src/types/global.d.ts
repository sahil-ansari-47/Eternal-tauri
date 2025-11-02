export {};

declare global {
  interface File {
    path: string;
    content: string;
  }
  interface SearchResult {
    filePath: string;
    matches: { line: number; text: string }[];
  }
  type FsNode = {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FsNode[];
    expanded?: boolean;
    loading?: boolean;
  };
  type Friend = {
    username: string;
    avatar: string;
  };
  type Message = {
    id: string;
    from: string;
    to?: string;
    text: string;
    timestamp: Date;
    room?: string;
    chatKey: string;
  };
  type FriendRequest = {
    to: string;
    from: string;
    date: Date;
  };

  type Group = {
    room: string;
    roomId: string;
    imageUrl: string;
  };

  type UserData = {
    uid: string;
    username: string;
    avatar: string;
    friends?: Friend[];
    friendrequests?: FriendRequest[];
    groups?: Group[];
  };
  interface SpotifyImage {
    url: string;
    height: number | null;
    width: number | null;
  }

  interface SpotifyUser {
    id: string;
    display_name: string;
    email: string;
    country: string;
    product: string;
    followers: {
      href: string | null;
      total: number;
    };
    images: SpotifyImage[];
    external_urls: {
      spotify: string;
    };
    href: string;
    type: "user";
    uri: string;
  }

  interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string;
    images: SpotifyImage[];
    tracks: {
      href: string;
      total: number;
    };
    owner: {
      display_name: string;
      id: string;
      type: string;
      uri: string;
    };
    external_urls: {
      spotify: string;
    };
    href: string;
    type: "playlist";
    uri: string;
  }
  interface SpotifyArtist {
    id: string;
    name: string;
    href: string;
    type: string;
    uri: string;
  }

  interface SpotifyAlbum {
    id: string;
    name: string;
    images: SpotifyImage[];
    release_date: string;
    total_tracks: number;
    type: string;
    uri: string;
  }
  interface SpotifyTrack {
    id: string;
    name: string;
    preview_url: string | null;
    duration_ms: number;
    artists: SpotifyArtist[];
    album: SpotifyAlbum;
    external_urls: {
      spotify: string;
    };
    uri: string;
  }
  interface SpotifyPlaylistTracksResponse {
    href: string;
    items: {
      added_at: string;
      track: SpotifyTrack;
    }[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  }
  interface GitRepo {
    id: string;
    name: string;
    clone_url: string;
  }
  interface GitFile {
    path: string;
    hash?: string;
    status?: string;
  }
  interface GitStatus {
    staged: GitFile[];
    unstaged: GitFile[];
    untracked: GitFile[];
    branch?: string;
    origin?: string;
  }
  interface GitGraphNode {
    name: string;
    commits: number;
  }
  interface GitError extends Error {
    code?: string;
    details?: string;
  }
  interface Window {
    chatAPI: {
      logMessage: (message: Message) => void;
      messageNotification: (message: Message) => void;
      callNotification: (target: string, video: boolean) => boolean;
    };
  }
}
