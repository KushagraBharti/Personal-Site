import React, { useEffect, useState } from "react";
import { fetchPortfolioSnapshot, getCachedPortfolioSnapshot } from "../../api/portfolioApi";
import type { PortfolioProfile, PortfolioSocialLink } from "../../api/contracts";

const getDisplayValue = (link: PortfolioSocialLink) => {
  if (link.label.toLowerCase() === "email") {
    return link.href.replace("mailto:", "");
  }

  try {
    const url = new URL(link.href);
    return url.pathname.replace(/\/+$/, "") || url.hostname;
  } catch {
    return link.href;
  }
};

const preferredLabels = ["Email", "LinkedIn", "GitHub"];

const MiscSection: React.FC = () => {
  const [profile, setProfile] = useState<PortfolioProfile | null>(
    () => getCachedPortfolioSnapshot()?.profile ?? null
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const snapshot = await fetchPortfolioSnapshot(controller.signal);
        setProfile(snapshot.profile);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load misc profile data:", error);
        }
      }
    };

    if (!profile) {
      void loadProfile();
    }

    return () => controller.abort();
  }, [profile]);

  if (!profile) return null;

  const contactLinks = preferredLabels
    .map((label) => profile.socialLinks.find((link) => link.label === label))
    .filter((link): link is PortfolioSocialLink => Boolean(link));

  const year = new Date().getFullYear();

  return (
    <section className="misc-editorial" aria-labelledby="misc-title">
      <div className="misc-editorial__inner">
        <div className="misc-editorial__copy">
          <h2 id="misc-title" className="misc-editorial__title">
            <span>Let&apos;s build</span>
            <span>something</span>
            <span className="is-accent">meaningful.</span>
          </h2>

          <div className="misc-editorial__dash" aria-hidden="true" />

          <div className="misc-editorial__contacts">
            {contactLinks.map((link) => (
              <div key={link.label} className="misc-editorial__contact-item">
                <p className="misc-editorial__contact-label">{link.label}</p>
                <a href={link.href} className="misc-editorial__contact-value" target={link.label === "Email" ? undefined : "_blank"} rel={link.label === "Email" ? undefined : "noreferrer"}>
                  {getDisplayValue(link)}
                </a>
              </div>
            ))}
          </div>

          <p className="misc-editorial__coordinates">25.2048° N, 55.2708° E</p>
        </div>

        <div className="misc-editorial__visual" aria-hidden="true">
          <div className="misc-editorial__orbit misc-editorial__orbit--outer" />
          <div className="misc-editorial__orbit misc-editorial__orbit--inner" />
          <div className="misc-editorial__crosshair misc-editorial__crosshair--horizontal" />
          <div className="misc-editorial__crosshair misc-editorial__crosshair--vertical" />
          <div className="misc-editorial__cosmos" />
        </div>
      </div>

      <p className="misc-editorial__footer">© {year} KB</p>
    </section>
  );
};

export default MiscSection;
