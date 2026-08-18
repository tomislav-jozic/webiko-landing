import type { FormEvent } from "react";
import { CONTACT_COPY } from "@/lib/copy";
import styles from "./ContactForm.module.css";

type Props = {
  submitting: boolean;
  submitted: boolean;
  submitError: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function ContactForm({
  submitting,
  submitted,
  submitError,
  onSubmit,
}: Props) {
  if (submitted) {
    return <p className={styles.tbd}>{CONTACT_COPY.thanks}</p>;
  }

  return (
    <div className={styles.formWrap}>
      <p className={styles.contactIntro}>{CONTACT_COPY.intro}</p>
      <form className={styles.form} onSubmit={onSubmit}>
        <label className="visually-hidden" htmlFor="contact-name">
          {CONTACT_COPY.nameLabel}
        </label>
        <input
          id="contact-name"
          name="name"
          placeholder={CONTACT_COPY.nameLabel}
          autoComplete="name"
          required
          className={styles.input}
        />

        <label className="visually-hidden" htmlFor="contact-email">
          {CONTACT_COPY.emailLabel}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          placeholder={CONTACT_COPY.emailLabel}
          autoComplete="email"
          required
          className={styles.input}
        />

        <label className="visually-hidden" htmlFor="contact-message">
          {CONTACT_COPY.messageLabel}
        </label>
        <textarea
          id="contact-message"
          name="message"
          placeholder={CONTACT_COPY.messageLabel}
          rows={4}
          required
          className={styles.textarea}
        />

        {submitError && (
          <p className={styles.formError} role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={submitting}
        >
          {submitting ? CONTACT_COPY.sendingLabel : CONTACT_COPY.sendLabel}
        </button>
      </form>
    </div>
  );
}
