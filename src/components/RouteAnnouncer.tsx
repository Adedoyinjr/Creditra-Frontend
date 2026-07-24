import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode, ReactElement } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

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

export function RouteAnnouncer() {
  const location = useLocation();
  const headCtx = useContext(RouteHeadContext);
  const override = headCtx?.head;
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const metadata = getRouteMetadata(location.pathname);
    const title = titleFor(metadata.pageName);
    useDocumentTitle(title, metadata.description);
    setAnnouncement(`${metadata.pageName} page loaded`);
  }, [location.pathname]);

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );
}
