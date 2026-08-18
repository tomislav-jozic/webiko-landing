import { SERVICES } from "@/lib/copy";
import styles from "./ServicesList.module.css";

export default function ServicesList() {
  return (
    <ul className={styles.serviceList}>
      {SERVICES.map((service) => (
        <li key={service.title} className={styles.serviceItem}>
          <span className={styles.serviceTitle}>{service.title}</span>
          <span className={styles.serviceDesc}>{service.description}</span>
        </li>
      ))}
    </ul>
  );
}
