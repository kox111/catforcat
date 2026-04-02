"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";

interface DatePickerProps {
  value: string; // ISO datetime string or "YYYY-MM-DDTHH:mm" format
  onChange: (value: string) => void;
  minDate?: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function parseValue(value: string): { year: number; month: number; day: number; hour: number; minute: number } | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), hour: d.getHours(), minute: d.getMinutes() };
}

function formatISO(year: number, month: number, day: number, hour: number, minute: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

export default function DatePicker({ value, onChange, minDate }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = parseValue(value);
  const now = new Date();

  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(parsed?.day ?? null);
  const [hour, setHour] = useState(parsed?.hour ?? 23);
  const [minute, setMinute] = useState(parsed?.minute ?? 59);

  // Sync state when value prop changes externally
  useEffect(() => {
    const p = parseValue(value);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
      setSelectedDay(p.day);
      setHour(p.hour);
      setMinute(p.minute);
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const emitChange = useCallback(
    (y: number, m: number, d: number, h: number, min: number) => {
      onChange(formatISO(y, m, d, h, min));
    },
    [onChange],
  );

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    emitChange(viewYear, viewMonth, day, hour, minute);
  };

  const handleHourChange = (h: number) => {
    setHour(h);
    if (selectedDay != null) emitChange(viewYear, viewMonth, selectedDay, h, minute);
  };

  const handleMinuteChange = (m: number) => {
    setMinute(m);
    if (selectedDay != null) emitChange(viewYear, viewMonth, selectedDay, hour, m);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDay = now.getDate();

  // Min date check
  const minParsed = minDate ? parseValue(minDate) : null;
  const isDayDisabled = (day: number): boolean => {
    if (!minParsed) return false;
    const cellDate = new Date(viewYear, viewMonth, day);
    const minD = new Date(minParsed.year, minParsed.month, minParsed.day);
    return cellDate < minD;
  };

  // Display text for the trigger button
  const displayText = parsed
    ? `${MONTHS[parsed.month].slice(0, 3)} ${parsed.day}, ${parsed.year} ${pad(parsed.hour)}:${pad(parsed.minute)}`
    : "Select date & time";

  // Build calendar grid rows
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const baseBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-ui-family)",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "var(--radius-sm)",
          fontSize: 14,
          outline: "none",
          background: "var(--bg-deep)",
          border: "1.5px solid var(--border)",
          color: parsed ? "var(--text-primary)" : "var(--text-muted)",
          fontFamily: "var(--font-ui-family)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          textAlign: "left",
        }}
      >
        <Calendar size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        {displayText}
      </button>

      {/* Popover */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 1100,
            width: 280,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-float)",
            padding: 16,
            fontFamily: "var(--font-ui-family)",
          }}
        >
          {/* Month/Year nav */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={prevMonth}
              style={{ ...baseBtn, width: 28, height: 28, borderRadius: "var(--radius-sm)", color: "var(--text-secondary)" }}
              onMouseEnter={(e) => { (e.currentTarget.style.background) = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget.style.background) = "none"; }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              style={{ ...baseBtn, width: 28, height: 28, borderRadius: "var(--radius-sm)", color: "var(--text-secondary)" }}
              onMouseEnter={(e) => { (e.currentTarget.style.background) = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget.style.background) = "none"; }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, marginBottom: 4 }}>
            {DAYS.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  padding: "4px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} style={{ width: 34, height: 34 }} />;
              }
              const isToday = viewYear === todayYear && viewMonth === todayMonth && day === todayDay;
              const isSelected = selectedDay === day && parsed && viewYear === parsed.year && viewMonth === parsed.month;
              const disabled = isDayDisabled(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDayClick(day)}
                  style={{
                    ...baseBtn,
                    width: 34,
                    height: 34,
                    borderRadius: "var(--radius-sm)",
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 400,
                    color: disabled
                      ? "var(--text-muted)"
                      : isSelected
                        ? "var(--cta-text)"
                        : isToday
                          ? "var(--accent)"
                          : "var(--text-primary)",
                    background: isSelected ? "var(--accent)" : "transparent",
                    opacity: disabled ? 0.35 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                    border: isToday && !isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                    transition: "background 150ms, color 150ms",
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !isSelected) e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled && !isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

          {/* Time picker */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Time</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
              <select
                value={hour}
                onChange={(e) => handleHourChange(Number(e.target.value))}
                style={{
                  width: 52,
                  padding: "4px 6px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  background: "var(--bg-deep)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-ui-family)",
                  cursor: "pointer",
                  outline: "none",
                  textAlign: "center",
                }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{pad(i)}</option>
                ))}
              </select>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>:</span>
              <select
                value={minute}
                onChange={(e) => handleMinuteChange(Number(e.target.value))}
                style={{
                  width: 52,
                  padding: "4px 6px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  background: "var(--bg-deep)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-ui-family)",
                  cursor: "pointer",
                  outline: "none",
                  textAlign: "center",
                }}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>{pad(i)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
