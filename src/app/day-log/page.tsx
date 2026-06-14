"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import styles from "./page.module.css";

type Mood = "great" | "good" | "neutral" | "bad";

type Entry = {
  date: string;
  mood: Mood;
  note: string;
  rating: number;
};

const STORAGE_KEY = "daytracker.entries";
const STORAGE_EVENT = "daytracker.entries-changed";
const EMPTY_ENTRIES: Entry[] = [];
let cachedEntries = EMPTY_ENTRIES;
let cachedStorageValue: string | null = null;

const moodOptions: Array<{ value: Mood; label: string; accent: string }> = [
  { value: "great", label: "Great", accent: "bg-emerald-500" },
  { value: "good", label: "Good", accent: "bg-sky-500" },
  { value: "neutral", label: "Neutral", accent: "bg-amber-500" },
  { value: "bad", label: "Bad", accent: "bg-rose-500" },
];

const moodLabels: Record<Mood, string> = {
  great: "Great",
  good: "Good",
  neutral: "Neutral",
  bad: "Bad",
};

const moodDotStyles: Record<Mood, string> = {
  great: styles.moodDotGreat,
  good: styles.moodDotGood,
  neutral: styles.moodDotNeutral,
  bad: styles.moodDotBad,
};

function loadEntries() {
  if (typeof window === "undefined") {
    return EMPTY_ENTRIES;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    cachedStorageValue = null;
    cachedEntries = EMPTY_ENTRIES;
    return cachedEntries;
  }

  if (stored === cachedStorageValue) {
    return cachedEntries;
  }

  try {
    const parsed = JSON.parse(stored) as Entry[];
    cachedStorageValue = stored;
    cachedEntries = parsed;
    return cachedEntries;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    cachedStorageValue = null;
    cachedEntries = EMPTY_ENTRIES;
    return cachedEntries;
  }
}

function subscribeEntries(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
  };
}

export default function DayLogPage() {
  const today = new Date().toISOString().slice(0, 10);
  const entries = useSyncExternalStore(subscribeEntries, loadEntries, () => EMPTY_ENTRIES);
  const [mood, setMood] = useState<Mood>("good");
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(4);

  const sortedEntries = useMemo(
    () => [...entries].sort((left, right) => right.date.localeCompare(left.date)),
    [entries],
  );

  const saveEntry = () => {
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      return;
    }

    const currentEntries = loadEntries();
    const nextEntries = [{ date: today, mood, note: trimmedNote, rating }, ...currentEntries.filter((entry) => entry.date !== today)];
    const nextStorageValue = JSON.stringify(nextEntries);

    cachedEntries = nextEntries;
    cachedStorageValue = nextStorageValue;
    window.localStorage.setItem(STORAGE_KEY, nextStorageValue);
    window.dispatchEvent(new Event(STORAGE_EVENT));
    setNote("");
  };

  const selectedMood = moodOptions.find((option) => option.value === mood) ?? moodOptions[1];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Day Log</p>
          <h1 className={styles.title}>Track today, one section at a time.</h1>
          <p className={styles.description}>
            Record your mood, write a note, and rate the day so each entry stays clear and easy to review.
          </p>
        </header>

        <section className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Today</h2>
                <p className={styles.cardDescription}>Save one organized log per day.</p>
              </div>
              <div className={styles.badgeCount}>{sortedEntries.length} saved</div>
            </div>

            <div className={styles.form}>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Track today mood</h3>
                <div className={styles.moodGrid}>
                  {moodOptions.map((option) => {
                    const active = option.value === mood;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMood(option.value)}
                        className={`${styles.moodButton} ${active ? styles.moodButtonActive : ""}`}
                      >
                        <span className={`${styles.moodDot} ${active ? styles.moodDotActive : moodDotStyles[option.value]}`} />
                        <span className={styles.moodLabel}>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Add note</h3>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="What did you accomplish today? What stood out?"
                  rows={6}
                  className={styles.note}
                />
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Rate the day</h3>
                <div className={styles.ratingGrid}>
                  {[1, 2, 3, 4, 5].map((value) => {
                    const active = value === rating;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className={`${styles.ratingButton} ${active ? styles.ratingButtonActive : ""}`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className={styles.actions}>
                <button type="button" onClick={saveEntry} className={styles.saveButton}>
                  Save entry
                </button>
                <p className={styles.metaText}>
                  Mood: <span className={styles.metaHighlight}>{selectedMood.label}</span> · Rating: <span className={styles.metaHighlight}>{rating}/5</span>
                </p>
              </div>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>Recent entries</h2>
            <p className={styles.sidebarDescription}>Your most recent logs appear here.</p>

            <div className={styles.entries}>
              {sortedEntries.length === 0 ? (
                <div className={styles.emptyState}>
                  No entries yet. Add your first daily log on the left.
                </div>
              ) : (
                sortedEntries.map((entry) => (
                  <article key={entry.date} className={styles.entryCard}>
                    <div className={styles.entryHeader}>
                      <div>
                        <p className={styles.entryDate}>{entry.date}</p>
                        <h3 className={styles.entryMood}>{moodLabels[entry.mood]}</h3>
                      </div>
                      <span className={styles.entryRating}>{entry.rating}/5</span>
                    </div>
                    <p className={styles.entryNote}>{entry.note}</p>
                  </article>
                ))
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
