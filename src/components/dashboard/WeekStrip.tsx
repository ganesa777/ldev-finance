import React, { useState } from 'react';
import {
  addDays,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { spring } from '../../lib/motion';

interface WeekStripProps {
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
  activeDates?: Set<string>;
}

export const WeekStrip: React.FC<WeekStripProps> = ({
  selectedDate,
  onSelectDate,
  activeDates,
}) => {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const days = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const monthTitle = format(days[3], 'MMMM yyyy', { locale: idLocale });

  const handleDayClick = (day: Date) => {
    const formatted = format(day, 'yyyy-MM-dd');
    if (selectedDate === formatted) {
      onSelectDate(null); // Ketuk lagi untuk mereset filter hari
    } else {
      onSelectDate(formatted);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="glass-card rounded-3xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-500" />
          <h3 className="text-base font-bold text-ink capitalize">
            {monthTitle}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {selectedDate && (
            <button
              type="button"
              onClick={() => onSelectDate(null)}
              className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-700 text-[11px] font-semibold hover:bg-sky-200 transition-colors"
            >
              Semua hari
            </button>
          )}
          <button
            type="button"
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
            aria-label="Minggu sebelumnya"
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-sky-50 border border-sky-100 flex items-center justify-center text-ink transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
            aria-label="Minggu berikutnya"
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-sky-50 border border-sky-100 flex items-center justify-center text-ink transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Strip 7 Hari */}
      <div className="grid grid-cols-7 gap-1.5 overflow-x-auto no-scrollbar">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDate
            ? isSameDay(day, parseISO(selectedDate))
            : isSameDay(day, new Date());
          const hasTx = activeDates?.has(dateKey);

          return (
            <motion.button
              key={dateKey}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => handleDayClick(day)}
              className="relative py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 outline-none transition-colors"
            >
              {isSelected && (
                <motion.span
                  layoutId="weekstrip-active"
                  transition={spring}
                  className="absolute inset-0 rounded-2xl bg-ink shadow-md"
                />
              )}

              <span
                className={`relative z-10 text-[11px] font-medium capitalize ${
                  isSelected ? 'text-sky-200' : 'text-muted'
                }`}
              >
                {format(day, 'EEE', { locale: idLocale }).slice(0, 3)}
              </span>

              <span
                className={`relative z-10 text-sm font-bold tabular-nums ${
                  isSelected ? 'text-white' : 'text-ink'
                }`}
              >
                {format(day, 'd')}
              </span>

              {/* Titik indikator ada transaksi */}
              <span
                className={`relative z-10 w-1.5 h-1.5 rounded-full ${
                  hasTx
                    ? isSelected
                      ? 'bg-sky-300'
                      : 'bg-sky-400'
                    : 'bg-transparent'
                }`}
              />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default WeekStrip;