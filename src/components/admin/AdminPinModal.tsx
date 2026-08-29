import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, KeyRound, X, ShieldAlert, Eye, EyeOff, Delete, Clock, ShieldX } from 'lucide-react';
import { adminAuthService } from '../../services/adminAuthService';

interface AdminPinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  onHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'selection' | 'success') => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  onHaptic,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showPlain, setShowPlain] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Check lockout status and maintain countdown timer
  useEffect(() => {
    if (!isOpen) return;

    setPin('');
    setErrorMsg('');
    setIsShaking(false);

    const checkLockout = () => {
      const remaining = adminAuthService.getLockoutRemainingSeconds();
      setLockoutRemaining(remaining);
      if (remaining > 0) {
        setErrorMsg('Maximum attempts exceeded. Verification temporarily locked.');
      }
    };

    checkLockout();

    const interval = setInterval(() => {
      const remaining = adminAuthService.getLockoutRemainingSeconds();
      setLockoutRemaining(remaining);
      if (remaining === 0 && lockoutRemaining > 0) {
        setErrorMsg('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, lockoutRemaining]);

  if (!isOpen) return null;

  const isLockedOut = lockoutRemaining > 0;

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const expectedPinLength = adminAuthService.getAdminPin().length;
  const totalDots = Math.max(expectedPinLength, pin.length);

  const handleSubmitPin = (pinToTest?: string) => {
    if (isLockedOut) return;

    const candidate = pinToTest ?? pin;
    if (!candidate || candidate.length < 4) {
      setErrorMsg('Please enter your PIN');
      onHaptic?.('heavy');
      return;
    }

    const res = adminAuthService.verifyAndLogin(candidate);
    if (res.success) {
      setErrorMsg('');
      onHaptic?.('success');
      onSuccess();
    } else {
      if (res.isLockedOut) {
        setLockoutRemaining(res.remainingSeconds);
        setErrorMsg(res.message || 'Maximum attempts reached. Verification locked.');
      } else {
        setErrorMsg(res.message || 'Incorrect PIN.');
      }
      setIsShaking(true);
      onHaptic?.('heavy');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (isLockedOut) return;
    onHaptic?.('light');
    if (pin.length < 16) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');
      if (nextPin.length === expectedPinLength) {
        // Auto-verify when reaching expected PIN length
        setTimeout(() => {
          handleSubmitPin(nextPin);
        }, 150);
      }
    }
  };

  const handleDeleteDigit = () => {
    if (isLockedOut) return;
    onHaptic?.('light');
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: isShaking ? [-8, 8, -6, 6, -3, 3, 0] : 0,
          }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-sm rounded-3xl bg-[#12141c] border border-white/10 shadow-2xl p-6 overflow-hidden text-center"
        >
          {/* Background Ambient Glow */}
          <div
            className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
              isLockedOut ? 'bg-amber-600/20' : 'bg-rose-600/20'
            }`}
          />

          {/* Close Button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon */}
          <div
            className={`w-14 h-14 mx-auto rounded-2xl p-0.5 shadow-lg mb-3.5 transition-all duration-300 ${
              isLockedOut
                ? 'bg-gradient-to-tr from-amber-600 to-rose-600 shadow-amber-600/30'
                : 'bg-gradient-to-tr from-rose-600 to-amber-500 shadow-rose-600/30'
            }`}
          >
            <div className="w-full h-full rounded-2xl bg-[#0c0e14] flex items-center justify-center">
              {isLockedOut ? (
                <ShieldX className="w-6 h-6 text-amber-500 animate-pulse" />
              ) : (
                <Lock className="w-6 h-6 text-rose-500" />
              )}
            </div>
          </div>

          <h3 className="text-lg font-black text-white font-display">
            {isLockedOut ? 'Verification Locked' : 'Admin Verification'}
          </h3>
          <p className="text-xs text-white/50 mt-1 max-w-[260px] mx-auto">
            {isLockedOut
              ? 'Too many consecutive incorrect attempts. Please wait before trying again.'
              : 'Enter your master security PIN to access the management dashboard.'}
          </p>

          {/* Lockout Countdown Banner */}
          {isLockedOut && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2 text-left">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
                <div>
                  <p className="text-[11px] font-bold text-amber-300">Lockout in effect</p>
                  <p className="text-[10px] text-amber-400/80">Keypad input is disabled</p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/30 font-mono font-bold text-sm text-amber-200">
                {formatTime(lockoutRemaining)}
              </div>
            </motion.div>
          )}

          {/* PIN Indicators */}
          <div className="flex justify-center items-center space-x-2 my-5 flex-wrap gap-y-1">
            {Array.from({ length: totalDots }).map((_, idx) => {
              const hasDigit = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 border ${
                    isLockedOut
                      ? 'bg-white/5 border-white/10 opacity-40'
                      : hasDigit
                      ? 'bg-rose-500 border-rose-400 scale-110 shadow-md shadow-rose-500/50'
                      : 'bg-white/5 border-white/20'
                  }`}
                />
              );
            })}
          </div>

          {/* Error / Attempt Warning Message */}
          {errorMsg && !isLockedOut && (
            <div className="mb-3.5 py-1.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-semibold flex items-center justify-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={isLockedOut}
                onClick={() => handleKeypadPress(digit)}
                className="h-12 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-rose-600/30 active:scale-95 disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-white/[0.06] border border-white/5 text-white text-lg font-bold font-mono transition-all flex items-center justify-center cursor-pointer select-none"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              disabled={isLockedOut}
              onClick={() => setShowPlain(!showPlain)}
              className="h-12 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 disabled:opacity-30 disabled:pointer-events-none border border-white/5 text-white/50 text-xs font-semibold transition-all flex items-center justify-center cursor-pointer select-none"
              title="Show PIN"
            >
              {showPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              type="button"
              disabled={isLockedOut}
              onClick={() => handleKeypadPress('0')}
              className="h-12 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-rose-600/30 active:scale-95 disabled:opacity-30 disabled:pointer-events-none border border-white/5 text-white text-lg font-bold font-mono transition-all flex items-center justify-center cursor-pointer select-none"
            >
              0
            </button>
            <button
              type="button"
              disabled={isLockedOut || pin.length === 0}
              onClick={handleDeleteDigit}
              className="h-12 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 disabled:opacity-30 disabled:pointer-events-none border border-white/5 text-white/70 transition-all flex items-center justify-center cursor-pointer select-none"
              title="Delete"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Plain PIN preview if toggled */}
          {showPlain && pin.length > 0 && !isLockedOut && (
            <p className="text-xs text-amber-300 font-mono mb-3">Entered: {pin}</p>
          )}

          {/* Bottom Actions */}
          <div className="flex space-x-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-white/80 font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmitPin()}
              disabled={isLockedOut || pin.length < 4}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-1 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
