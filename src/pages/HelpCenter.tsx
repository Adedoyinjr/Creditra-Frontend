import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useLocation } from "react-router-dom";
import { CopyToClipboard } from "../components/CopyToClipboard";
import SupportForm from "../components/SupportForm";
import { Tooltip } from "../components/Tooltip";
import { VideoThumbnail } from "../components/VideoThumbnail";
import { useActiveSection } from "../hooks/useActiveSection";
import { useReducedMotion } from "../context/ReducedMotionContext";
import "./HelpCenter.css";

const NAV_ITEMS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "wallet", label: "Wallet" },
  { id: "credit-lines", label: "Credit Lines" },
  { id: "transactions", label: "Transactions" },
  { id: "notifications", label: "Notifications" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "faq", label: "FAQ" },
] as const;

const categories = [
  { id: "getting-started", title: "Getting Started", desc: "Learn the basics of your account and credit setup." },
  { id: "wallet", title: "Wallet", desc: "Connect, verify, and troubleshoot supported Stellar wallets." },
  { id: "credit-lines", title: "Credit Lines", desc: "Understand draws, repayments, and account status changes." },
  { id: "transactions", title: "Transactions", desc: "Filter history, inspect hashes, and export records." },
  { id: "notifications", title: "Notifications", desc: "Manage alerts, preferences, and follow-up actions." },
  { id: "shortcuts", title: "Shortcuts", desc: "Learn the keyboard shortcuts available across the app." },
] as const;

interface FaqItem {
  id: string;
  sectionId: string;
  q: string;
  a: string;
  videoId?: string;
  transcriptUrl?: string;
}

const faqs: FaqItem[] = [
  {
    id: "what-is-creditra",
    sectionId: "getting-started",
    q: "What is Creditra?",
    a: "Creditra is a Stellar-based credit experience that helps you request, manage, and repay flexible credit lines from one dashboard.",
  },
  {
    id: "connect-wallet",
    sectionId: "wallet",
    q: "How do I connect a wallet?",
    a: "Open the wallet modal, choose a detected wallet, and approve the request in your extension. If a wallet is missing, the Help Center wallet section walks through supported options and troubleshooting.",
    videoId: "dQw4w9WgXcQ",
    transcriptUrl: "https://support.creditra.app/transcripts/connect-wallet",
  },
  {
    id: "repayments",
    sectionId: "credit-lines",
    q: "How do repayments work?",
    a: "Repayments reduce your current debt and are recorded in transaction history with their status, amount, and on-chain hash when available.",
    videoId: "9bZkp7q19f0",
  },
  {
    id: "transaction-filters",
    sectionId: "transactions",
    q: "Can I filter my transaction history by date?",
    a: "Yes. Use the preset chips for Today, 7d, 30d, or 90d, or switch to Custom to choose a specific date range.",
  },
  {
    id: "notifications-settings",
    sectionId: "notifications",
    q: "Where can I manage alerts and notifications?",
    a: "Open the notification center to review unread items, then use preferences to choose which categories should interrupt you.",
  },
  {
    id: "keyboard-shortcuts",
    sectionId: "shortcuts",
    q: "Which keyboard shortcuts are supported?",
    a: "Press ? outside text fields to open the shortcut overlay. Esc closes dialogs, and other shortcuts are grouped by surface inside the overlay.",
    transcriptUrl: "https://support.creditra.app/transcripts/keyboard-shortcuts",
  },
];

const SECTION_IDS = [...NAV_ITEMS.map((item) => item.id)];

export default function HelpCenter() {
  const location = useLocation();
  const rawHash = location.hash || (typeof window !== "undefined" ? window.location.hash : "");
  const hashId = rawHash.replace("#", "");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const activeSection = useActiveSection(SECTION_IDS);
  const navRef = useRef<HTMLElement>(null);
  const { isReducedMotionActive } = useReducedMotion();

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return faqs;

    return faqs.filter((item) =>
      [item.q, item.a, item.sectionId].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [searchQuery]);

  const activeFaqId = useMemo(() => {
    if (hashId && faqs.some((f) => f.id === hashId)) {
      return hashId;
    }
    return openFaqId;
  }, [hashId, openFaqId]);

  useEffect(() => {
    if (!location.hash) return;

    const targetId = location.hash.replace("#", "");
    const targetFaq = faqs.find((item) => item.id === targetId);
    if (targetFaq) {
      setOpenFaqId(targetFaq.id);
    }

    const target = document.getElementById(targetId);
    if (!target) return;

    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: isReducedMotionActive ? "instant" : "smooth",
        block: "start",
      });
    });
  }, [location.hash, isReducedMotionActive]);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      e.preventDefault();
      const target = document.getElementById(sectionId);
      if (!target) return;

      target.scrollIntoView({
        behavior: isReducedMotionActive ? "instant" : "smooth",
        block: "start",
      });
    },
    [isReducedMotionActive],
  );

  const handleFaqAnchorClick = useCallback(
    (_e: React.MouseEvent<HTMLAnchorElement>, faqId: string) => {
      setOpenFaqId(faqId);
      const target = document.getElementById(faqId);
      if (target) {
        target.scrollIntoView({
          behavior: isReducedMotionActive ? "instant" : "smooth",
          block: "start",
        });
      }
    },
    [isReducedMotionActive],
  );

  const handleFaqToggle = useCallback((faqId: string) => {
    setOpenFaqId((prev) => (prev === faqId ? null : faqId));
  }, []);

  return (
    <div className="help-center">
      <div className="help-center__layout">
        <nav ref={navRef} className="help-center__nav" aria-label="Help topics">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="help-center__nav-link"
              aria-current={activeSection === item.id ? "true" : undefined}
              onClick={(e) => handleNavClick(e, item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="help-center__content">
          <h1 className="help-center__title">Help Center</h1>
          <p className="help-center__subtitle">
            Browse help topics, wallet walkthroughs, and keyboard tips without
            loading third-party media until you ask for it.
          </p>

          <div className="help-center__search">
            <Search className="help-center__search-icon" />
            <input
              className="help-center__search-input"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="help-center__grid">
            {categories.map((cat) => (
              <div key={cat.id} id={cat.id} className="help-center__card">
                <h3 className="help-center__card-title">{cat.title}</h3>
                <p className="help-center__card-desc">{cat.desc}</p>
              </div>
            ))}
          </div>

          <div className="help-center__support">
            <h2 className="help-center__support-title">Contact Support</h2>
            <p className="help-center__support-subtitle">
              Send us details about your issue. Attach a file if it helps (logs, screenshots, PDFs).
            </p>

            <SupportForm
              onSubmit={async () => {
                // This screen only demonstrates the form; the caller can wire to a real API.
              }}
              maxAttachmentBytes={5 * 1024 * 1024}
              acceptedAttachmentTypes={[".png", ".jpg", ".jpeg", ".pdf"]}
            />
          </div>

          <div id="faq" className="help-center__faq">
            <h2 className="help-center__faq-title">FAQ</h2>

            {filteredFaqs.map((item) => {
              const isOpen = openFaqId === item.id;
              const isCurrent = activeFaqId === item.id;

              return (
                <div key={item.id} id={item.id} className="help-center__faq-item">
                  <div className="help-center__faq-header">
                    <Tooltip label="Copy link"><a
                      href={`#${item.id}`}
                      className="help-center__faq-anchor"
                      aria-current={isCurrent ? "true" : undefined}
                      aria-label={`Direct link to FAQ: ${item.q}`}
                      onClick={(e) => handleFaqAnchorClick(e, item.id)}
                    >
                      #
                      </a>
                    </Tooltip>
                    <button
                      onClick={() => handleFaqToggle(item.id)}
                      className="help-center__faq-btn"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${item.id}`}
                      aria-current={isCurrent ? "true" : undefined}
                    >
                      <span>
                        <span className="help-center__faq-q">{item.q}</span>
                        <span className="help-center__faq-category">
                          {categories.find((category) => category.id === item.sectionId)?.title}
                        </span>
                      </span>
                      <ChevronDown
                        className={`help-center__faq-chevron${isOpen ? " help-center__faq-chevron--open" : ""}`}
                      />
                    </button>
                  </div>
                  {isOpen && (
                    <div id={`faq-answer-${item.id}`} className="help-center__faq-answer">
                      <p>{item.a}</p>
                      <CopyToClipboard
                        value={item.a}
                        ariaLabel={`Copy answer for ${item.q}`}
                        copyLabel="Copy answer"
                        copiedLabel="Answer copied"
                        errorLabel="Copy failed"
                        className="help-center__faq-copy"
                      />
                      {item.videoId && (
                        <VideoThumbnail
                          title={item.q}
                          videoId={item.videoId}
                          transcriptUrl={item.transcriptUrl}
                        />
                      )}
                      {!item.videoId && item.transcriptUrl && (
                        <a
                          href={item.transcriptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="help-center__faq-transcript"
                        >
                          Read transcript
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredFaqs.length === 0 && (
              <p className="help-center__empty">
                No help articles match that search yet. Try "wallet", "shortcut",
                or "transactions".
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
