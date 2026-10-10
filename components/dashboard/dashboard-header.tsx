"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ListFilter, Menu, X } from "lucide-react";

import { dashboardSections, isDashboardSectionId, type DashboardSectionId } from "@/lib/site-navigation";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  year: number;
  availableYears: number[];
  competitionOptions: Array<{ id: string; name: string }>;
  divisionOptions: string[];
  clubOptions: string[];
  competition: string;
  division: string;
  club: string;
  onCompetitionChange: (value: string) => void;
  onDivisionChange: (value: string) => void;
  onClubChange: (value: string) => void;
}

const filterSelectClass =
  "min-w-0 w-full appearance-none rounded-[0.65rem] border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 pr-8 text-sm text-[var(--ink)] outline-none transition-colors hover:border-[var(--ink-muted)] focus-visible:border-[var(--signal)] focus-visible:ring-2 focus-visible:ring-[var(--signal)]/20";
const filterLabelClass =
  "block min-w-0 text-[0.67rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]";

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className={filterLabelClass} htmlFor={id}>
      {label}
      <span className="relative mt-1.5 block">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={filterSelectClass}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
      </span>
    </label>
  );
}

export function DashboardHeader({
  year,
  availableYears,
  competitionOptions,
  divisionOptions,
  clubOptions,
  competition,
  division,
  club,
  onCompetitionChange,
  onDivisionChange,
  onClubChange,
}: DashboardHeaderProps) {
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSectionId>("overview");
  const [headerHeight, setHeaderHeight] = useState(0);
  const activeFilterCount = [
    competition !== "all",
    division !== "all",
    club !== "all",
  ].filter(Boolean).length;

  useEffect(() => {
    const element = headerRef.current;
    if (!element) return;

    const updateHeight = () => {
      const height = Math.ceil(element.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--site-header-height", `${height}px`);
      setHeaderHeight((current) => (current === height ? current : height));
    };
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    updateHeight();

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--site-header-height");
    };
  }, []);

  useEffect(() => {
    const sections = dashboardSections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top - headerHeight) -
              Math.abs(b.boundingClientRect.top - headerHeight),
          )[0];
        const sectionId = current?.target.id;
        if (sectionId && isDashboardSectionId(sectionId)) setActiveSection(sectionId);
      },
      {
        rootMargin: `-${headerHeight}px 0px -62% 0px`,
        threshold: [0, 0.15, 0.35],
      },
    );
    sections.forEach((section) => observer.observe(section));
    const updateFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (isDashboardSectionId(hash)) setActiveSection(hash);
    };

    window.addEventListener("hashchange", updateFromHash);
    updateFromHash();
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", updateFromHash);
    };
  }, [headerHeight]);

  const selectClasses =
    "rounded-[0.65rem] border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-sm font-bold tabular-nums text-[var(--ink)] outline-none focus-visible:border-[var(--signal)] focus-visible:ring-2 focus-visible:ring-[var(--signal)]/20";

  const handleSectionClick = (section: DashboardSectionId) => {
    setActiveSection(section);
    setNavigationOpen(false);
  };

  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <header ref={headerRef} className="site-header">
        <div className="filter-bar">
          <div className="filter-bar-inner">
            <div className="hidden w-full grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1fr)] items-end gap-3 lg:grid lg:gap-5">
              <FilterSelect
                id="competition-filter"
                label="Competition"
                value={competition}
                options={[
                  { value: "all", label: "All competitions" },
                  ...competitionOptions.map((option) => ({ value: option.id, label: option.name })),
                ]}
                onChange={onCompetitionChange}
              />
              <FilterSelect
                id="division-filter"
                label="Division"
                value={division}
                options={divisionOptions.map((option) => ({ value: option, label: option === "all" ? "All divisions" : option }))}
                onChange={onDivisionChange}
              />
              <FilterSelect
                id="club-filter"
                label="Club"
                value={club}
                options={clubOptions.map((option) => ({ value: option, label: option === "all" ? "All clubs" : option }))}
                onChange={onClubChange}
              />
            </div>

            <div className="lg:hidden">
              <button
                type="button"
                aria-expanded={filtersOpen}
                aria-controls="mobile-filters"
                onClick={() => {
                  setFiltersOpen((open) => !open);
                  setNavigationOpen(false);
                }}
                className="flex min-h-10 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-[var(--ink)]"
              >
                <span className="inline-flex items-center gap-2">
                  <ListFilter aria-hidden="true" className="h-4 w-4 text-[var(--signal)]" />
                  Filters
                  <span className="rounded-sm bg-[var(--signal)] px-1.5 py-0.5 text-xs tabular-nums text-white">{activeFilterCount}</span>
                </span>
                <span className="max-w-[65%] truncate text-xs font-medium text-[var(--ink-muted)]">
                  {competition === "all" ? "All competitions" : competitionOptions.find((option) => option.id === competition)?.name}
                  {division !== "all" ? ` · ${division}` : ""}
                  {club !== "all" ? ` · ${club}` : ""}
                </span>
              </button>
              {filtersOpen && (
                <div id="mobile-filters" className="max-h-[55svh] overflow-y-auto border-t border-[var(--rule)] py-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FilterSelect
                      id="mobile-competition-filter"
                      label="Competition"
                      value={competition}
                      options={[
                        { value: "all", label: "All competitions" },
                        ...competitionOptions.map((option) => ({ value: option.id, label: option.name })),
                      ]}
                      onChange={onCompetitionChange}
                    />
                    <FilterSelect
                      id="mobile-division-filter"
                      label="Division"
                      value={division}
                      options={divisionOptions.map((option) => ({ value: option, label: option === "all" ? "All divisions" : option }))}
                      onChange={onDivisionChange}
                    />
                    <FilterSelect
                      id="mobile-club-filter"
                      label="Club"
                      value={club}
                      options={clubOptions.map((option) => ({ value: option, label: option === "all" ? "All clubs" : option }))}
                      onChange={onClubChange}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="nav-bar">
          <div className="nav-bar-inner">
            <Link
              href={`/${year}#overview`}
              onClick={() => handleSectionClick("overview")}
              aria-label={`Hero of IDPA ${year}, overview`}
              className="brand-mark"
            >
              <span className="brand-mark-top">HERO OF</span>
              <span className="brand-mark-bottom">IDPA<span className="brand-period">.</span></span>
            </Link>

            <nav aria-label="Dashboard sections" className="hidden xl:block">
              <ul className="flex items-center gap-1">
                {dashboardSections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      aria-current={activeSection === section.id ? "location" : undefined}
                      onClick={() => handleSectionClick(section.id)}
                      className={cn("section-nav-link", activeSection === section.id && "section-nav-link-active")}
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                aria-expanded={navigationOpen}
                aria-controls="mobile-navigation"
                onClick={() => {
                  setNavigationOpen((open) => !open);
                  setFiltersOpen(false);
                }}
                className="mobile-nav-toggle"
              >
                {navigationOpen ? <X aria-hidden="true" className="h-4 w-4" /> : <Menu aria-hidden="true" className="h-4 w-4" />}
                <span className="sr-only">{navigationOpen ? "Close sections" : "Open sections"}</span>
              </button>
              <label className="season-select-label" htmlFor="season-selector">
                Season
                <select
                  id="season-selector"
                  value={year}
                  onChange={(event) => {
                    const section = window.location.hash;
                    router.push(`/${event.target.value}${section}`);
                  }}
                  className={selectClasses}
                >
                  {availableYears.map((season) => (
                    <option key={season} value={season}>{season}</option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
              </label>
            </div>
          </div>
          {navigationOpen && (
            <nav id="mobile-navigation" aria-label="Dashboard sections" className="mobile-nav-panel xl:hidden">
              {dashboardSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  aria-current={activeSection === section.id ? "location" : undefined}
                  onClick={() => handleSectionClick(section.id)}
                  className={cn("section-nav-link", activeSection === section.id && "section-nav-link-active")}
                >
                  {section.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
