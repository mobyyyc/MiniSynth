import type { Metadata } from "next";
import Link from "next/link";
import { contactEmail, currentRelease } from "../site";

export const metadata: Metadata = {
  title: "Changelog",
  description: "NeuroWave app and model release notes for the Windows desktop application.",
  alternates: { canonical: "/changelog" },
  openGraph: {
    title: "NeuroWave changelog",
    description: "Release preparation notes for the NeuroWave Windows desktop app.",
    url: "/changelog",
  },
};

export default function ChangelogPage() {
  return (
    <main className="changelog-page">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="wordmark" href="/" aria-label="NeuroWave home">
          Neuro<span>Wave</span>
        </Link>
        <div className="nav-links">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/download">Windows release</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </nav>

      <section className="changelog-hero" aria-labelledby="changelog-heading">
        <p className="eyebrow reveal">Release notes</p>
        <div className="changelog-hero-grid">
          <h1 className="reveal reveal-one" id="changelog-heading">
            A clear record of<br />
            <em>what ships.</em>
          </h1>
          <p className="changelog-intro reveal reveal-two">
            NeuroWave publishes its Windows desktop release through GitHub. This page records
            what ships, how it was validated, and the remaining release considerations.
          </p>
        </div>
      </section>

      <section className="release-log" aria-labelledby="current-release-heading">
        <div className="release-log-head">
          <p>Current release</p>
          <p>{currentRelease.isPublic ? "Published" : "Preparing public release"}</p>
        </div>
        <article>
          <div className="release-version">{currentRelease.version}</div>
          <div className="release-summary">
            <h2 id="current-release-heading">Windows desktop app, available now.</h2>
            <p>{currentRelease.summary}</p>
          </div>
        </article>
        <ul className="release-items">
          <li><span>Installer</span><p>Windows x64 NSIS web installer, designed to download the large bundled runtime once during installation.</p></li>
          <li><span>Runtime</span><p>Bundled Python and CPU PyTorch runtime, tested through unpacked-app readiness and prediction smoke checks.</p></li>
          <li><span>Model</span><p>Bundled <strong>v3.6_noise_detune_ablation</strong> checkpoint, selected through frozen benchmarks and blind listening review.</p></li>
          <li><span>Validation</span><p>The v0.1.1 installer has not yet repeated the earlier release's clean-machine Windows Sandbox validation.</p></li>
        </ul>
      </section>

      <section className="publication-note" aria-labelledby="publication-heading">
        <p className="eyebrow">Release contents</p>
        <h2 id="publication-heading">The installer travels as a complete set.</h2>
        <p>
          The GitHub Release contains the bootstrap installer, its versioned payload, and the
          generated update metadata together. The installer downloads the payload once during
          installation; the desktop app then runs locally.
        </p>
        {currentRelease.isPublic && currentRelease.githubReleaseUrl ? (
          <a className="button button-primary" href={currentRelease.githubReleaseUrl}>
            Download NeuroWave {currentRelease.version}
          </a>
        ) : (
          <Link className="text-link publication-link" href="/">Return to overview <span aria-hidden="true">↓</span></Link>
        )}
      </section>

      <footer>
        <Link className="wordmark" href="/">Neuro<span>Wave</span></Link>
        <p>Audio is processed locally in the desktop app.</p>
        <p>Current model: v3.6_noise_detune_ablation</p>
        <a className="text-link" href={`mailto:${contactEmail}`}>Contact</a>
      </footer>
    </main>
  );
}
