import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns';

export default function ShiftCalendar({ shifts, currentDate, onDateChange, onShiftClick }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const shiftsMap = useMemo(() => {
    const map = {};
    shifts?.forEach(shift => {
      const dateKey = shift.date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(shift);
    });
    return map;
  }, [shifts]);

  const goToPreviousMonth = () => onDateChange(subMonths(currentDate, 1));
  const goToNextMonth = () => onDateChange(addMonths(currentDate, 1));

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayShifts = shiftsMap[dayKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={idx}
              className={`min-h-24 p-2 rounded-lg border ${
                isCurrentMonth
                  ? `border-border ${isToday ? 'bg-primary/5' : 'bg-muted/30'}`
                  : 'border-border/50 bg-muted/10'
              }`}
            >
              <p className={`text-xs font-semibold mb-1 ${isCurrentMonth ? '' : 'text-muted-foreground'}`}>
                {format(day, 'd')}
              </p>

              {dayShifts.length > 0 && (
                <div className="space-y-1">
                  {dayShifts.slice(0, 2).map(shift => (
                    <button
                      key={shift.id}
                      onClick={() => onShiftClick(shift)}
                      className="block w-full text-left text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded px-1.5 py-1 truncate transition-colors"
                    >
                      {format(new Date(`${shift.date}T${shift.start_time}`), 'HH:mm')}
                    </button>
                  ))}
                  {dayShifts.length > 2 && (
                    <p className="text-xs text-muted-foreground px-1.5 py-0.5">
                      +{dayShifts.length - 2} more
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}