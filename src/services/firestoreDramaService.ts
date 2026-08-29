import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Drama, Episode } from '../types';
import { SAMPLE_DRAMAS, R2_TEST_EPISODE_1_URL } from '../data/sampleDramas';
import { adminAuthService } from './adminAuthService';

const DRAMAS_COLLECTION = 'dramas';
const EPISODES_SUBCOLLECTION = 'episodes';

export const firestoreDramaService = {
  /**
   * Subscribe to all Dramas in real-time from Firestore.
   */
  subscribeAllDramas(onUpdate: (dramas: Drama[]) => void): () => void {
    const colRef = collection(db, DRAMAS_COLLECTION);
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, auto-seed the initial catalog in the background
          onUpdate(SAMPLE_DRAMAS);
          firestoreDramaService.seedInitialDramasIfEmpty().catch(() => {});
          return;
        }

        const dramasList: Drama[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const cover = data.coverImage || data.poster || '';
          const backdrop = data.backdrop || cover;
          dramasList.push({
            id: docSnap.id,
            title: data.title || 'Untitled Drama',
            description: data.description || '',
            poster: cover,
            coverImage: cover,
            backdrop: backdrop,
            genres: Array.isArray(data.genres) ? data.genres : ['Drama'],
            totalEpisodes: data.totalEpisodes || 0,
            status: data.status === 'completed' ? 'completed' : 'ongoing',
            featured: Boolean(data.featured),
            trending: Boolean(data.trending),
            popularRank: typeof data.popularRank === 'number' ? data.popularRank : undefined,
            viewsCount: Number(data.viewsCount) || 10000,
            rating: Number(data.rating) || 4.9,
            releaseYear: Number(data.releaseYear) || 2026,
            tags: Array.isArray(data.tags) ? data.tags : [],
            episodes: Array.isArray(data.episodes) ? data.episodes : undefined,
          });
        });

        // Sort by popular rank / views
        dramasList.sort((a, b) => {
          if (a.popularRank && b.popularRank) return a.popularRank - b.popularRank;
          return (b.viewsCount || 0) - (a.viewsCount || 0);
        });

        onUpdate(dramasList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, DRAMAS_COLLECTION);
        // Fallback to sample dramas so app is always interactive
        onUpdate(SAMPLE_DRAMAS);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to episodes for a specific Drama in real-time.
   */
  subscribeEpisodes(dramaId: string, onUpdate: (episodes: Episode[]) => void): () => void {
    const path = `${DRAMAS_COLLECTION}/${dramaId}/${EPISODES_SUBCOLLECTION}`;
    const episodesColRef = collection(db, DRAMAS_COLLECTION, dramaId, EPISODES_SUBCOLLECTION);
    const q = query(episodesColRef, orderBy('episodeNumber', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const epList: Episode[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const thumb = data.thumbnailUrl || data.thumbnail || '';
            epList.push({
              id: docSnap.id,
              dramaId,
              episodeNumber: Number(data.episodeNumber) || 1,
              title: data.title || `Episode ${data.episodeNumber || 1}`,
              description: data.description || '',
              duration: Number(data.duration) || 60,
              thumbnail: thumb,
              thumbnailUrl: thumb,
              videoSource: data.videoSource || R2_TEST_EPISODE_1_URL,
              videoType: data.videoType === 'hls' ? 'hls' : 'mp4',
              availableQualities: Array.isArray(data.availableQualities)
                ? data.availableQualities
                : [
                    { label: '1080p', resolution: '1080x1920', url: data.videoSource || R2_TEST_EPISODE_1_URL },
                    { label: '720p', resolution: '720x1280', url: data.videoSource || R2_TEST_EPISODE_1_URL },
                    { label: '480p', resolution: '480x854', url: data.videoSource || R2_TEST_EPISODE_1_URL },
                  ],
              freeToWatch: data.freeToWatch !== false,
            });
          });
          onUpdate(epList);
        } else {
          // Check fallback from static drama data if subcollection is empty
          const fallback = SAMPLE_DRAMAS.find((d) => d.id === dramaId);
          onUpdate(fallback?.episodes || []);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        const fallback = SAMPLE_DRAMAS.find((d) => d.id === dramaId);
        onUpdate(fallback?.episodes || []);
      }
    );

    return unsubscribe;
  },

  /**
   * Fetch all dramas once
   */
  async getDramas(): Promise<Drama[]> {
    try {
      const snapshot = await getDocs(collection(db, DRAMAS_COLLECTION));
      if (snapshot.empty) {
        await this.seedInitialDramasIfEmpty();
        return SAMPLE_DRAMAS;
      }
      const dramasList: Drama[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const cover = data.coverImage || data.poster || '';
        const backdrop = data.backdrop || cover;
        dramasList.push({
          id: docSnap.id,
          title: data.title || 'Untitled Drama',
          description: data.description || '',
          poster: cover,
          coverImage: cover,
          backdrop: backdrop,
          genres: Array.isArray(data.genres) ? data.genres : ['Drama'],
          totalEpisodes: data.totalEpisodes || 0,
          status: data.status === 'completed' ? 'completed' : 'ongoing',
          featured: Boolean(data.featured),
          trending: Boolean(data.trending),
          popularRank: typeof data.popularRank === 'number' ? data.popularRank : undefined,
          viewsCount: Number(data.viewsCount) || 10000,
          rating: Number(data.rating) || 4.9,
          releaseYear: Number(data.releaseYear) || 2026,
          tags: Array.isArray(data.tags) ? data.tags : [],
        });
      });
      return dramasList;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, DRAMAS_COLLECTION);
      return SAMPLE_DRAMAS;
    }
  },

  /**
   * Fetch a single drama by ID with its episodes
   */
  async getDramaById(dramaId: string): Promise<Drama | null> {
    try {
      const docSnap = await getDoc(doc(db, DRAMAS_COLLECTION, dramaId));
      if (!docSnap.exists()) {
        return SAMPLE_DRAMAS.find((d) => d.id === dramaId) || null;
      }
      const data = docSnap.data();
      const cover = data.coverImage || data.poster || '';
      const backdrop = data.backdrop || cover;
      const episodesSnap = await getDocs(
        query(
          collection(db, DRAMAS_COLLECTION, dramaId, EPISODES_SUBCOLLECTION),
          orderBy('episodeNumber', 'asc')
        )
      );
      const epList: Episode[] = [];
      episodesSnap.forEach((epDoc) => {
        const epData = epDoc.data();
        const thumb = epData.thumbnailUrl || epData.thumbnail || '';
        epList.push({
          id: epDoc.id,
          dramaId,
          episodeNumber: Number(epData.episodeNumber) || 1,
          title: epData.title || `Episode ${epData.episodeNumber || 1}`,
          description: epData.description || '',
          duration: Number(epData.duration) || 60,
          thumbnail: thumb,
          thumbnailUrl: thumb,
          videoSource: epData.videoSource || R2_TEST_EPISODE_1_URL,
          videoType: epData.videoType === 'hls' ? 'hls' : 'mp4',
          availableQualities: epData.availableQualities || [
            { label: '1080p', resolution: '1080x1920', url: epData.videoSource || R2_TEST_EPISODE_1_URL },
          ],
          freeToWatch: epData.freeToWatch !== false,
        });
      });

      return {
        id: docSnap.id,
        title: data.title || 'Untitled Drama',
        description: data.description || '',
        poster: cover,
        coverImage: cover,
        backdrop: backdrop,
        genres: Array.isArray(data.genres) ? data.genres : ['Drama'],
        totalEpisodes: epList.length || data.totalEpisodes || 0,
        status: data.status === 'completed' ? 'completed' : 'ongoing',
        featured: Boolean(data.featured),
        trending: Boolean(data.trending),
        popularRank: typeof data.popularRank === 'number' ? data.popularRank : undefined,
        viewsCount: Number(data.viewsCount) || 10000,
        rating: Number(data.rating) || 4.9,
        releaseYear: Number(data.releaseYear) || 2026,
        tags: Array.isArray(data.tags) ? data.tags : [],
        episodes: epList,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${DRAMAS_COLLECTION}/${dramaId}`);
      return SAMPLE_DRAMAS.find((d) => d.id === dramaId) || null;
    }
  },

  /**
   * Create or update a Drama document in Firestore
   */
  async saveDrama(dramaData: {
    id?: string;
    title: string;
    description: string;
    poster?: string;
    coverImage?: string;
    backdrop?: string;
    genres: string[];
    totalEpisodes?: number;
    status?: 'ongoing' | 'completed';
    featured?: boolean;
    trending?: boolean;
    rating?: number;
    tags?: string[];
  }): Promise<string> {
    if (!adminAuthService.isAuthenticated()) {
      throw new Error('Unauthorized: Admin PIN verification required to modify the drama catalog.');
    }

    const dramaId =
      dramaData.id ||
      `drama-${dramaData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;

    const dramaRef = doc(db, DRAMAS_COLLECTION, dramaId);
    const cover = (dramaData.coverImage || dramaData.poster || '').trim();
    const backdrop = (dramaData.backdrop || cover).trim();
    const payload = {
      title: dramaData.title.trim(),
      description: dramaData.description.trim(),
      poster: cover,
      coverImage: cover,
      backdrop: backdrop,
      genres: dramaData.genres.length > 0 ? dramaData.genres : ['Drama'],
      totalEpisodes: dramaData.totalEpisodes || 0,
      status: dramaData.status || 'ongoing',
      featured: Boolean(dramaData.featured),
      trending: Boolean(dramaData.trending),
      rating: dramaData.rating || 4.9,
      viewsCount: 15000 + Math.floor(Math.random() * 50000),
      releaseYear: 2026,
      tags: dramaData.tags || ['Short Drama', 'Trending'],
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(dramaRef, payload, { merge: true });
      return dramaId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${DRAMAS_COLLECTION}/${dramaId}`);
      throw error;
    }
  },

  /**
   * Delete a Drama from Firestore
   */
  async deleteDrama(dramaId: string): Promise<void> {
    if (!adminAuthService.isAuthenticated()) {
      throw new Error('Unauthorized: Admin PIN verification required to delete dramas.');
    }

    try {
      // First delete all episodes in subcollection
      const epSnap = await getDocs(
        collection(db, DRAMAS_COLLECTION, dramaId, EPISODES_SUBCOLLECTION)
      );
      const batch = writeBatch(db);
      epSnap.forEach((epDoc) => {
        batch.delete(epDoc.ref);
      });
      batch.delete(doc(db, DRAMAS_COLLECTION, dramaId));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${DRAMAS_COLLECTION}/${dramaId}`);
      throw error;
    }
  },

  /**
   * Save / Add an Episode to a Drama subcollection in Firestore
   */
  async saveEpisode(
    dramaId: string,
    episodeData: {
      id?: string;
      episodeNumber: number;
      title?: string;
      description?: string;
      videoSource: string;
      thumbnail?: string;
      thumbnailUrl?: string;
      duration?: number;
      videoType?: 'mp4' | 'hls';
      freeToWatch?: boolean;
    }
  ): Promise<string> {
    if (!adminAuthService.isAuthenticated()) {
      throw new Error('Unauthorized: Admin PIN verification required to save episodes.');
    }

    const epNum = Number(episodeData.episodeNumber);
    const episodeId = episodeData.id || `${dramaId}-ep-${epNum}`;
    const epRef = doc(db, DRAMAS_COLLECTION, dramaId, EPISODES_SUBCOLLECTION, episodeId);

    const title =
      episodeData.title?.trim() ||
      `Episode ${String(epNum).padStart(2, '0')}`;

    const thumb = (episodeData.thumbnailUrl || episodeData.thumbnail || '').trim();

    const payload = {
      dramaId,
      episodeNumber: epNum,
      title,
      description:
        episodeData.description?.trim() ||
        `Episode ${epNum} of the drama series.`,
      videoSource: episodeData.videoSource.trim(),
      thumbnail: thumb,
      thumbnailUrl: thumb,
      duration: Number(episodeData.duration) || 75,
      videoType: episodeData.videoType || 'mp4',
      freeToWatch: episodeData.freeToWatch !== false,
      availableQualities: [
        { label: '1080p', resolution: '1080x1920', url: episodeData.videoSource.trim() },
        { label: '720p', resolution: '720x1280', url: episodeData.videoSource.trim() },
        { label: '480p', resolution: '480x854', url: episodeData.videoSource.trim() },
      ],
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(epRef, payload, { merge: true });

      // Update totalEpisodes count on drama
      const allEps = await getDocs(
        collection(db, DRAMAS_COLLECTION, dramaId, EPISODES_SUBCOLLECTION)
      );
      await updateDoc(doc(db, DRAMAS_COLLECTION, dramaId), {
        totalEpisodes: allEps.size,
        updatedAt: new Date().toISOString(),
      });

      return episodeId;
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `${DRAMAS_COLLECTION}/${dramaId}/${EPISODES_SUBCOLLECTION}/${episodeId}`
      );
      throw error;
    }
  },

  /**
   * Delete an Episode from a Drama
   */
  async deleteEpisode(dramaId: string, episodeId: string): Promise<void> {
    if (!adminAuthService.isAuthenticated()) {
      throw new Error('Unauthorized: Admin PIN verification required to delete episodes.');
    }

    try {
      await deleteDoc(doc(db, DRAMAS_COLLECTION, dramaId, EPISODES_SUBCOLLECTION, episodeId));

      const allEps = await getDocs(
        collection(db, DRAMAS_COLLECTION, dramaId, EPISODES_SUBCOLLECTION)
      );
      await updateDoc(doc(db, DRAMAS_COLLECTION, dramaId), {
        totalEpisodes: allEps.size,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `${DRAMAS_COLLECTION}/${dramaId}/${EPISODES_SUBCOLLECTION}/${episodeId}`
      );
      throw error;
    }
  },

  /**
   * Seeds demo dramas & episodes (including Cloudflare R2 test video for Episode 1) into Firestore
   */
  async seedInitialDramasIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, DRAMAS_COLLECTION));
      if (!snap.empty) {
        return;
      }
      await this.seedAllSampleData();
    } catch (err) {
      console.warn('Initial seeding check completed or offline:', err);
    }
  },

  /**
   * Force seed or re-seed sample catalogue to Firestore
   */
  async seedAllSampleData(): Promise<number> {
    let count = 0;
    for (const drama of SAMPLE_DRAMAS) {
      const dramaRef = doc(db, DRAMAS_COLLECTION, drama.id);
      await setDoc(dramaRef, {
        title: drama.title,
        description: drama.description,
        poster: drama.poster,
        backdrop: drama.backdrop,
        genres: drama.genres,
        totalEpisodes: drama.totalEpisodes,
        status: drama.status,
        featured: drama.featured,
        trending: drama.trending,
        popularRank: drama.popularRank,
        viewsCount: drama.viewsCount,
        rating: drama.rating,
        releaseYear: drama.releaseYear,
        tags: drama.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (drama.episodes && drama.episodes.length > 0) {
        for (const ep of drama.episodes) {
          const epRef = doc(db, DRAMAS_COLLECTION, drama.id, EPISODES_SUBCOLLECTION, ep.id);
          await setDoc(epRef, {
            dramaId: drama.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            description: ep.description,
            duration: ep.duration,
            thumbnail: ep.thumbnail,
            videoSource: ep.videoSource,
            videoType: ep.videoType,
            availableQualities: ep.availableQualities,
            freeToWatch: ep.freeToWatch,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      count++;
    }
    return count;
  },
};
