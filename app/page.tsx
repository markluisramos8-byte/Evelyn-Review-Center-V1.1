import Link from "next/link";
import { Bow, Heart } from "@/components/Decor";

const reviewModes = [
  {
    name: "Evelyn Cards",
    description: "Create decks, add cards, and review them with fast question-and-answer practice.",
    href: "/evelyn-cards",
    accent: "pink",
  },
  {
    name: "More tools",
    description: "Coming soon: new ways to study, review, and keep growing together.",
    href: "#",
    accent: "soft",
    disabled: true,
  },
];

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="brand" style={{ fontSize: "clamp(1.8rem, 7vw, 2.8rem)" }}>
          <Bow size={40} />
          <div>
            Evelyn Review Center <Heart size={18} />
            <small>made with love by ur lover</small>
          </div>
        </div>
      </header>

      <div className="mini-bubble">Your study space, your pace, your love.</div>

      <section className="hero">
        <div>
          <h1>Pick your review mode</h1>
          <p>Choose the tool you want to use today. More review modes can be added here later.</p>
        </div>
      </section>

      <div className="mode-grid">
        {reviewModes.map((mode) => {
          const content = (
            <div className={`mode-card ${mode.accent} ${mode.disabled ? "disabled" : ""}`}>
              <div className="mode-badge">{mode.name}</div>
              <p>{mode.description}</p>
            </div>
          );

          if (mode.disabled) {
            return <div key={mode.name} className="mode-tile-container">{content}</div>;
          }

          return (
            <Link key={mode.name} href={mode.href} className="mode-link mode-tile-container">
              {content}
            </Link>
          );
        })}
      </div>
    </>
  );
}
