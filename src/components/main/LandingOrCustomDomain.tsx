import { useState, useEffect } from "react";
import { LandingPage } from "./LandingPage";
import { PanchayatWebsite } from "../public/PanchayatWebsite";
import { publicAPI } from "../../services/api";

const MAIN_DOMAINS = [
  "localhost",
  "127.0.0.1",
  import.meta.env.VITE_APP_DOMAIN as string | undefined,
].filter(Boolean) as string[];

function isMainDomain(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (MAIN_DOMAINS.some((d) => h === d || h.endsWith("." + d))) return true;
  return false;
}

export function LandingOrCustomDomain() {
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    if (isMainDomain(hostname)) {
      setResolvedSlug(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    publicAPI
      .getPanchayatByDomain(hostname)
      .then((data: any) => {
        if (cancelled) return;
        const slug = data?.slug ?? data?.data?.slug;
        if (slug) {
          setResolvedSlug(slug);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F5] p-4">
        <h1 className="text-xl font-semibold text-[#1B2B5E]">Panchayat not found</h1>
        <p className="mt-2 text-sm text-[#666]">
          No panchayat is configured for this domain.
        </p>
      </div>
    );
  }

  if (resolvedSlug) {
    return <PanchayatWebsite effectiveSlug={resolvedSlug} />;
  }

  return <LandingPage />;
}
