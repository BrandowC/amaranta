'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AvailableSlots {
  isClosed: boolean;
  windows: { openMinute: number; closeMinute: number }[];
  booked: { scheduledAt: string; durationMinutes: number }[];
}

const SLOT_STEP_MINUTES = 30;
/** Just for the occupied/free visualization — the real duration is resolved and re-validated server-side. */
const ASSUMED_SLOT_DURATION = 30;

function formatSlotLabel(minute: number): string {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  const period = hours < 12 ? 'a. m.' : 'p. m.';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Date picker + a grid of half-hour slot buttons for the chosen professional's day, greying out
 * anything already booked. A simple free/occupied list rather than a full calendar widget.
 */
export function SlotPicker({
  token,
  professionalId,
  date,
  onDateChange,
  scheduledAt,
  onSlotSelected,
}: {
  token: string;
  professionalId: string;
  date: string;
  onDateChange: (date: string) => void;
  scheduledAt: string;
  onSlotSelected: (isoScheduledAt: string) => void;
}) {
  const [slots, setSlots] = useState<AvailableSlots | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!professionalId || !date) {
      setSlots(null);
      return;
    }
    setLoading(true);
    api
      .get<AvailableSlots>(`/appointments/slots?professionalId=${professionalId}&date=${date}`, token)
      .then(setSlots)
      .finally(() => setLoading(false));
  }, [token, professionalId, date]);

  const bookedRanges = (slots?.booked ?? []).map((b) => {
    const start = new Date(b.scheduledAt);
    const startMinute = start.getHours() * 60 + start.getMinutes();
    return { start: startMinute, end: startMinute + b.durationMinutes };
  });

  const candidateSlots: number[] = [];
  if (slots && !slots.isClosed) {
    for (const window of slots.windows) {
      for (
        let m = window.openMinute;
        m + ASSUMED_SLOT_DURATION <= window.closeMinute;
        m += SLOT_STEP_MINUTES
      ) {
        candidateSlots.push(m);
      }
    }
  }

  function isOccupied(minute: number): boolean {
    const end = minute + ASSUMED_SLOT_DURATION;
    return bookedRanges.some((r) => minute < r.end && r.start < end);
  }

  function selectSlot(minute: number) {
    const [hours, mins] = [Math.floor(minute / 60), minute % 60];
    const localDate = new Date(`${date}T00:00:00`);
    localDate.setHours(hours, mins, 0, 0);
    onSlotSelected(localDate.toISOString());
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink-900/80">Fecha</label>
      <input
        type="date"
        required
        value={date}
        onChange={(e) => {
          onDateChange(e.target.value);
          onSlotSelected('');
        }}
        className="input"
      />

      {loading && <p className="mt-2 text-xs text-ink-900/50">Consultando horarios…</p>}

      {slots?.isClosed && <p className="mt-2 text-xs text-ink-900/50">La clínica está cerrada ese día (domingo).</p>}

      {slots && !slots.isClosed && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {candidateSlots.map((minute) => {
            const occupied = isOccupied(minute);
            const isoAt = (() => {
              const d = new Date(`${date}T00:00:00`);
              d.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
              return d.toISOString();
            })();
            const selected = scheduledAt === isoAt;
            return (
              <button
                key={minute}
                type="button"
                disabled={occupied}
                onClick={() => selectSlot(minute)}
                className={`rounded-lg px-2 py-1.5 text-xs font-medium ${
                  occupied
                    ? 'cursor-not-allowed bg-ink-900/5 text-ink-900/30 line-through'
                    : selected
                      ? 'bg-ocean-500 text-white'
                      : 'border border-ocean-200 text-ocean-700 hover:bg-ocean-50'
                }`}
              >
                {formatSlotLabel(minute)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
