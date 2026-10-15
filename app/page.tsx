import styles from './page.module.css';

// 8 Top recurring questions from PRD section 5.4 / 6.2
const SUGGESTED_QUESTIONS = [
  'What time is the Saturday class?',
  'Can I bring a guest?',
  'Why is my card not working before 6?',
  'How many days have I trained this month?',
  'Do I still owe for July?',
  'What are the gym opening hours?',
  'How do I renew my membership?',
  'What time does the gym close today?',
];

export default function HomePage() {
  return (
    <main className={styles.container}>
      {/* Header & Status Area (PRD 6.2 / FR-8 / FR-8b) */}
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.appName}>Spotter</h1>
          <span className={styles.tierBadge}>Basic</span>
        </div>

        <section className={styles.statusCard} aria-label="Membership Status">
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Days trained this month</span>
            <span className={styles.statusValue}>0 days</span>
          </div>

          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Balance</span>
            <span className={styles.statusValue}>0.00 naira</span>
          </div>
          <p className={styles.balanceFraming}>
            Correct as of today, based on payments recorded here.
          </p>
        </section>
      </header>

      {/* Suggested Questions Section (PRD 6.2 / FR-9) */}
      <section className={styles.questionsSection} aria-label="Suggested Questions">
        <h2 className={styles.questionsHeading}>Suggested questions</h2>
        <div className={styles.questionsGrid}>
          {SUGGESTED_QUESTIONS.map((question, index) => (
            <button key={index} type="button" className={styles.questionChip}>
              {question}
            </button>
          ))}
        </div>
      </section>

      {/* Free Typing Input Bar (PRD 6.2 / FR-9) */}
      <footer className={styles.inputBar}>
        <input
          type="text"
          className={styles.inputField}
          placeholder="Ask a question about the gym..."
          aria-label="Ask a question about the gym"
          readOnly
        />
        <button type="button" className={styles.sendButton} aria-label="Send">
          Ask
        </button>
      </footer>
    </main>
  );
}

