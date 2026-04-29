'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AttendancePinDisplayProps {
  pin: string;
  expiresAt: Date;
  checkedIn: number;
  total: number;
  onEndSession: () => void;
}

export default function AttendancePinDisplay({
  pin,
  expiresAt,
  checkedIn,
  total,
  onEndSession,
}: AttendancePinDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Session expired');
      } else {
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
          setTimeLeft(`${minutes}m ${remainingSeconds}s`);
        } else {
          setTimeLeft(`${remainingSeconds}s`);
        }
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const secondsRemaining = Math.floor(
    (expiresAt.getTime() - new Date().getTime()) / 1000
  );
  const isLowTime = secondsRemaining < 60 && secondsRemaining > 0;

  const pinDigits = pin.split('');

  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      toast.success('PIN copied to clipboard');
    } catch {
      toast.error('Unable to copy PIN');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="w-full max-w-sm rounded-3xl bg-[#111111] p-6 text-center">
        {/* Label */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">
          Active Session
        </p>

        {/* PIN Display */}
        <div className="mb-4 flex justify-center gap-2">
          {pinDigits.map((digit, index) => (
            <div
              key={index}
              className="flex h-16 w-13 items-center justify-center rounded-lg border border-[#333] bg-[#1A1A1A]"
            >
              <span className="font-mono text-3xl font-medium text-white">
                {digit}
              </span>
            </div>
          ))}
        </div>

        {/* Subtitle Row */}
        <div className="mb-4 flex items-center justify-between text-xs text-[#9CA3AF]">
          <span className={isLowTime ? 'text-red-500' : ''}>
            {isExpired ? 'Session expired' : `Expires in ${timeLeft}`}
          </span>
          <span>
            {checkedIn} of {total} checked in
          </span>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleCopyPin}
            className="rounded border border-[#444] bg-transparent px-4 py-1.5 text-xs text-[#9CA3AF] transition-colors hover:border-white hover:text-white"
          >
            Copy PIN
          </button>
          <button
            onClick={onEndSession}
            className="rounded border border-[#444] bg-transparent px-4 py-1.5 text-xs text-[#9CA3AF] transition-colors hover:border-white hover:text-white"
          >
            End session
          </button>
        </div>
      </div>
    </div>
  );
}
