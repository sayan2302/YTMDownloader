import { Info, Music, ShieldAlert, Cpu, Terminal, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import './AboutPage.css';

export default function AboutPage({ systemStatus }) {
  const version = "1.0.19";

  const getOSName = () => {
    const userAgent = window.navigator.userAgent;
    if (userAgent.indexOf("Win") !== -1) return "Windows";
    if (userAgent.indexOf("Mac") !== -1) return "macOS";
    if (userAgent.indexOf("Linux") !== -1) return "Linux";
    return "Linux/Unix";
  };

  return (
    <div className="about-page">
      <div className="about-hero liquid-glass">
        <div className="about-hero-logo">
          <h2>YTM<span>Downloader</span></h2>
          <span className="version-badge">v{version}</span>
        </div>
        <p className="subtitle">
          An elegant, ad-free self-hosted audio player and downloader built around YouTube Music.
        </p>
      </div>

      <div className="about-grid">
        {/* Core Features */}
        <section className="about-section liquid-glass">
          <h3 className="section-title"><Music size={20} className="sec-icon" /> Core Features</h3>
          <ul className="features-list">
            <li>
              <strong>Ad-Free Streaming</strong>
              <span>Direct, gapless music streaming with background playback controls.</span>
            </li>
            <li>
              <strong>Lossless & Compressed Formats</strong>
              <span>Transcode downloads instantly into high-quality <strong>M4A (AAC)</strong> or <strong>MP3</strong> audio files.</span>
            </li>
            <li>
              <strong>Smart Metadata & Lyrics Tagging</strong>
              <span>Embeds cover art, artists, album names, and full lyrics (if available) into the audio file tags.</span>
            </li>
            <li>
              <strong>Smart Resume Queue</strong>
              <span>Skips songs that have already been downloaded to avoid duplication and save bandwidth.</span>
            </li>
          </ul>
        </section>

        {/* System & Dependencies Status */}
        <section className="about-section liquid-glass">
          <h3 className="section-title"><Cpu size={20} className="sec-icon" /> System Dependencies</h3>
          <div className="dependency-card">
            <div className="dep-item">
              <div className="dep-info">
                <strong>FFmpeg</strong>
                <span>Handles metadata tagging and audio transcoding</span>
              </div>
              <span className={`status-pill ${systemStatus.ffmpeg === 'ready' ? 'ready' : 'failed'}`}>
                {systemStatus.ffmpeg === 'ready' ? (
                  <><CheckCircle2 size={14} /> Ready</>
                ) : (
                  <><AlertTriangle size={14} /> Failed</>
                )}
              </span>
            </div>

            <div className="dep-item">
              <div className="dep-info">
                <strong>yt-dlp</strong>
                <span>Manages audio streaming and download pipelines</span>
              </div>
              <span className={`status-pill ${systemStatus.ytDlp === 'ready' ? 'ready' : 'failed'}`}>
                {systemStatus.ytDlp === 'ready' ? (
                  <><CheckCircle2 size={14} /> Ready</>
                ) : (
                  <><AlertTriangle size={14} /> Failed</>
                )}
              </span>
            </div>
            
            <div className="dep-footer">
              <Terminal size={14} />
              <span>Running globally on <strong>{getOSName()}</strong></span>
            </div>
          </div>
        </section>
      </div>

      {/* Usage Section */}
      <section className="about-section usage-section liquid-glass">
        <h3 className="section-title"><Terminal size={20} className="sec-icon" /> Quick CLI Reference</h3>
        <p>You can run this entire application globally at any time using the npm executable command:</p>
        <div className="code-block">
          <code>npx @supasayan/openspot</code>
        </div>
      </section>

      {/* Legal & Disclaimer */}
      <footer className="about-disclaimer liquid-glass">
        <h4 className="disc-title">
          <ShieldAlert size={16} /> Disclaimer & Legal Info
        </h4>
        <p>
          OpenSpot is an open-source, self-hosted educational project meant strictly for personal backups and offline listening. 
          This tool is not affiliated with, authorized, or endorsed by Google LLC, YouTube, or YouTube Music. 
          Please respect the copyright and terms of service of the creators and platforms from which you stream.
        </p>
        <div className="links">
          <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noopener noreferrer">
            yt-dlp GitHub <ExternalLink size={12} />
          </a>
          <a href="https://github.com/lucas-lh/ytmusic-api" target="_blank" rel="noopener noreferrer">
            ytmusic-api <ExternalLink size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}
