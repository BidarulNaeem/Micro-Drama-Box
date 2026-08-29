import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Sparkles, Flame, Play, Clock } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'premiere' | 'update' | 'trending';
  dramaId?: string;
  unread: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDrama?: (dramaId: string) => void;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New Episode Released',
    message: 'Shadow Heir: The Dragon Sovereign Ep. 8 is now streaming in full HD.',
    time: '12m ago',
    type: 'premiere',
    dramaId: 'drama-shadow-dragon-heir',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'Trending Romance',
    message: 'Mr. Vance’s Secret Contract Wife hit #1 on the Daily Trending Charts!',
    time: '2h ago',
    type: 'trending',
    dramaId: 'drama-contract-marriage-ceo',
    unread: true,
  },
  {
    id: 'notif-3',
    title: 'New Drama Premiered',
    message: 'Silent Vendetta: The CEO’s Wrath is now available on Vela.',
    time: 'Yesterday',
    type: 'update',
    dramaId: 'drama-silent-vendetta-ceo',
    unread: false,
  },
];

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onSelectDrama,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-sm bg-[#12141c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">Notifications</h3>
                  <p className="text-[11px] text-white/50">Fresh episode updates & alerts</p>
                </div>
              </div>

              <button
                id="close-notifications-btn"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-3 space-y-2 overflow-y-auto no-scrollbar">
              {SAMPLE_NOTIFICATIONS.map((item) => (
                <div
                  key={item.id}
                  id={`notif-item-${item.id}`}
                  onClick={() => {
                    if (item.dramaId && onSelectDrama) {
                      onSelectDrama(item.dramaId);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${
                    item.unread
                      ? 'bg-white/[0.06] border-white/15'
                      : 'bg-white/[0.02] border-white/[0.05] opacity-75'
                  } hover:bg-white/[0.09]`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      {item.type === 'premiere' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                      {item.type === 'trending' && <Flame className="w-3.5 h-3.5 text-rose-500" />}
                      {item.type === 'update' && <Clock className="w-3.5 h-3.5 text-blue-400" />}
                      <span className="text-xs font-bold text-white">{item.title}</span>
                    </div>
                    <span className="text-[10px] text-white/40 tabular-nums shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">{item.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
