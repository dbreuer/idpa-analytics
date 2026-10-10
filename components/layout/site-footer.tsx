import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { governingOrganizations, mdlszDisciplines } from "@/lib/associations";
import type { DisciplineSlug } from "@/lib/disciplines";
import { methodologyPath, seasonPath } from "@/lib/discipline-paths";

export function SiteFooter({ disciplineSlug, year }: { disciplineSlug?: DisciplineSlug; year?: number }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-topline">
          <div>
            <p className="footer-wordmark">{disciplineSlug === "idpa" ? <>HERO OF <strong>IDPA.</strong></> : <>LÖVÉSZNAPLÓ <strong>STATISZTIKA.</strong></>}</p>
            <p className="footer-copy">Szezoneredmények, visszakövethető hivatalos forrásokkal.</p>
          </div>
          <div className="footer-orgs" aria-label="Sportszövetségek">
            {governingOrganizations.map((organization) => (
              <a
                key={organization.name}
                href={organization.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${organization.name} hivatalos honlapja`}
                className="footer-org-link"
              >
                <span className="footer-logo-plate">
                  <Image
                    src={organization.logo}
                    width={organization.width}
                    height={organization.height}
                    alt={organization.alt}
                    unoptimized={organization.logo.endsWith(".svg")}
                    className="footer-org-logo"
                  />
                </span>
                <span className="footer-org-name">{organization.name}</span>
                <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-[var(--footer-muted)]" />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-disciplines">
          <div className="footer-section-heading">
            <h2>Az MDLSZ szakágai</h2>
            <a href="https://mdlsz.com/" target="_blank" rel="noreferrer">A szövetség hivatalos honlapja</a>
          </div>
          <ul className="discipline-grid">
            {mdlszDisciplines.map((discipline) => (
              <li key={discipline.name}>
                <a
                  href={discipline.href}
                  target="_blank"
                  rel="noreferrer"
                  className="discipline-link"
                >
                  <span className="discipline-logo-plate">
                    <Image
                      src={discipline.logo}
                      width={discipline.width}
                      height={discipline.height}
                      alt={discipline.alt}
                      className="discipline-logo"
                    />
                  </span>
                  <span className="discipline-name">{discipline.name}</span>
                  <ArrowUpRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-[var(--footer-muted)]" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-bottom">
          <p>Adatforrások: az MDLSZ hivatalos versenynaptára és PDF-eredményjegyzékei.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {disciplineSlug && year ? (
              <Link href={seasonPath(disciplineSlug, year, "#data-quality")}>Adatminőség</Link>
            ) : null}
            {disciplineSlug ? <Link href={methodologyPath(disciplineSlug)}>Módszertan</Link> : null}
            <span>© {year ?? new Date().getFullYear()} Lövésznapló statisztika</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
