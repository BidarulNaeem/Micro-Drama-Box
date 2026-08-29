import { UserProgress, MyShowItem, UserPreferences } from '../types';

export interface IUserProgressRepository {
  getProgress(dramaId: string): Promise<UserProgress | null>;
  getAllHistory(): Promise<UserProgress[]>;
  saveProgress(
    dramaId: string,
    episodeId: string,
    episodeNumber: number,
    progressSeconds: number,
    durationSeconds: number,
    completed?: boolean
  ): Promise<UserProgress>;
  markEpisodeCompleted(dramaId: string, episodeId: string, episodeNumber: number): Promise<void>;
  getMyShows(): Promise<MyShowItem[]>;
  toggleMyShow(dramaId: string): Promise<boolean>; // returns true if added, false if removed
  isMyShow(dramaId: string): Promise<boolean>;
  getPreferences(): Promise<UserPreferences>;
  savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences>;
  clearHistory(): Promise<void>;
}

const STORAGE_KEY_PROGRESS = 'dramapulse_user_progress';
const STORAGE_KEY_MY_SHOWS = 'dramapulse_my_shows';
const STORAGE_KEY_PREFS = 'dramapulse_user_prefs';

const DEFAULT_PREFERENCES: UserPreferences = {
  autoPlayNext: true,
  defaultQuality: '1080p',
  hapticFeedbackEnabled: true,
  mutedByDefault: false,
};

class LocalUserProgressRepository implements IUserProgressRepository {
  private userId: string = 'tg_user_local';

  public setUserId(id: string) {
    this.userId = id;
  }

  private getProgressMap(): Record<string, UserProgress> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveProgressMap(map: Record<string, UserProgress>): void {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(map));
    } catch {
      // ignore
    }
  }

  public async getProgress(dramaId: string): Promise<UserProgress | null> {
    const map = this.getProgressMap();
    return map[dramaId] || null;
  }

  public async getAllHistory(): Promise<UserProgress[]> {
    const map = this.getProgressMap();
    return Object.values(map).sort(
      (a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
    );
  }

  public async saveProgress(
    dramaId: string,
    episodeId: string,
    episodeNumber: number,
    progressSeconds: number,
    durationSeconds: number,
    completed: boolean = false
  ): Promise<UserProgress> {
    const map = this.getProgressMap();
    const entry: UserProgress = {
      userId: this.userId,
      dramaId,
      episodeId,
      episodeNumber,
      progressSeconds,
      durationSeconds,
      completed: completed || (durationSeconds > 0 && progressSeconds >= durationSeconds * 0.95),
      lastWatchedAt: new Date().toISOString(),
    };

    map[dramaId] = entry;
    this.saveProgressMap(map);
    return entry;
  }

  public async markEpisodeCompleted(
    dramaId: string,
    episodeId: string,
    episodeNumber: number
  ): Promise<void> {
    const map = this.getProgressMap();
    const existing = map[dramaId];
    map[dramaId] = {
      userId: this.userId,
      dramaId,
      episodeId,
      episodeNumber,
      progressSeconds: existing?.durationSeconds || 60,
      durationSeconds: existing?.durationSeconds || 60,
      completed: true,
      lastWatchedAt: new Date().toISOString(),
    };
    this.saveProgressMap(map);
  }

  public async getMyShows(): Promise<MyShowItem[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MY_SHOWS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public async isMyShow(dramaId: string): Promise<boolean> {
    const list = await this.getMyShows();
    return list.some((item) => item.dramaId === dramaId);
  }

  public async toggleMyShow(dramaId: string): Promise<boolean> {
    const list = await this.getMyShows();
    const index = list.findIndex((item) => item.dramaId === dramaId);
    let isAdded = false;

    if (index >= 0) {
      list.splice(index, 1);
      isAdded = false;
    } else {
      list.unshift({
        dramaId,
        addedAt: new Date().toISOString(),
      });
      isAdded = true;
    }

    try {
      localStorage.setItem(STORAGE_KEY_MY_SHOWS, JSON.stringify(list));
    } catch {
      // ignore
    }

    return isAdded;
  }

  public async getPreferences(): Promise<UserPreferences> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFS);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  public async savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences();
    const updated = { ...current, ...prefs };
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  }

  public async clearHistory(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY_PROGRESS);
    } catch {
      // ignore
    }
  }
}

export const userProgressRepository: IUserProgressRepository = new LocalUserProgressRepository();
