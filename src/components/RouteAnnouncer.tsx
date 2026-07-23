import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode, ReactElement } from "react";
import { matchPath, useLocation } from "react-router-dom";

type RouteMetadata = {
  path: string;
  pageName: string;
  description: string;
};

export const ROUTE_METADATA: RouteMetadata[] = [
  {
    path: "/landing",
    pageName: "Landing",
    description:
      "Explore Creditra's credit marketplace for borrowers and liquidity providers.",
  },
  {
    path: "/",
    pageName: "Dashboard",
    description:
      "Review your Creditra portfolio, credit utilization, risk score, and repayment activity.",
  },
  {
    path: "/credit-lines",
    pageName: "Credit Lines",
    description:
      "Manage available Creditra credit lines, balances, limits, and repayment status.",
  },
  {
    path: "/draw-credit",
    pageName: "Draw Credit",
    description:
      "Select an active credit line and draw available funds from your Creditra account.",
  },
  {
    path: "/draw-credit/success",
    pageName: "Draw Credit Success",
    description:
      "Review confirmation details for your completed Creditra credit draw.",
  },
  {
    path: "/open-credit",
    pageName: "Request Evaluation",
    description:
      "Request a Creditra credit evaluation to open a new borrower credit line.",
  },
  {
    path: "/transactions",
    pageName: "Transaction History",
    description:
      "Search, filter, and export your Creditra deposits, draws, repayments, and fees.",
  },
  {
    path: "/help",
    pageName: "Help Center",
    description:
      "Find Creditra support articles, wallet guidance, FAQs, and product walkthroughs.",
  },
  {
    path: "/dutch-auctions",
    pageName: "Dutch Auctions",
    description:
      "Monitor Creditra Dutch auction opportunities, bids, clearing prices, and market activity.",
  },
];

export const NOT_FOUND_METADATA: Omit<RouteMetadata, "path"> = {
  pageName: "Not Found",
  description:
    "The requested Creditra page could not be found. Return to the dashboard or try another route.",
};

const titleFor = (pageName: string) => `Creditra · ${pageName}`;

const getRouteMetadata = (pathname: string) =>
  ROUTE_METADATA.find((route) =>
    matchPath({ path: route.path, end: true }, pathname),
  ) ?? NOT_FOUND_METADATA;

const syncMetaDescription = (description: string) => {
  let metaDescription = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );

  // Keep a single native description tag current without adding a head manager.
  if (!metaDescription) {
    metaDescription = document.createElement("meta");
    metaDescription.name = "description";
    document.head.append(metaDescription);
  }

  metaDescription.content = description;
};

// ─── Per-route override (Issue #451) ────────────────────────────────────────
//
// Some pages carry sub-state - onboarding steps, wizard stages, filtered
// lists - where the same URL maps to dramatically different content over
// time.  The centre-of-mass metadata captured in `ROUTE_METADATA` is a
// useful default but cannot describe a "filtered down to two credit
// lines" transactions view, or an OnboardingFlow mid-step.
//
// Pages that need richer announcements push a `RouteHead` via
// `useRouteHead({...})`.  The provider is intentionally lightweight so
// pages do not have to import the context directly - the consumer hook
// reads context if present and silently does nothing otherwise.
//
// Implementation note: the Provider component is bound to a const
// before JSX (`const Provider = RouteHeadContext.Provider`) so the
// emit does not depend on `<Context.Provider>` syntax.  Both forms are
// valid TSX, but the bound-form keeps the parse predictable across
// all bundlers including vite + esbuild.

export type RouteHead = {
  /** Override the document title (`<title>` tag). */
  title?: string;
  /** Override the `<meta name="description">` content. */
  description?: string;
  /** Override the polite live-region announcement text. */
  announcement?: string;
};

interface RouteHeadContextValue {
  head: RouteHead | undefined;
  setHead: (next: RouteHead | undefined) => void;
}

const RouteHeadContext = createContext<RouteHeadContextValue | undefined>(
  undefined,
);

/**
 * `RouteHeadProvider` - wrap children once (the App.tsx boundary).
 * The provider supplies the *most recent* override; overrides are
 * reset on unmount of `useRouteHead`.
 */
export function RouteHeadProvider(props: {
  initialHead?: RouteHead;
  children: ReactNode;
}): ReactElement {
  const [head, setHead] = useState<RouteHead | undefined>(props.initialHead);
  const Provider = RouteHeadContext.Provider;
  return (
    <Provider value={{ head, setHead }}>
      {props.children}
    </Provider>
  );
}

/**
 * Push per-route head/announcement metadata.  Re-renders when `head`
 * changes, and clears the override on unmount so consumers do not
 * leak stale title/description from a sibling page that was visited
 * earlier.
 */
export function useRouteHead(head: RouteHead | undefined): void {
  const ctx = useContext(RouteHeadContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setHead(head);
    return () => ctx.setHead(undefined);
    // We intentionally exclude `ctx` from deps - the context object
    // is stable across renders for the same provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [head?.title, head?.description, head?.announcement]);
}

// ─── Announcer ──────────────────────────────────────────────────────────────

/**
 * RouteAnnouncer - announces the current route to assistive tech and
 * keeps the document title + meta description in sync with the URL.
 *
 * Resolution order for the announcement text:
 *
 *   1. The most-recent `useRouteHead({ announcement })` override.
 *   2. The matching entry from `ROUTE_METADATA`, formatted as
 *      "${pageName} page loaded".
 *   3. The `NOT_FOUND_METADATA` fallback.
 *
 * Document title and meta description follow the same priority
 * (`useRouteHead` wins, then `ROUTE_METADATA`, then Not Found).
 */
export function RouteAnnouncer(): ReactElement {
  const location = useLocation();
  const headCtx = useContext(RouteHeadContext);
  const override = headCtx?.head;
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const metadata = getRouteMetadata(location.pathname);

    const title = override?.title ?? titleFor(metadata.pageName);
    const description = override?.description ?? metadata.description;
    const nextAnnouncement =
      override?.announcement ?? `${metadata.pageName} page loaded`;

    document.title = title;
    syncMetaDescription(description);
    setAnnouncement(nextAnnouncement);
  }, [location.pathname, override]);

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );
}
