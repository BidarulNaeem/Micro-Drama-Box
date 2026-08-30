import React, { useState, useEffect, useCallback } from 'react';
import { Drama, MainTab, UserProgress } from './types';
import { dramaRepository } from './repositories/dramaRepository';
import { userProgressRepository } from './repositories/userProgressRepository';
import { useTelegram } from './hooks/useTelegram';

import { Header } from './components/common/Header';
import { NotificationsModal } from './components/common/NotificationsModal';
import { BottomNav } from './components/navigation/BottomNav';
import { HeroFeatured, HeroFeaturedSkeleton } from './components/home/HeroFeatured';
import { GenrePillFilter } from './components/home/GenrePillFilter';
import { ContinueWatchingRow } from './components/home/ContinueWatchingRow';
import { DramaSectionRow, DramaSectionRowSkeleton } from './components/home/DramaSectionRow';

import { DramaDetailModal } from './components/drama/DramaDetailModal';
import { SearchModal } from './components/search/SearchModal';
import { VerticalEpisodeFeed } from './components/player/VerticalEpisodeFeed';
import { ForYouView } from './components/foryou/ForYouView';
import { MyShowsView } from './components/myshows/MyShowsView';
import { ProfileView } from './components/profile/ProfileView';
import { AdminPanel } from './components/admin/AdminPanel';
import { AdminPinModal } from './components/admin/AdminPinModal';
import { adminAuthService } from './services/adminAuthService';
import { adService } from './services/adService';

export default function App() {
  const { isTelegram, user, triggerHaptic, registerBackButton } = useTelegram();

  // Initialize Monetag In-App Interstitial on App Load
  useEffect(() => {
    adService.initInAppInterstitial();
  }, []);

  // Admin PIN Protection & Route State
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const isAdmRoute =
        window.location.pathname === '/admin' ||
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin' ||
        window.location.search.includes('admin=true');
      return isAdmRoute && adminAuthService.isAuthenticated();
    }
    return false;
  });

  // Listen to popstate / hashchange for admin route navigation & challenge unauthenticated access
  useEffect(() => {
    const checkRoute = () => {
      const isAdmRoute =
        window.location.pathname === '/admin' ||
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin' ||
        window.location.search.includes('admin=true');

      if (isAdmRoute) {
        if (adminAuthService.isAuthenticated()) {
          setIsAdminMode(true);
          setIsAdminPinModalOpen(false);
        } else {
          setIsAdminMode(false);
          setIsAdminPinModalOpen(true);
        }
      } else {
        setIsAdminMode(false);
        setIsAdminPinModalOpen(false);
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  const handleOpenAdmin = () => {
    triggerHaptic('medium');
    if (adminAuthService.isAuthenticated()) {
      setIsAdminMode(true);
      try {
        window.history.pushState({ page: 'admin' }, '', '/admin');
      } catch {}
    } else {
      setIsAdminPinModalOpen(true);
    }
  };

  const handleAdminPinSuccess = () => {
    setIsAdminPinModalOpen(false);
    setIsAdminMode(true);
    try {
      window.history.pushState({ page: 'admin' }, '', '/admin');
    } catch {}
  };

  const handleAdminPinCancel = () => {
    setIsAdminPinModalOpen(false);
    setIsAdminMode(false);
    try {
      if (
        window.location.pathname === '/admin' ||
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin'
      ) {
        window.history.pushState({ page: 'home' }, '', '/');
      }
    } catch {}
  };

  const handleCloseAdmin = () => {
    triggerHaptic('light');
    setIsAdminMode(false);
    try {
      window.history.pushState({ page: 'home' }, '', '/');
    } catch {}
    loadData();
  };

  // Navigation State
  const [currentTab, setCurrentTab] = useState<MainTab>('discover');
  const [selectedGenre, setSelectedGenre] = useState('All');

  // Data State
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [featuredDramas, setFeaturedDramas] = useState<Drama[]>([]);
  const [trendingDramas, setTrendingDramas] = useState<Drama[]>([]);
  const [popularDramas, setPopularDramas] = useState<Drama[]>([]);
  const [newReleases, setNewReleases] = useState<Drama[]>([]);
  const [forYouDramas, setForYouDramas] = useState<Drama[]>([]);
  const [allDramas, setAllDramas] = useState<Drama[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<UserProgress[]>([]);
  const [savedDramaIds, setSavedDramaIds] = useState<Set<string>>(new Set());

  // Modal / Playback Overlay State
  const [selectedDramaForDetail, setSelectedDramaForDetail] = useState<Drama | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activePlayback, setActivePlayback] = useState<{
    drama: Drama;
    episodeNumber: number;
  } | null>(null);

  // Load Catalog Data & Subscribe to Live Firestore Updates
  const processDramasUpdate = useCallback(async (dramas: Drama[]) => {
    if (!dramas) return;
    setAllDramas(dramas);
    setFeaturedDramas(dramas.filter((d) => d.featured));
    setTrendingDramas(dramas.filter((d) => d.trending));
    setPopularDramas([...dramas].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)));
    setNewReleases([...dramas].sort((a, b) => b.releaseYear - a.releaseYear));
    setForYouDramas([...dramas].sort(() => 0.5 - Math.random()));

    const genreList = await dramaRepository.getGenres();
    setGenres(genreList);
    setIsLoadingCatalog(false);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [all, history, myShows] = await Promise.all([
        dramaRepository.getAllDramas(),
        userProgressRepository.getAllHistory(),
        userProgressRepository.getMyShows(),
      ]);

      if (all && all.length > 0) {
        processDramasUpdate(all);
      }
      setWatchHistory(history);
      setSavedDramaIds(new Set(myShows.map((s) => s.dramaId)));
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [processDramasUpdate]);


  useEffect(() => {
    loadData();

    // Subscribe to real-time updates from Firestore
    const unsubscribe = dramaRepository.subscribeAll((liveDramas) => {
      processDramasUpdate(liveDramas);
    });

    return () => unsubscribe();
  }, [loadData, processDramasUpdate]);

  // Synchronize Telegram Native BackButton
  useEffect(() => {
    if (isAdminMode) {
      registerBackButton(true, handleCloseAdmin);
    } else if (activePlayback) {
      registerBackButton(true, () => {
        setActivePlayback(null);
        loadData();
      });
    } else if (selectedDramaForDetail) {
      registerBackButton(true, () => {
        setSelectedDramaForDetail(null);
      });
    } else if (isNotificationsOpen) {
      registerBackButton(true, () => {
        setIsNotificationsOpen(false);
      });
    } else if (isSearchOpen) {
      registerBackButton(true, () => {
        setIsSearchOpen(false);
      });
    } else {
      registerBackButton(false);
    }
  }, [isAdminMode, activePlayback, selectedDramaForDetail, isNotificationsOpen, isSearchOpen, registerBackButton, loadData]);

  // Handlers
  const handleStartWatch = (drama: Drama, episodeNumber: number = 1) => {
    triggerHaptic('medium');
    setActivePlayback({
      drama,
      episodeNumber,
    });
  };

  const handleClosePlayback = () => {
    triggerHaptic('light');
    setActivePlayback(null);
    loadData();
  };

  const handleToggleSaveDrama = async (drama: Drama) => {
    const isAdded = await userProgressRepository.toggleMyShow(drama.id);
    setSavedDramaIds((prev) => {
      const next = new Set(prev);
      if (isAdded) next.add(drama.id);
      else next.delete(drama.id);
      return next;
    });
    triggerHaptic(isAdded ? 'success' : 'light');
  };

  const handleSelectDramaById = (dramaId: string) => {
    const found = allDramas.find((d) => d.id === dramaId);
    if (found) {
      setSelectedDramaForDetail(found);
    }
  };

  // Filtered Dramas for Discover Tab based on selected genre
  const displayTrending =
    selectedGenre === 'All'
      ? trendingDramas
      : trendingDramas.filter((d) => d.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()));

  const displayPopular =
    selectedGenre === 'All'
      ? popularDramas
      : popularDramas.filter((d) => d.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()));

  const displayNewReleases =
    selectedGenre === 'All'
      ? newReleases
      : newReleases.filter((d) => d.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()));

  const heroDrama = featuredDramas[0] || allDramas[0];

  // 1. ADMIN PANEL VIEW (Protected / Accessible via /admin route or button)
  if (isAdminMode) {
    return <AdminPanel onBackToApp={handleCloseAdmin} onHaptic={triggerHaptic} />;
  }

  // 2. FULLSCREEN VERTICAL EPISODE FEED MODE (Native 100dvh viewport)
  if (activePlayback) {
    return (
      <VerticalEpisodeFeed
        drama={activePlayback.drama}
        initialEpisodeNumber={activePlayback.episodeNumber}
        onBack={handleClosePlayback}
        onSelectAnotherDrama={(dramaId) => {
          const found = allDramas.find((d) => d.id === dramaId);
          if (found) {
            setActivePlayback({ drama: found, episodeNumber: 1 });
          }
        }}
        onHaptic={triggerHaptic}
      />
    );
  }

  // 3. MAIN USER APPLICATION VIEW
  return (
    <div className="min-h-screen bg-[#08090c] text-white flex flex-col antialiased selection:bg-rose-500 selection:text-white relative">
      {/* Top Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setCurrentTab('profile')}
        user={user}
      />

      {/* Main Tab Content View */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-3 pb-24 space-y-6">
        {currentTab === 'discover' && (
          <div className="space-y-6">
            {/* Genre Pills */}
            <GenrePillFilter
              genres={genres}
              selectedGenre={selectedGenre}
              onSelectGenre={(g) => {
                setSelectedGenre(g);
                triggerHaptic('selection');
              }}
            />

            {isLoadingCatalog && allDramas.length === 0 ? (
              <>
                <HeroFeaturedSkeleton />
                <DramaSectionRowSkeleton title="Trending Now" />
                <DramaSectionRowSkeleton title="Popular Dramas" />
                <DramaSectionRowSkeleton title="New Releases" />
              </>
            ) : (
              <>
                {/* Hero Featured Section */}
                {heroDrama && (
                  <HeroFeatured
                    drama={heroDrama}
                    onWatch={(d) => handleStartWatch(d, 1)}
                    onDetails={(d) => setSelectedDramaForDetail(d)}
                    isSaved={savedDramaIds.has(heroDrama.id)}
                    onToggleSave={handleToggleSaveDrama}
                  />
                )}

                {/* Continue Watching Carousel */}
                {watchHistory.length > 0 && (
                  <ContinueWatchingRow
                    history={watchHistory}
                    dramas={allDramas}
                    onResume={(drama, epNum) => handleStartWatch(drama, epNum)}
                  />
                )}

                {/* Trending Now Section */}
                <DramaSectionRow
                  title="Trending Now"
                  subtitle="Top ranked dramas today"
                  dramas={displayTrending}
                  showRanking={true}
                  onSelectDrama={(d) => setSelectedDramaForDetail(d)}
                />

                {/* Popular Dramas Section */}
                <DramaSectionRow
                  title="Popular Dramas"
                  subtitle="Most watched this week"
                  dramas={displayPopular}
                  onSelectDrama={(d) => setSelectedDramaForDetail(d)}
                />

                {/* New Releases Section */}
                <DramaSectionRow
                  title="New Releases"
                  subtitle="Freshly premiered episodes"
                  dramas={displayNewReleases}
                  onSelectDrama={(d) => setSelectedDramaForDetail(d)}
                />

                {/* For You Mini Carousel */}
                <DramaSectionRow
                  title="Recommended For You"
                  subtitle="Curated based on your taste"
                  dramas={forYouDramas}
                  onSelectDrama={(d) => setSelectedDramaForDetail(d)}
                />
              </>
            )}
          </div>
        )}


        {currentTab === 'foryou' && (
          <ForYouView
            onStartWatch={(drama, ep) => handleStartWatch(drama, ep || 1)}
            onOpenDetails={(drama) => setSelectedDramaForDetail(drama)}
            onHaptic={triggerHaptic}
          />
        )}

        {currentTab === 'myshows' && (
          <MyShowsView
            onStartWatch={(drama, ep) => handleStartWatch(drama, ep || 1)}
            onOpenDetails={(drama) => setSelectedDramaForDetail(drama)}
            onHaptic={triggerHaptic}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            user={user}
            isTelegram={isTelegram}
            onOpenAdmin={handleOpenAdmin}
            onHaptic={triggerHaptic}
          />
        )}
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onHaptic={triggerHaptic}
        savedCount={savedDramaIds.size}
      />

      {/* Drama Detail Bottom Sheet */}
      <DramaDetailModal
        drama={selectedDramaForDetail}
        isOpen={Boolean(selectedDramaForDetail)}
        onClose={() => setSelectedDramaForDetail(null)}
        onStartWatch={handleStartWatch}
        onHaptic={triggerHaptic}
      />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectDrama={(drama) => setSelectedDramaForDetail(drama)}
        onHaptic={triggerHaptic}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectDrama={handleSelectDramaById}
      />

      {/* Admin Security PIN Verification Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onSuccess={handleAdminPinSuccess}
        onCancel={handleAdminPinCancel}
        onHaptic={triggerHaptic}
      />
    </div>
  );
}
