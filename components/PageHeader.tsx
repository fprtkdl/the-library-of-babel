import styles from "./PageHeader.module.css";

export function PageHeader({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return (
    <header className={styles.header}>
      <div className="label-en">{label}</div>
      <h1 className={styles.title}>{title}</h1>
      {sub && <p className={styles.sub}>{sub}</p>}
    </header>
  );
}
