export type ViewId = "services" | "work" | "contact";

export const NAV_ITEMS: ReadonlyArray<{ id: ViewId; label: string }> = [
  { id: "services", label: "Services" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
];

export const HERO_WORD = "webiko.dev";

export const NOSCRIPT_MESSAGE = "Please enable JavaScript to view this site.";

export const NAV_LABELS = {
  back: "← Back",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  nav: "Main",
};

export const SERVICES: ReadonlyArray<{ title: string; description: string }> = [
  {
    title: "Design → code",
    description:
      "Pixel-perfect, every time — spacing, motion and states matched to the file, not eyeballed.",
  },
  {
    title: "Rapid prototyping",
    description:
      "Blank canvas to a clickable build in days. Fast enough to test an idea before it's fully specced.",
  },
  {
    title: "WordPress",
    description:
      "Custom themes, plugins and headless builds — we've shipped more WordPress sites than we can count.",
  },
  {
    title: "Laravel",
    description:
      "Full-stack PHP, battle-tested since Laravel 6. APIs, admin panels, queues — the plumbing that keeps things running.",
  },
  {
    title: "React & frontend architecture",
    description:
      "One of us led a React team before we started Webiko. Component systems and state built to be handed off, not just handed in.",
  },
];

export const WORK_STACK: readonly string[] = [
  "WordPress",
  "Laravel",
  "PHP",
  "React",
  "Next.js",
  "TypeScript",
  "Figma → code",
];

export const WORK_COPY = {
  intro:
    "Webiko is a micro team — a couple of us, not an agency with layers between you and the code. Between us: agency work, product work, a stint leading a React team, and years split across WordPress, Laravel and React. Small enough to move fast, senior enough to skip the hand-holding.",
  note: "Full case studies are on their way. In the meantime, get in touch and we'll walk you through recent work directly.",
};

export const CONTACT_COPY = {
  intro:
    "Got a project, or just a question? You'll hear back from one of us directly — no account managers in between.",
  thanks: "Thanks — we'll be in touch.",
  error: "Something went wrong — please try again, or email us directly.",
  nameLabel: "Name",
  emailLabel: "Email",
  messageLabel: "Message",
  sendLabel: "Send",
  sendingLabel: "Sending…",
};
