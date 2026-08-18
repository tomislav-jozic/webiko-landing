import type { FormEvent } from "react";
import { NAV_ITEMS, NAV_LABELS, type ViewId } from "@/lib/copy";
import ContactForm from "../ContactForm";
import ServicesList from "../ServicesList";
import WorkSection from "../WorkSection";
import styles from "./ContactPanel.module.css";

type Props = {
  activeView: ViewId | null;
  revealed: boolean;
  onBack: () => void;
  submitting: boolean;
  submitted: boolean;
  submitError: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function ContactPanel({
  activeView,
  revealed,
  onBack,
  submitting,
  submitted,
  submitError,
  onSubmit,
}: Props) {
  const heading = NAV_ITEMS.find((item) => item.id === activeView)?.label ?? "";

  return (
    <div
      className={styles.contactPanel}
      style={{
        opacity: revealed ? 1 : 0,
        pointerEvents: revealed ? "auto" : "none",
      }}
      inert={!revealed}
    >
      <button type="button" className={styles.backBtn} onClick={onBack}>
        {NAV_LABELS.back}
      </button>

      {activeView && (
        <>
          <h2 className={styles.heading} style={{ opacity: revealed ? 1 : 0 }}>
            {heading}
          </h2>

          {activeView === "services" && <ServicesList />}
          {activeView === "work" && <WorkSection />}
          {activeView === "contact" && (
            <ContactForm
              submitting={submitting}
              submitted={submitted}
              submitError={submitError}
              onSubmit={onSubmit}
            />
          )}
        </>
      )}
    </div>
  );
}
