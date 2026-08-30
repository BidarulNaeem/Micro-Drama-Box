import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film,
  Plus,
  Trash2,
  Edit,
  Play,
  ArrowLeft,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Layers,
  Video,
  Image as ImageIcon,
  Flame,
  Star,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  X,
  Volume2,
  Lock,
  LogOut,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { Drama, Episode } from '../../types';
import { firestoreDramaService } from '../../services/firestoreDramaService';
import { db, testFirestoreConnection } from '../../services/firebase';
import { R2_TEST_EPISODE_1_URL } from '../../data/sampleDramas';
import { adminAuthService } from '../../services/adminAuthService';

interface AdminPanelProps {
  onBackToApp: () => void;
  onHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'selection' | 'success') => void;
}

const AVAILABLE_GENRES = [
  'Romance',
  'Billionaire',
  'Revenge',
  'Action',
  'Suspense',
  'Drama',
  'Urban',
  'CEO',
  'Fantasy',
  'Mystery',
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToApp, onHaptic }) => {
  const [activeTab, setActiveTab] = useState<'dramas' | 'episodes' | 'database'>('dramas');
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [selectedDramaId, setSelectedDramaId] = useState<string>('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Drama Modal State
  const [isDramaModalOpen, setIsDramaModalOpen] = useState(false);
  const [editingDrama, setEditingDrama] = useState<Drama | null>(null);
  const [dramaFormData, setDramaFormData] = useState({
    title: '',
    description: '',
    poster: '',
    backdrop: '',
    genres: ['Romance', 'Billionaire'],
    status: 'ongoing' as 'ongoing' | 'completed',
    featured: false,
    trending: true,
    rating: 4.9,
    tags: 'R2 Stream, Contract Marriage',
  });

  // Episode Modal State
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [episodeFormData, setEpisodeFormData] = useState({
    dramaId: '',
    episodeNumber: 1,
    title: '',
    description: '',
    videoSource: R2_TEST_EPISODE_1_URL,
    thumbnail: '',
    duration: 104,
    freeToWatch: true,
  });

  // Inline Video Tester
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Subscribe to all dramas in real-time
  useEffect(() => {
    setIsLoading(true);
    testFirestoreConnection().then((connected) => setIsConnected(connected));

    const unsubscribe = firestoreDramaService.subscribeAllDramas((liveDramas) => {
      setDramas(liveDramas);
      setIsLoading(false);
      if (!selectedDramaId && liveDramas.length > 0) {
        setSelectedDramaId(liveDramas[0].id);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to episodes when selectedDramaId changes
  useEffect(() => {
    if (!selectedDramaId) {
      setEpisodes([]);
      return;
    }
    const unsubscribe = firestoreDramaService.subscribeEpisodes(selectedDramaId, (liveEpisodes) => {
      setEpisodes(liveEpisodes);
    });
    return () => unsubscribe();
  }, [selectedDramaId]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    onHaptic?.(type === 'success' ? 'success' : 'heavy');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Admin PIN Security State
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  const handleLogoutAdmin = () => {
    adminAuthService.logout();
    onHaptic?.('light');
    onBackToApp();
  };

  const handleChangeMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput !== confirmPinInput) {
      showFeedback('error', 'New PIN and confirmation do not match.');
      return;
    }
    if (newPinInput.length < 4) {
      showFeedback('error', 'New PIN must be at least 4 digits.');
      return;
    }

    const res = adminAuthService.changePin(currentPinInput, newPinInput);
    if (res.success) {
      showFeedback('success', res.message);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setIsChangingPin(false);
    } else {
      showFeedback('error', res.message);
    }
  };

  const handleResetDefaultPin = () => {
    if (window.confirm('Reset Master PIN back to default (76523888)?')) {
      adminAuthService.resetToDefaultPin();
      showFeedback('success', 'Master PIN reset to default: 76523888');
    }
  };

  // Open Create Drama Modal
  const handleOpenCreateDrama = () => {
    setEditingDrama(null);
    setDramaFormData({
      title: '',
      description: '',
      poster: '',
      backdrop: '',
      genres: ['Romance', 'Billionaire'],
      status: 'ongoing',
      featured: false,
      trending: true,
      rating: 4.9,
      tags: 'R2 Stream, Drama, HD',
    });
    setIsDramaModalOpen(true);
  };

  // Open Edit Drama Modal
  const handleOpenEditDrama = (drama: Drama) => {
    setEditingDrama(drama);
    setDramaFormData({
      title: drama.title,
      description: drama.description,
      poster: drama.coverImage || drama.poster,
      backdrop: drama.backdrop || drama.coverImage || drama.poster,
      genres: drama.genres || ['Drama'],
      status: drama.status || 'ongoing',
      featured: Boolean(drama.featured),
      trending: Boolean(drama.trending),
      rating: drama.rating || 4.9,
      tags: (drama.tags || []).join(', '),
    });
    setIsDramaModalOpen(true);
  };

  // Submit Drama
  const handleSaveDrama = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dramaFormData.title.trim() || !dramaFormData.poster.trim()) {
      showFeedback('error', 'Please provide a title and poster image URL.');
      return;
    }

    try {
      const tagsArray = dramaFormData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const dramaId = await firestoreDramaService.saveDrama({
        id: editingDrama?.id,
        title: dramaFormData.title,
        description: dramaFormData.description,
        coverImage: dramaFormData.poster.trim(),
        poster: dramaFormData.poster.trim(),
        backdrop: dramaFormData.backdrop?.trim() || dramaFormData.poster.trim(),
        genres: dramaFormData.genres,
        status: dramaFormData.status,
        featured: dramaFormData.featured,
        trending: dramaFormData.trending,
        rating: Number(dramaFormData.rating) || 4.9,
        tags: tagsArray,
      });

      setIsDramaModalOpen(false);
      setSelectedDramaId(dramaId);
      showFeedback('success', `Drama "${dramaFormData.title}" successfully saved to Firestore!`);
    } catch (err: any) {
      showFeedback('error', `Failed to save drama: ${err.message || 'Error'}`);
    }
  };

  // Delete Drama
  const handleDeleteDrama = async (drama: Drama) => {
    if (!window.confirm(`Are you sure you want to delete "${drama.title}" and all its episodes from Firestore?`)) {
      return;
    }
    try {
      await firestoreDramaService.deleteDrama(drama.id);
      showFeedback('success', `Drama "${drama.title}" deleted.`);
      if (selectedDramaId === drama.id) {
        const remaining = dramas.filter((d) => d.id !== drama.id);
        setSelectedDramaId(remaining[0]?.id || '');
      }
    } catch (err: any) {
      showFeedback('error', `Delete failed: ${err.message}`);
    }
  };

  // Open Create Episode Modal
  const handleOpenCreateEpisode = (targetDramaId?: string) => {
    const dramaIdToUse = targetDramaId || selectedDramaId || dramas[0]?.id || '';
    const nextEpNum = (episodes.length > 0 ? Math.max(...episodes.map((e) => e.episodeNumber)) : 0) + 1;

    setEditingEpisode(null);
    setEpisodeFormData({
      dramaId: dramaIdToUse,
      episodeNumber: nextEpNum,
      title: `Episode ${String(nextEpNum).padStart(2, '0')}: New Chapter`,
      description: `In episode ${nextEpNum}, unexpected events unfold in dramatic fashion.`,
      videoSource: R2_TEST_EPISODE_1_URL,
      thumbnail: '',
      duration: 104,
      freeToWatch: true,
    });
    setIsEpisodeModalOpen(true);
  };

  // Open Edit Episode Modal
  const handleOpenEditEpisode = (ep: Episode) => {
    setEditingEpisode(ep);
    setEpisodeFormData({
      dramaId: ep.dramaId,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
      description: ep.description,
      videoSource: ep.videoSource,
      thumbnail: ep.thumbnailUrl || ep.thumbnail || '',
      duration: ep.duration,
      freeToWatch: ep.freeToWatch,
    });
    setIsEpisodeModalOpen(true);
  };

  // Submit Episode
  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!episodeFormData.dramaId || !episodeFormData.videoSource.trim()) {
      showFeedback('error', 'Drama target and Video Source URL are required.');
      return;
    }

    try {
      await firestoreDramaService.saveEpisode(episodeFormData.dramaId, {
        id: editingEpisode?.id,
        episodeNumber: Number(episodeFormData.episodeNumber),
        title: episodeFormData.title,
        description: episodeFormData.description,
        videoSource: episodeFormData.videoSource.trim(),
        thumbnail: episodeFormData.thumbnail.trim(),
        thumbnailUrl: episodeFormData.thumbnail.trim(),
        duration: Number(episodeFormData.duration) || 75,
        freeToWatch: episodeFormData.freeToWatch,
      });

      setIsEpisodeModalOpen(false);
      showFeedback('success', `Episode ${episodeFormData.episodeNumber} saved to Firestore!`);
    } catch (err: any) {
      showFeedback('error', `Failed to save episode: ${err.message}`);
    }
  };

  // Delete Episode
  const handleDeleteEpisode = async (ep: Episode) => {
    if (!window.confirm(`Delete Episode ${ep.episodeNumber} (${ep.title})?`)) return;
    try {
      await firestoreDramaService.deleteEpisode(ep.dramaId, ep.id);
      showFeedback('success', `Episode ${ep.episodeNumber} deleted.`);
    } catch (err: any) {
      showFeedback('error', `Failed to delete episode: ${err.message}`);
    }
  };

  // Seed sample database
  const handleSeedDatabase = async () => {
    if (!window.confirm('Populate/Reset Firestore with standard sample dramas and Cloudflare R2 test streams?')) return;
    try {
      setIsLoading(true);
      const count = await firestoreDramaService.seedAllSampleData();
      setIsLoading(false);
      showFeedback('success', `Successfully seeded ${count} sample dramas with Cloudflare R2 episodes into Firestore!`);
    } catch (err: any) {
      setIsLoading(false);
      showFeedback('error', `Seeding failed: ${err.message}`);
    }
  };

  const currentSelectedDrama = dramas.find((d) => d.id === selectedDramaId);

  return (
    <div className="min-h-screen bg-[#08090c] text-white flex flex-col antialiased selection:bg-rose-500 selection:text-white pb-20">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-30 bg-[#0d0f15]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              id="admin-back-to-app-btn"
              onClick={onBackToApp}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white/90 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Back to App</span>
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center">
                  <Sliders className="w-3.5 h-3.5 text-white" />
                </div>
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight font-display text-white">
                  VELA Admin Panel
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Firestore Live
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Live Firestore Connection Status */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden md:inline font-mono text-[11px]">vela-drama-8f277</span>
              <span className="md:hidden text-[11px]">Live</span>
            </div>

            <button
              id="admin-quick-add-drama-btn"
              onClick={handleOpenCreateDrama}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center space-x-1 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Drama</span>
            </button>

            {/* Lock / Exit Admin Button */}
            <button
              id="admin-lock-exit-btn"
              onClick={handleLogoutAdmin}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-rose-600/20 hover:border-rose-500/40 border border-white/10 active:scale-95 text-white/70 hover:text-rose-300 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Lock Admin & Return to App"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Lock / Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Feedback Toast Notification */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl border shadow-2xl flex items-center space-x-2 text-xs font-bold backdrop-blur-md ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="w-full max-w-5xl mx-auto px-4 pt-4 space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
          <button
            id="tab-dramas"
            onClick={() => setActiveTab('dramas')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'dramas'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Dramas Catalog ({dramas.length})</span>
          </button>

          <button
            id="tab-episodes"
            onClick={() => setActiveTab('episodes')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'episodes'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Episodes Studio</span>
          </button>

          <button
            id="tab-database"
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'database'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Firestore Tools</span>
          </button>
        </div>

        {/* TAB 1: DRAMAS CATALOG */}
        {activeTab === 'dramas' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
              <div>
                <h2 className="text-base font-bold text-white">Live Firestore Dramas</h2>
                <p className="text-xs text-white/50">
                  Real-time database sync with collection <code className="text-rose-400 font-mono">/dramas</code>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="admin-add-drama-card-btn"
                  onClick={handleOpenCreateDrama}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Drama</span>
                </button>
              </div>
            </div>

            {/* Drama Grid Cards */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                <p className="text-xs text-white/50">Connecting to Firestore...</p>
              </div>
            ) : dramas.length === 0 ? (
              <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
                <Film className="w-10 h-10 text-white/30 mx-auto" />
                <p className="text-sm font-bold text-white">No dramas found in Firestore</p>
                <p className="text-xs text-white/50 max-w-sm mx-auto">
                  Click below to populate the initial catalogue with Cloudflare R2 test videos, or create your first drama.
                </p>
                <div className="pt-2 flex justify-center space-x-3">
                  <button
                    onClick={handleSeedDatabase}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center space-x-1.5"
                  >
                    <Database className="w-4 h-4 text-rose-400" />
                    <span>Seed Demo Dramas</span>
                  </button>
                  <button
                    onClick={handleOpenCreateDrama}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                  >
                    Create Custom Drama
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dramas.map((drama) => (
                  <div
                    key={drama.id}
                    className="p-4 rounded-2xl bg-[#11131a] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex space-x-3.5">
                      {/* Poster */}
                      <div className="w-20 aspect-[2/3] rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 relative">
                        <img
                          src={drama.coverImage || drama.poster}
                          alt={drama.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {drama.featured && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-rose-600 text-[9px] font-black uppercase text-white">
                            Hero
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-extrabold text-white truncate pr-2">
                            {drama.title}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-white/10 text-white/70 shrink-0">
                            {drama.status}
                          </span>
                        </div>

                        <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                          {drama.description}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {drama.genres.map((g) => (
                            <span
                              key={g}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70"
                            >
                              {g}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center space-x-3 text-[11px] text-white/40 pt-1">
                          <span className="flex items-center space-x-1">
                            <Video className="w-3 h-3 text-rose-400" />
                            <span>{drama.totalEpisodes} Episodes</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>{drama.rating}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <button
                        id={`manage-episodes-btn-${drama.id}`}
                        onClick={() => {
                          setSelectedDramaId(drama.id);
                          setActiveTab('episodes');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Manage Episodes</span>
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          id={`edit-drama-btn-${drama.id}`}
                          onClick={() => handleOpenEditDrama(drama)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 active:scale-95 transition-all"
                          title="Edit Drama"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-drama-btn-${drama.id}`}
                          onClick={() => handleDeleteDrama(drama)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 active:scale-95 transition-all"
                          title="Delete Drama"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EPISODES STUDIO */}
        {activeTab === 'episodes' && (
          <div className="space-y-5">
            {/* Drama Picker Header */}
            <div className="p-4 rounded-2xl bg-[#11131a] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                  Select Drama Series:
                </label>
                <div className="flex items-center space-x-3">
                  <select
                    id="admin-drama-select"
                    value={selectedDramaId}
                    onChange={(e) => setSelectedDramaId(e.target.value)}
                    className="bg-[#181b24] border border-white/20 text-white text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-rose-500 transition-all cursor-pointer"
                  >
                    {dramas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.totalEpisodes} eps)
                      </option>
                    ))}
                  </select>

                  {currentSelectedDrama && (
                    <span className="text-xs text-white/60 hidden sm:inline">
                      Status: <strong className="text-white capitalize">{currentSelectedDrama.status}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="admin-add-episode-btn"
                  onClick={() => handleOpenCreateEpisode(selectedDramaId)}
                  disabled={!selectedDramaId}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Episode</span>
                </button>
              </div>
            </div>

            {/* Video Stream Preview Panel if active */}
            {previewVideoUrl && (
              <div className="p-4 rounded-2xl bg-black/80 border border-rose-500/30 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-rose-400">
                    <Play className="w-4 h-4 fill-rose-400" />
                    <span>Stream Tester Preview</span>
                  </div>
                  <button
                    onClick={() => setPreviewVideoUrl(null)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="aspect-[9/16] max-w-[240px] mx-auto rounded-xl overflow-hidden bg-black border border-white/20 shadow-2xl">
                  <video
                    src={previewVideoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[11px] text-white/50 text-center font-mono truncate">
                  {previewVideoUrl}
                </p>
              </div>
            )}

            {/* Episode List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-white">
                  Episodes in "{currentSelectedDrama?.title || 'Selected Drama'}" ({episodes.length})
                </h3>
                <span className="text-xs text-white/50 font-mono">
                  /dramas/{selectedDramaId}/episodes
                </span>
              </div>

              {episodes.length === 0 ? (
                <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
                  <Video className="w-8 h-8 text-white/30 mx-auto" />
                  <p className="text-sm font-bold text-white">No episodes in this drama yet</p>
                  <p className="text-xs text-white/50">
                    Add Episode 1 pointing to your Cloudflare R2 bucket video stream URL.
                  </p>
                  <button
                    onClick={() => handleOpenCreateEpisode(selectedDramaId)}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs inline-flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Episode 1 (R2 Stream)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {episodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="p-3.5 rounded-2xl bg-[#11131a] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                          <img
                            src={ep.thumbnailUrl || ep.thumbnail || currentSelectedDrama?.coverImage || currentSelectedDrama?.poster}
                            alt={ep.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <span className="text-[10px] font-black text-white bg-black/60 px-1 py-0.5 rounded backdrop-blur-xs">
                              {String(ep.episodeNumber).padStart(2, '0')}
                            </span>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {ep.title}
                          </h4>
                          <p className="text-[11px] text-white/50 truncate font-mono max-w-xs sm:max-w-md">
                            {ep.videoSource}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-white/40 pt-0.5">
                            <span>{Math.floor(ep.duration / 60)}m {ep.duration % 60}s</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">Free Access</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          id={`test-stream-btn-${ep.episodeNumber}`}
                          onClick={() => setPreviewVideoUrl(ep.videoSource)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer"
                          title="Preview Stream"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span className="hidden sm:inline text-[11px]">Preview</span>
                        </button>

                        <button
                          id={`edit-episode-btn-${ep.episodeNumber}`}
                          onClick={() => handleOpenEditEpisode(ep)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 active:scale-95"
                          title="Edit Episode"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          id={`delete-episode-btn-${ep.episodeNumber}`}
                          onClick={() => handleDeleteEpisode(ep)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 active:scale-95"
                          title="Delete Episode"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FIRESTORE DATABASE TOOLS */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#11131a] border border-white/10 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                  <Database className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google Firestore Configuration</h3>
                  <p className="text-xs text-white/50 font-mono">Project ID: vela-drama-8f277</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-white/40 font-medium">Auth Domain</span>
                  <p className="font-mono text-white font-semibold">vela-drama-8f277.firebaseapp.com</p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-white/40 font-medium">Storage Bucket</span>
                  <p className="font-mono text-white font-semibold">vela-drama-8f277.firebasestorage.app</p>
                </div>
              </div>

              {/* Seed / Reset Actions */}
              <div className="pt-3 border-t border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Actions</h4>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    id="admin-seed-dramas-btn"
                    onClick={handleSeedDatabase}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Seed Demo Dramas & Cloudflare R2 Stream</span>
                  </button>

                  <button
                    onClick={async () => {
                      const ok = await testFirestoreConnection();
                      setIsConnected(ok);
                      showFeedback(ok ? 'success' : 'error', ok ? 'Firestore connection probe successful!' : 'Connection probe failed.');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Test Connection Probe</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Admin PIN Security & Protection Settings */}
            <div className="p-5 rounded-2xl bg-[#11131a] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Admin Access Protection</h3>
                    <p className="text-xs text-white/50">Manage the Master PIN required to unlock this panel</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>PIN Protected</span>
                </span>
              </div>

              {!isChangingPin ? (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-white/70 space-y-0.5">
                    <p className="font-semibold text-white">Current Access Policy:</p>
                    <p className="text-white/50">Master PIN required before opening admin dashboard</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      id="admin-change-pin-btn"
                      onClick={() => setIsChangingPin(true)}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                      <span>Change Master PIN</span>
                    </button>
                    <button
                      onClick={handleResetDefaultPin}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-white/50 hover:text-white text-xs font-semibold"
                    >
                      Reset Default (76523888)
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangeMasterPin} className="space-y-3 pt-2 border-t border-white/5">
                  <h4 className="text-xs font-bold text-rose-400">Update Master PIN</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-white/70">Current PIN</label>
                      <input
                        type="password"
                        required
                        maxLength={8}
                        value={currentPinInput}
                        onChange={(e) => setCurrentPinInput(e.target.value)}
                        placeholder="Current PIN"
                        className="w-full bg-[#181b24] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-white/70">New PIN (min 4 digits)</label>
                      <input
                        type="password"
                        required
                        maxLength={8}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="New PIN"
                        className="w-full bg-[#181b24] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-white/70">Confirm New PIN</label>
                      <input
                        type="password"
                        required
                        maxLength={8}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="Confirm PIN"
                        className="w-full bg-[#181b24] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPin(false);
                        setCurrentPinInput('');
                        setNewPinInput('');
                        setConfirmPinInput('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer"
                    >
                      Save New PIN
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* CREATE / EDIT DRAMA MODAL */}
      <AnimatePresence>
        {isDramaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDramaModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg bg-[#11131a] rounded-3xl border border-white/15 p-6 space-y-4 shadow-2xl text-white max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-base font-extrabold font-display">
                  {editingDrama ? 'Edit Drama' : 'Add New Drama'}
                </h3>
                <button
                  onClick={() => setIsDramaModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDrama} className="space-y-3.5">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/80">Drama Title *</label>
                  <input
                    id="drama-form-title"
                    type="text"
                    required
                    placeholder="e.g. A Vow of Joy and Sorrow"
                    value={dramaFormData.title}
                    onChange={(e) => setDramaFormData({ ...dramaFormData, title: e.target.value })}
                    className="w-full bg-[#181b24] border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                  />
                </div>

                {/* Poster URL & Preview */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/80">Cover Image / Poster URL *</label>
                  <div className="flex space-x-2">
                    <input
                      id="drama-form-poster"
                      type="url"
                      required
                      placeholder="https://..."
                      value={dramaFormData.poster}
                      onChange={(e) => setDramaFormData({ ...dramaFormData, poster: e.target.value })}
                      className="flex-1 bg-[#181b24] border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono"
                    />
                    {dramaFormData.poster && (
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-white/20 shrink-0">
                        <img
                          src={dramaFormData.poster}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/80">Description / Synopsis *</label>
                  <textarea
                    id="drama-form-description"
                    rows={3}
                    required
                    placeholder="Synopsis of the short drama series..."
                    value={dramaFormData.description}
                    onChange={(e) => setDramaFormData({ ...dramaFormData, description: e.target.value })}
                    className="w-full bg-[#181b24] border border-white/15 focus:border-rose-500 rounded-xl p-3 text-xs text-white outline-none leading-relaxed"
                  />
                </div>

                {/* Genre Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80">Genres</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_GENRES.map((g) => {
                      const isSelected = dramaFormData.genres.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            const next = isSelected
                              ? dramaFormData.genres.filter((x) => x !== g)
                              : [...dramaFormData.genres, g];
                            setDramaFormData({ ...dramaFormData, genres: next.length > 0 ? next : ['Drama'] });
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-600 text-white'
                              : 'bg-white/5 hover:bg-white/10 text-white/60'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status & Featured */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/80">Status</label>
                    <select
                      value={dramaFormData.status}
                      onChange={(e) =>
                        setDramaFormData({
                          ...dramaFormData,
                          status: e.target.value as 'ongoing' | 'completed',
                        })
                      }
                      className="w-full bg-[#181b24] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end space-y-2">
                    <label className="flex items-center space-x-2 text-xs font-bold text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dramaFormData.featured}
                        onChange={(e) => setDramaFormData({ ...dramaFormData, featured: e.target.checked })}
                        className="rounded border-white/20 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Featured in Hero</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs font-bold text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dramaFormData.trending}
                        onChange={(e) => setDramaFormData({ ...dramaFormData, trending: e.target.checked })}
                        className="rounded border-white/20 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Trending Carousel</span>
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-3 flex items-center justify-end space-x-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsDramaModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-save-drama-btn"
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    Save to Firestore
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT EPISODE MODAL */}
      <AnimatePresence>
        {isEpisodeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEpisodeModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg bg-[#11131a] rounded-3xl border border-white/15 p-6 space-y-4 shadow-2xl text-white max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-base font-extrabold font-display">
                  {editingEpisode ? `Edit Episode ${editingEpisode.episodeNumber}` : 'Add New Episode'}
                </h3>
                <button
                  onClick={() => setIsEpisodeModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEpisode} className="space-y-3.5">
                {/* Drama Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/80">Belongs to Drama *</label>
                  <select
                    id="episode-form-dramaId"
                    value={episodeFormData.dramaId}
                    onChange={(e) => setEpisodeFormData({ ...episodeFormData, dramaId: e.target.value })}
                    className="w-full bg-[#181b24] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    {dramas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Episode Number & Title */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-1">
                    <label className="text-xs font-bold text-white/80">Ep # *</label>
                    <input
                      id="episode-form-number"
                      type="number"
                      min={1}
                      required
                      value={episodeFormData.episodeNumber}
                      onChange={(e) =>
                        setEpisodeFormData({
                          ...episodeFormData,
                          episodeNumber: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full bg-[#181b24] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-bold text-center outline-none"
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-white/80">Episode Title</label>
                    <input
                      id="episode-form-title"
                      type="text"
                      placeholder="e.g. Episode 01: The Prelude"
                      value={episodeFormData.title}
                      onChange={(e) => setEpisodeFormData({ ...episodeFormData, title: e.target.value })}
                      className="w-full bg-[#181b24] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {/* R2 Video URL */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white/80">Cloudflare R2 / MP4 Video URL *</label>
                    <button
                      type="button"
                      onClick={() => setEpisodeFormData({ ...episodeFormData, videoSource: R2_TEST_EPISODE_1_URL })}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline"
                    >
                      Insert Sample R2 URL
                    </button>
                  </div>
                  <input
                    id="episode-form-videoSource"
                    type="url"
                    required
                    placeholder="https://pub-....r2.dev/video.mp4"
                    value={episodeFormData.videoSource}
                    onChange={(e) => setEpisodeFormData({ ...episodeFormData, videoSource: e.target.value })}
                    className="w-full bg-[#181b24] border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>

                {/* Thumbnail URL & Live Preview */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/80">Episode Thumbnail URL (Optional)</label>
                  <div className="flex space-x-2">
                    <input
                      id="episode-form-thumbnail"
                      type="url"
                      placeholder="https://... (Leave empty to use Drama Cover)"
                      value={episodeFormData.thumbnail}
                      onChange={(e) => setEpisodeFormData({ ...episodeFormData, thumbnail: e.target.value })}
                      className="flex-1 bg-[#181b24] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                    <div className="w-14 h-10 rounded-xl overflow-hidden bg-black border border-white/20 shrink-0 relative">
                      <img
                        src={episodeFormData.thumbnail || currentSelectedDrama?.coverImage || currentSelectedDrama?.poster}
                        alt="Thumb Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {!episodeFormData.thumbnail && (
                        <span className="absolute bottom-0 inset-x-0 text-[8px] font-black text-center bg-black/70 text-white/80">
                          Cover
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40">
                    If left empty, this episode will automatically use the drama's cover image.
                  </p>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/80">Duration (Seconds)</label>
                  <input
                    id="episode-form-duration"
                    type="number"
                    min={10}
                    value={episodeFormData.duration}
                    onChange={(e) =>
                      setEpisodeFormData({
                        ...episodeFormData,
                        duration: parseInt(e.target.value, 10) || 60,
                      })
                    }
                    className="w-full bg-[#181b24] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-3 flex items-center justify-end space-x-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEpisodeModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-save-episode-btn"
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    Save Episode to Firestore
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
