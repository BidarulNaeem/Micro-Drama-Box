import { Drama, Episode } from '../types';

/**
 * Real Cloudflare R2 test video stream for Episode 1 playback.
 */
export const R2_TEST_EPISODE_1_URL =
  'https://pub-1625e1f036634c70aedb27f8db158494.r2.dev/A%20Vow%20Of%20Joy%20And%20Sorrow%20Ep%2001.mp4';

const SAMPLE_VIDEOS = [
  {
    mp4: R2_TEST_EPISODE_1_URL,
    hls: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 104,
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    hls: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 52,
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    hls: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 60,
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    hls: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 48,
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    hls: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 55,
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    hls: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 63,
  },
];

const EPISODE_TITLES_POOL = [
  'A Vow of Joy and Sorrow - The Prelude',
  'Unveiling the Hidden Will',
  'A Slap to the Arrogant Heir',
  'Identity Confirmed',
  'Reclaiming the Empire',
  'Midnight Ultimatum',
  'The Poisoned Contract',
  'Revenge on the Boardroom',
  'Vows of the True Master',
  'The Final Sovereign',
];

function generateEpisodesForDrama(
  dramaId: string,
  dramaTitle: string,
  count: number,
  baseThumb: string
): Episode[] {
  const episodes: Episode[] = [];

  for (let i = 1; i <= count; i++) {
    const isEp1 = i === 1;
    const videoData = isEp1 ? SAMPLE_VIDEOS[0] : SAMPLE_VIDEOS[(i - 1) % SAMPLE_VIDEOS.length];
    const epTitle = EPISODE_TITLES_POOL[(i - 1) % EPISODE_TITLES_POOL.length] || `Chapter ${i}: The Turning Point`;
    const videoUrl = isEp1 ? R2_TEST_EPISODE_1_URL : videoData.mp4;

    episodes.push({
      id: `${dramaId}-ep-${i}`,
      dramaId,
      episodeNumber: i,
      title: isEp1 ? `Episode 01: ${epTitle}` : `Episode ${String(i).padStart(2, '0')}: ${epTitle}`,
      description: `In episode ${i} of ${dramaTitle}, an unexpected confrontation changes everything as hidden motives come to light.`,
      duration: videoData.duration,
      thumbnail: `${baseThumb}?auto=format&fit=crop&w=400&q=80&sig=${dramaId}-${i}`,
      thumbnailUrl: `${baseThumb}?auto=format&fit=crop&w=400&q=80&sig=${dramaId}-${i}`,
      videoSource: videoUrl,
      videoType: 'mp4',
      freeToWatch: false,
      availableQualities: [
        { label: '1080p', resolution: '1080x1920', url: videoUrl },
        { label: '720p', resolution: '720x1280', url: videoUrl },
        { label: '480p', resolution: '480x854', url: videoUrl },
      ],
    });
  }

  return episodes;
}

const RAW_DRAMAS: Omit<Drama, 'episodes'>[] = [
  {
    id: 'drama-vow-joy-sorrow',
    title: 'A Vow of Joy and Sorrow',
    description: 'A fateful arranged marriage conceals a decade-long secret alliance and fierce corporate vendetta. As Lucas and Clara navigate high society deceit, true love and hidden power collide.',
    poster: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    genres: ['Romance', 'Billionaire', 'Drama'],
    totalEpisodes: 8,
    status: 'ongoing',
    featured: true,
    trending: true,
    popularRank: 1,
    viewsCount: 2450000,
    rating: 4.98,
    releaseYear: 2026,
    tags: ['R2 Stream', 'Contract Marriage', 'Secret Sovereign', 'Binge Worthy'],
  },
  {
    id: 'drama-billionaire-disguise',
    title: 'The Hidden Billionaire in Disguise',
    description: 'Cast out and mocked as an ordinary delivery driver, Lucas holds the keys to the world’s most powerful sovereign conglomerate. When his wife’s elite family pushes him to the brink, his true billionaire identity is revealed.',
    poster: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80',
    genres: ['Billionaire', 'Revenge', 'Drama'],
    totalEpisodes: 8,
    status: 'ongoing',
    featured: true,
    trending: true,
    popularRank: 2,
    viewsCount: 1420000,
    rating: 4.9,
    releaseYear: 2026,
    tags: ['Billionaire', 'Secret Identity', 'High Society', 'Binge Worthy'],
  },
  {
    id: 'drama-heiress-strikes-back',
    title: 'The Real Heiress Strikes Back',
    description: 'Replaced at birth and abandoned in the countryside, Evelyn returns to the city after 18 years as an internationally feared venture capitalist ready to reclaim her mother’s stolen heritage.',
    poster: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=80',
    genres: ['Revenge', 'Suspense', 'Drama'],
    totalEpisodes: 6,
    status: 'completed',
    featured: false,
    trending: true,
    popularRank: 2,
    viewsCount: 980000,
    rating: 4.8,
    releaseYear: 2026,
    tags: ['Strong FL', 'Revenge', 'Billionaire Family'],
  },
  {
    id: 'drama-shadow-dragon-heir',
    title: 'Shadow Heir: The Dragon Sovereign',
    description: 'After five years serving the Supreme Vanguard in secret, General Drake returns home to find his brother betrayed. With one phone call, ten thousand elite operatives mobilize across the metropolis.',
    poster: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80',
    genres: ['Action', 'Suspense', 'Drama'],
    totalEpisodes: 8,
    status: 'ongoing',
    featured: true,
    trending: true,
    popularRank: 3,
    viewsCount: 2150000,
    rating: 4.95,
    releaseYear: 2026,
    tags: ['Action', 'Secret King', 'Urban Battle'],
  },
  {
    id: 'drama-contract-marriage-ceo',
    title: 'Mr. Vance’s Secret Contract Wife',
    description: 'To save her family’s clinic, Clara signs a 100-day contract marriage with the reclusive and cold CEO Matthew Vance. Neither expected the fake marriage to trigger an uncontrollable obsession.',
    poster: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
    genres: ['Romance', 'Billionaire', 'Drama'],
    totalEpisodes: 7,
    status: 'completed',
    featured: false,
    trending: false,
    popularRank: 4,
    viewsCount: 750000,
    rating: 4.7,
    releaseYear: 2026,
    tags: ['Contract Marriage', 'Cold CEO', 'Sweet Romance'],
  },
  {
    id: 'drama-rebirth-starlight-queen',
    title: 'Rebirth of the Starlight Queen',
    description: 'Betrayed by her fiancé and stepsister, top actress Scarlett dies in a staged accident—only to wake up five years earlier at the premiere of her debut film. This time, she will rewrite the script.',
    poster: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=80',
    genres: ['Revenge', 'Suspense', 'Drama'],
    totalEpisodes: 6,
    status: 'ongoing',
    featured: false,
    trending: true,
    popularRank: 5,
    viewsCount: 1120000,
    rating: 4.85,
    releaseYear: 2026,
    tags: ['Rebirth', 'Showbiz', 'Revenge'],
  },
  {
    id: 'drama-undercover-billionaire-slums',
    title: 'Undercover Tycoon in the Slums',
    description: 'He was tasked with evaluating his grandfather’s newest real estate sector undercover. Living among tenants who despise the corporate landlord, he falls for the community organizer leading the protest.',
    poster: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=80',
    genres: ['Romance', 'Billionaire', 'Drama'],
    totalEpisodes: 6,
    status: 'completed',
    featured: false,
    trending: false,
    popularRank: 6,
    viewsCount: 620000,
    rating: 4.6,
    releaseYear: 2026,
    tags: ['Undercover', 'Opposites Attract', 'Urban'],
  },
  {
    id: 'drama-silent-vendetta-ceo',
    title: 'Silent Vendetta: The CEO’s Wrath',
    description: 'Falsely imprisoned for 3 years to take the fall for his corrupt cousin, Marcus walked out of federal lockup straight into the board meeting with undeniable evidence and billionaire backing.',
    poster: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    genres: ['Billionaire', 'Revenge', 'Suspense'],
    totalEpisodes: 8,
    status: 'ongoing',
    featured: true,
    trending: true,
    popularRank: 7,
    viewsCount: 1890000,
    rating: 4.92,
    releaseYear: 2026,
    tags: ['Vendetta', 'Billionaire', 'Courtroom Drama'],
  },
  {
    id: 'drama-dangerous-love-syndicate',
    title: 'Dangerous Love: The Bodyguard Vow',
    description: 'Assigned to protect the rebellious daughter of the city’s shipping baron, elite operative Roman discovers an assassination conspiracy targeting them both from inside her own penthouse.',
    poster: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    genres: ['Romance', 'Action', 'Suspense'],
    totalEpisodes: 7,
    status: 'ongoing',
    featured: false,
    trending: true,
    popularRank: 8,
    viewsCount: 1340000,
    rating: 4.88,
    releaseYear: 2026,
    tags: ['Bodyguard', 'Forbidden Love', 'Thriller'],
  },
];

export const SAMPLE_DRAMAS: Drama[] = RAW_DRAMAS.map((drama) => ({
  ...drama,
  coverImage: drama.poster,
  episodes: generateEpisodesForDrama(drama.id, drama.title, drama.totalEpisodes, drama.poster),
}));
