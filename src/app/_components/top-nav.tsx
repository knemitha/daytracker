"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./top-nav.module.css";

const links = [
  { href: "/day-log", label: "Day Log" },
  { href: "/tasks", label: "Tasks" },
  { href: "/calendar", label: "Calendar" },
  { href: "/statistics", label: "Statistics" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={styles.panel}>
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${active ? styles.linkActive : styles.linkInactive}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
