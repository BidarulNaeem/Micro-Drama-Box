import { Drama, Episode } from '../types';
import { firestoreDramaService } from '../services/firestoreDramaService';


export interface IDramaRepository {
  getFeaturedDramas(): Promise<Drama[]>;
  getTrendingDramas(): Promise<Drama[]>;
  getPopularDramas(): Promise<Drama[]>;
  getNewReleases(): Promise<Drama[]>;
  getForYouDramas(): Promise<Drama[]>;
  getAllDramas(): Promise<Drama[]>;
  getDramaById(id: string): Promise<Drama | null>;
  getEpisodesByDramaId(dramaId: string): Promise<Episode[]>;
  getEpisode(dramaId: string, episodeNumber: number): Promise<Episode | null>;
  searchDramas(query: string, genre?: string): Promise<Drama[]>;
  getGenres(): Promise<string[]>;
  subscribeAll(callback: (dramas: Drama[]) => void): () => void;
  subscribeEpisodes(dramaId: string, callback: (episodes: Episode[]) => void): () => void;
}

const CANONICAL_GENRES = [
  'Romance',
  'Billionaire',
  'Revenge',
  'Action',
  'Suspense',
  'Drama',
];

class FirestoreDramaRepository implements IDramaRepository {
  private memoryCache: Drama[] = [];
  private isInitialized = false;

  constructor() {
    // Start initial real-time sync
    this.initRealtime();
  }

  private initRealtime() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    firestoreDramaService.subscribeAllDramas((dramas) => {
      if (dramas && dramas.length > 0) {
        this.memoryCache = dramas;
      }
    });
  }

  public subscribeAll(callback: (dramas: Drama[]) => void): () => void {
    return firestoreDramaService.subscribeAllDramas((dramas) => {
      this.memoryCache = dramas;
      callback(dramas);
    });
  }


  public subscribeEpisodes(dramaId: string, callback: (episodes: Episode[]) => void): () => void {
    return firestoreDramaService.subscribeEpisodes(dramaId, callback);
  }

  public async getFeaturedDramas(): Promise<Drama[]> {
    const all = await this.getAllDramas();
    return all.filter((d) => d.featured);
  }

  public async getTrendingDramas(): Promise<Drama[]> {
    const all = await this.getAllDramas();
    return all.filter((d) => d.trending);
  }

  public async getPopularDramas(): Promise<Drama[]> {
    const all = await this.getAllDramas();
    return [...all].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  }

  public async getNewReleases(): Promise<Drama[]> {
    const all = await this.getAllDramas();
    return [...all].sort((a, b) => b.releaseYear - a.releaseYear);
  }

  public async getForYouDramas(): Promise<Drama[]> {
    const all = await this.getAllDramas();
    return [...all].sort(() => 0.5 - Math.random());
  }

  public async getAllDramas(): Promise<Drama[]> {
    if (this.memoryCache.length > 0) {
      return this.memoryCache;
    }
    const dramas = await firestoreDramaService.getDramas();
    this.memoryCache = dramas;
    return dramas;
  }

  public async getDramaById(id: string): Promise<Drama | null> {
    const cached = this.memoryCache.find((d) => d.id === id);
    if (cached) return cached;
    return firestoreDramaService.getDramaById(id);
  }

  public async getEpisodesByDramaId(dramaId: string): Promise<Episode[]> {
    const drama = await this.getDramaById(dramaId);
    if (drama?.episodes && drama.episodes.length > 0) {
      return drama.episodes;
    }
    // Try fetching directly
    const full = await firestoreDramaService.getDramaById(dramaId);
    return full?.episodes || [];
  }

  public async getEpisode(dramaId: string, episodeNumber: number): Promise<Episode | null> {
    const episodes = await this.getEpisodesByDramaId(dramaId);
    return episodes.find((e) => e.episodeNumber === episodeNumber) || null;
  }

  public async searchDramas(query: string, genre?: string): Promise<Drama[]> {
    const all = await this.getAllDramas();
    const cleanQuery = (query || '').trim().toLowerCase();
    const cleanGenre = (genre || '').trim().toLowerCase();

    return all.filter((drama) => {
      const matchQuery =
        !cleanQuery ||
        drama.title.toLowerCase().includes(cleanQuery) ||
        drama.description.toLowerCase().includes(cleanQuery) ||
        (drama.tags && drama.tags.some((t) => t.toLowerCase().includes(cleanQuery)));

      const matchGenre =
        !cleanGenre ||
        cleanGenre === 'all' ||
        drama.genres.some((g) => g.toLowerCase() === cleanGenre);

      return matchQuery && matchGenre;
    });
  }

  public async getGenres(): Promise<string[]> {
    const all = await this.getAllDramas();
    const dynamicGenres = new Set<string>(CANONICAL_GENRES);
    all.forEach((d) => d.genres?.forEach((g) => dynamicGenres.add(g)));
    return Array.from(dynamicGenres);
  }
}

export const dramaRepository: IDramaRepository = new FirestoreDramaRepository();
