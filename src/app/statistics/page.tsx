import styles from "./page.module.css";

export default function StatisticsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Statistics</p>
          <h1 className={styles.title}>Progress statistics</h1>
          <p className={styles.description}>
            This section is ready for charts, mood trends, day ratings, and task completion summaries.
          </p>
        </section>
      </div>
    </main>
  );
}
