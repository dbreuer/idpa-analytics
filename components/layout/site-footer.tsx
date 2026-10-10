import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { governingOrganizations, mdlszDisciplines } from "@/lib/associations";

export function SiteFooter({ year }: { year?: number }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-topline">
          <div>
            <p className="footer-wordmark">HERO OF <strong>IDPA.</strong></p>
            <p className="footer-copy">Season results, traceable to their official sources.</p>
          </div>
          <div className="footer-orgs" aria-label="Governing organizations">
            {governingOrganizations.map((organization) => (
              <a
                key={organization.name}
                href={organization.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Visit ${organization.name} website`}
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
            <h2>MDLSZ disciplines</h2>
            <a href="https://mdlsz.com/" target="_blank" rel="noreferrer">Official federation pages</a>
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
          <p>Source records: official MDLSZ competition calendar and result PDFs.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href={year ? `/${year}#data-quality` : "/"}>Data quality</Link>
            <Link href="/methodology">Methodology</Link>
            <span>© {year ?? new Date().getFullYear()} Hero of IDPA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
