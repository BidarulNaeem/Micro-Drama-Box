export type DramaStatus = 'ongoing' | 'completed';

export type VideoType = 'mp4' | 'hls';

export interface VideoQuality {
  label: string; // e.g. "1080p", "720p", "480p", "Auto"
  resolution: string; // e.g. "1920x1080"
  url: string;
}

export interface Episode {
  id: string;
  dramaId: string;
  episodeNumber: number;
  title: string;
  description: string;
  duration: number; // in seconds
  thumbnail: string;
  thumbnailUrl?: string;
  videoSource: string; // primary stream/file URL
  videoType: VideoType;
  availableQualities: VideoQuality[];
  freeToWatch: boolean;
}

export interface Drama {
  id: string;
  title: string;
  description: string;
  poster: string;
  coverImage?: string;
  backdrop: string;
  genres: string[];
  totalEpisodes: number;
  status: DramaStatus;
  featured: boolean;
  trending: boolean;
  popularRank?: number;
  viewsCount: number;
  rating: number;
  releaseYear: number;
  tags: string[];
  episodes?: Episode[];
}

export interface UserProgress {
  userId: string;
  dramaId: string;
  episodeId: string;
  episodeNumber: number;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  lastWatchedAt: string; // ISO string
}

export interface MyShowItem {
  dramaId: string;
  addedAt: string;
}

export interface UserPreferences {
  autoPlayNext: boolean;
  defaultQuality: string;
  hapticFeedbackEnabled: boolean;
  mutedByDefault: boolean;
}

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  isPremium?: boolean;
  photoUrl?: string;
}

export interface TelegramTheme {
  bgColor: string;
  textColor: string;
  hintColor: string;
  linkColor: string;
  buttonColor: string;
  buttonTextColor: string;
  secondaryBgColor: string;
}

export interface AdConfig {
  adEpisodeInterval: number; // e.g. every 3 episodes
  enabled: boolean;
}

export interface AdTriggerEvent {
  dramaId: string;
  episodeNumber: number;
  totalWatchedSinceLastAd: number;
}

export type MainTab = 'discover' | 'foryou' | 'myshows' | 'profile';
