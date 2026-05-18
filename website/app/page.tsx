import { Github } from "lucide-react";
import Image from "next/image";

const GITHUB_URL = "https://github.com/gssisaac/pure-mac";
const RELEASES_URL = "https://github.com/gssisaac/pure-mac/releases";

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15V3" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="site">
      <div className="site-inner">
        <header className="site-nav">
          <div className="brand-lockup">
            <Image
              className="brand-icon"
              src="/icon.png"
              alt=""
              width={36}
              height={36}
            />
            <span className="brand-wordmark">PureMac</span>
          </div>
          <nav className="nav-actions" aria-label="Site">
            <span className="pill-free">
              <span className="pill-free-dot" aria-hidden />
              Free & open source
            </span>
            <a
              className="btn-ghost-nav"
              href={GITHUB_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github size={16} strokeWidth={2} aria-hidden />
              GitHub
            </a>
          </nav>
        </header>

        <main>
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-glow" aria-hidden />
            <div className="hero-grid">
              <div className="hero-copy">
                <p className="hero-kicker">
                  Made for Apple Silicon & Intel Macs
                </p>
                <h1 id="hero-title" className="hero-title">
                  See what is using your Mac storage—then reclaim it with
                  confidence.
                </h1>
                <p className="hero-lead">
                  PureMac is a native desktop app that maps disk usage, runs a
                  structured system scan, and surfaces large or cache-heavy
                  items across your home folder. Review results in a clear
                  dashboard, drill into categories, and remove only what you
                  choose—your data stays on your machine.
                </p>
                <div className="hero-actions">
                  <a
                    className="btn-download"
                    href={RELEASES_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <DownloadIcon className="dl-ico" />
                    <span className="dl-label">Download for macOS</span>
                  </a>
                  <a
                    className="btn-ghost-nav"
                    href={GITHUB_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Github size={16} strokeWidth={2} aria-hidden />
                    Source & issues on GitHub
                  </a>
                </div>
                <p className="hero-download-note">
                  Grab the latest signed DMG from{" "}
                  <a
                    href={RELEASES_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    GitHub Releases
                  </a>
                  . Prefer to build yourself? Run{" "}
                  <code className="mono">pnpm tauri:build</code>.
                </p>
              </div>
              <figure className="hero-visual">
                <Image
                  className="hero-product"
                  src="/assets/puremac.webp"
                  alt="PureMac app window showing disk usage"
                  width={960}
                  height={600}
                  priority
                />
              </figure>
            </div>
          </section>

          <section
            className="section intro-video-section"
            aria-label="Product preview video"
          >
            <div className="intro-video-card">
              <video
                className="intro-video"
                src="/assets/intro-video.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              >
                Your browser does not support embedded video.
              </video>
            </div>
          </section>

          <section className="section" aria-labelledby="why-title">
            <h2 id="why-title" className="section-title">
              Why PureMac exists
            </h2>
            <p className="section-lead">
              macOS makes it surprisingly hard to answer a simple question:{" "}
              <strong>where did my disk go?</strong>
              Finder and About This Mac hint at totals, but they do not show
              which caches, downloads, developer folders, or old projects are
              responsible. PureMac is a focused companion for that job—offline,
              understandable, and under your control.
            </p>
            <div className="feature-grid">
              <article className="feature-card">
                <div className="feature-icon" aria-hidden>
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3" />
                    <path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
                  </svg>
                </div>
                <h3>Dashboard clarity</h3>
                <p>
                  Capacity, used versus free space, and category breakdowns
                  mirror the in-app dashboard so you always start from the big
                  picture.
                </p>
              </article>
              <article className="feature-card">
                <div className="feature-icon" aria-hidden>
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                    <path d="M11 8v6" />
                    <path d="M8 11h6" />
                  </svg>
                </div>
                <h3>Guided system scan</h3>
                <p>
                  Launch a scan that walks key locations under your home
                  directory, then review everything in a sortable results view.
                </p>
              </article>
              <article className="feature-card">
                <div className="feature-icon" aria-hidden>
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h3>Review before you delete</h3>
                <p>
                  Inspect paths, sizes, and risk hints. Nothing is removed until
                  you explicitly confirm—no silent cleaners or cloud uploads.
                </p>
              </article>
              <article className="feature-card">
                <div className="feature-icon" aria-hidden>
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </svg>
                </div>
                <h3>Local & transparent</h3>
                <p>
                  Built with Tauri (Rust + web UI) so the app stays fast and
                  easy to audit. Grant Full Disk Access only if you want the
                  deepest scan coverage.
                </p>
              </article>
            </div>
          </section>

          <section className="split" aria-labelledby="cta-title">
            <div className="split-row">
              <div>
                <h2
                  id="cta-title"
                  className="section-title"
                  style={{ marginBottom: 8 }}
                >
                  Install the latest DMG
                </h2>
                <p className="split-copy">
                  The project is <strong>free forever</strong> and developed in
                  public on{" "}
                  <a
                    href={GITHUB_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    github.com/gssisaac/pure-mac
                  </a>
                  . Download the signed disk image for the current version, or
                  build from source if you prefer.
                </p>
              </div>
              <a
                className="btn-download"
                href={RELEASES_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                <DownloadIcon className="dl-ico" />
                <span className="dl-label">Download PureMac</span>
              </a>
            </div>
          </section>
        </main>
      </div>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <span>© PureMac contributors — open source on GitHub.</span>
          <a href={GITHUB_URL} rel="noopener noreferrer" target="_blank">
            github.com/gssisaac/pure-mac
          </a>
        </div>
      </footer>
    </div>
  );
}
