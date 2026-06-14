"use client";

import { useState } from "react";
import styles from "./page.module.css";

type Mood = "great" | "good" | "neutral" | "bad";

type DayRecord = {
  date: string;
  rating: number;
  mood: Mood;
  note: string;
  tasksCreated: string[];
};

type CalendarCell = {
  dateKey: string;
  dayNumber: number;
  isToday: boolean;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const moodLabels: Record<Mood, string> = {
  great: "Great",
  good: "Good",
  neutral: "Neutral",
  bad: "Bad",
};

const moodHints: Record<Mood, string> = {
  great: "High energy",
  good: "Steady",
  neutral: "Balanced",
  bad: "Low energy",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getMoodFromRating(rating: number): Mood {
  if (rating >= 5) {
    return "great";
  }

  if (rating >= 4) {
    return "good";
  }

  if (rating >= 3) {
    return "neutral";
  }

  return "bad";
}

function buildSeedRecords(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const today = new Date();
  const currentMonth = today.getFullYear() === year && today.getMonth() === month;
  const lastDay = currentMonth ? today.getDate() : new Date(year, month + 1, 0).getDate();
  const records: Record<string, DayRecord> = {};

  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = getDateKey(date);
    const rating = Math.max(1, Math.min(5, 3 + ((day + month) % 3)));
    const mood = getMoodFromRating(rating);

    records[dateKey] = {
      date: dateKey,
      rating,
      mood,
      note:
        day === today.getDate() && currentMonth
          ? "Focused on planning, wrapped up priorities, and kept the day balanced."
          : `Completed a clear block of work on ${formatLongDate(date).split(",")[0].toLowerCase()} and kept the pace steady.`,
      tasksCreated: [
        `Review daily priorities for ${date.toLocaleDateString("en", { month: "short", day: "numeric" })}`,
        `Capture one small win from ${day}`,
        `Prepare tomorrow's first task`,
      ].slice(0, 2 + (day % 2)),
    };
  }

  return records;
}

function buildMonthCells(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayKey = getDateKey(new Date());

  const cells: Array<CalendarCell | null> = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);

    cells.push({
      dateKey: getDateKey(date),
      dayNumber: day,
      isToday: getDateKey(date) === todayKey,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export default function CalendarPage() {
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [selectedDate, setSelectedDate] = useState(getDateKey(today));

  const recordsByDate = buildSeedRecords(currentMonth);
  const cells = buildMonthCells(currentMonth);
  const selectedRecord = recordsByDate[selectedDate];
  const selectedDateObject = parseDateKey(selectedDate);
  const selectedTasks = selectedRecord?.tasksCreated ?? [];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Calendar</p>
          <h1 className={styles.title}>Monthly view with day details.</h1>
          <p className={styles.description}>
            Pick a day on the left to review its rating, mood, note, and created tasks on the right.
          </p>

          <div className={styles.grid}>
            <section className={styles.calendarPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.panelLabel}>Month</p>
                  <h2 className={styles.panelTitle}>{formatMonthTitle(currentMonth)}</h2>
                </div>
                <div className={styles.legend}>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDotToday} />
                    Today
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDotPast} />
                    Logged day
                  </span>
                </div>
              </div>

              <div className={styles.weekdayRow} aria-hidden="true">
                {weekdayLabels.map((label) => (
                  <div key={label} className={styles.weekdayCell}>
                    {label}
                  </div>
                ))}
              </div>

              <div className={styles.calendarGrid}>
                {cells.map((cell, index) => {
                  if (!cell) {
                    return <div key={`empty-${index}`} className={styles.emptyCell} />;
                  }

                  const record = recordsByDate[cell.dateKey];
                  const isSelected = cell.dateKey === selectedDate;
                  const hasRecord = Boolean(record);
                  const canShowStats = hasRecord && cell.dateKey <= getDateKey(today);

                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateKey)}
                      className={`${styles.dayCell} ${cell.isToday ? styles.dayCellToday : ""} ${
                        isSelected ? styles.dayCellSelected : ""
                      } ${!hasRecord ? styles.dayCellMuted : ""}`}
                      aria-pressed={isSelected}
                      aria-label={formatLongDate(parseDateKey(cell.dateKey))}
                    >
                      <div className={styles.dayTopRow}>
                        <span className={styles.dayNumber}>{cell.dayNumber}</span>
                        {cell.isToday && <span className={styles.todayChip}>Today</span>}
                      </div>

                      {canShowStats ? (
                        <div className={styles.dayMeta}>
                          <span className={styles.ratingPill}>{record.rating}/5</span>
                          <span className={`${styles.moodPill} ${styles[`moodPill${record.mood}`]}`}>
                            {moodLabels[record.mood]}
                          </span>
                          <span className={styles.moodHint}>{moodHints[record.mood]}</span>
                        </div>
                      ) : (
                        <div className={styles.dayMetaEmpty}>No log yet</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className={styles.detailPanel}>
              <div className={styles.panelHeaderCompact}>
                <div>
                  <p className={styles.panelLabel}>Selected day</p>
                  <h2 className={styles.panelTitle}>{formatLongDate(selectedDateObject)}</h2>
                </div>
              </div>

              {selectedRecord ? (
                <div className={styles.detailStack}>
                  <section className={styles.detailSummary}>
                    <div className={styles.summaryMetric}>
                      <span className={styles.metricLabel}>Rating</span>
                      <strong className={styles.metricValue}>{selectedRecord.rating}/5</strong>
                    </div>
                    <div className={styles.summaryMetric}>
                      <span className={styles.metricLabel}>Mood</span>
                      <strong className={styles.metricValue}>{moodLabels[selectedRecord.mood]}</strong>
                    </div>
                    <div className={styles.summaryMetric}>
                      <span className={styles.metricLabel}>Tasks created</span>
                      <strong className={styles.metricValue}>{selectedTasks.length}</strong>
                    </div>
                  </section>

                  <section className={styles.detailBlock}>
                    <div className={styles.blockHeader}>
                      <h3 className={styles.blockTitle}>Note added</h3>
                    </div>
                    <p className={styles.noteText}>{selectedRecord.note}</p>
                  </section>

                  <section className={styles.detailBlock}>
                    <div className={styles.blockHeader}>
                      <h3 className={styles.blockTitle}>Tasks created for this day</h3>
                      <span className={styles.blockCount}>{selectedTasks.length}</span>
                    </div>

                    {selectedTasks.length > 0 ? (
                      <ul className={styles.taskList}>
                        {selectedTasks.map((task) => (
                          <li key={task} className={styles.taskItem}>
                            <span className={styles.taskBullet} />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.emptyDetail}>No tasks were created for this date.</p>
                    )}
                  </section>
                </div>
              ) : (
                <div className={styles.emptyDetailBox}>
                  <h3 className={styles.emptyTitle}>No saved details for this day</h3>
                  <p className={styles.emptyCopy}>
                    Select a date with a log to view the rating, mood, note, and tasks created.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
