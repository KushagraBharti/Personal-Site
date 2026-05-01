import React, { useEffect, useState } from "react";
import { fetchPortfolioSnapshot, getCachedPortfolioSnapshot } from "../../api/portfolioApi";
import type { PortfolioProfile, PortfolioSocialLink } from "../../api/contracts";
import { portfolioSnapshotBootstrap } from "../../generated/portfolioSnapshotBootstrap";

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

const preferredLabels = ["Email", "LinkedIn", "GitHub", "X"];

const MiscSection: React.FC = () => {
  const [profile, setProfile] = useState<PortfolioProfile | null>(
    () => getCachedPortfolioSnapshot()?.profile ?? portfolioSnapshotBootstrap.profile
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const snapshot = await fetchPortfolioSnapshot(controller.signal);
        setProfile(snapshot.profile);
      } catch {
        if (!controller.signal.aborted) {
          // Keep the generated portfolio bootstrap if the live API is unavailable.
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

  return (
    <section className="misc-editorial" aria-labelledby="misc-title">
      <div className="misc-editorial__inner">
        <div className="misc-editorial__copy">
          <h2 id="misc-title" className="misc-editorial__title">
            <span>Let&apos;s build</span>
            <span>something</span>
            <span className="is-accent">meaningful.</span>
          </h2>
          <p className="misc-editorial__summary">
            Open to internships, research collaborations, and ambitious builds.
          </p>

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
        </div>

        <div className="misc-editorial__visual" aria-hidden="true">
          <div className="misc-editorial__orbit misc-editorial__orbit--far" />
          <div className="misc-editorial__orbit misc-editorial__orbit--outer" />
          <div className="misc-editorial__orbit misc-editorial__orbit--middle" />
          <div className="misc-editorial__orbit misc-editorial__orbit--inner" />
          <div className="misc-editorial__crosshair misc-editorial__crosshair--horizontal" />
          <div className="misc-editorial__crosshair misc-editorial__crosshair--vertical" />
          <div className="misc-editorial__cosmos" />
        </div>
      </div>

    </section>
  );
};

export default MiscSection;
