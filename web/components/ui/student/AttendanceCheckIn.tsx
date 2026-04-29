'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react';

interface AttendanceCheckInProps {
  sessionActive: boolean;
  onSubmitPin: (pin: string) => Promise<void>;
  checkedInAt?: Date;
}

export default function AttendanceCheckIn({
  sessionActive,
  onSubmitPin,
  checkedInAt,
}: AttendanceCheckInProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 4);
    setPin(value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmitPin(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (checkedInAt) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16">
        <CheckCircle2 className="h-8 w-8 text-green-600 mb-3" />
        <p className="text-sm font-medium text-green-700">You&apos;re checked in</p>
        <p className="text-xs text-gray-500 mt-1">
          Checked in at{' '}
          {checkedInAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    );
  }

  // No active session state
  if (!sessionActive) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16">
        <Calendar className="h-6 w-6 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No active session</p>
        <p className="text-xs text-gray-400 mt-2">
          Your tutor will start a session before class begins.
        </p>
      </div>
    );
  }

  // Session active state
  return (
    <div className="p-5">
      <div className="border border-red-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-red-800 mb-4">Session is live</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={handlePinChange}
            placeholder="0000"
            className="w-full h-14 text-center text-2xl font-mono tracking-widest border border-gray-200 rounded-lg focus:outline-none focus:border-red-800 transition-colors"
          />

          <button
            type="submit"
            disabled={isLoading || pin.length !== 4}
            className="w-full h-10 bg-red-800 text-white rounded-lg text-sm font-medium hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Check in
          </button>

          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
