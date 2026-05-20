import React, { useEffect, useMemo, useState } from "react";
import { fetchPortfolioSnapshot, getCachedPortfolioSnapshot } from "../../api/portfolioApi";
import type { PortfolioAboutContent, PortfolioWriting } from "../../api/contracts";
import PortfolioImage from "../../components/PortfolioImage";
import { portfolioSnapshotBootstrap } from "../../generated/portfolioSnapshotBootstrap";

const FEATURED_WRITING_LIMIT = 4;

const renderInlineMarkdown = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

export const WritingMarkdownPreview: React.FC<{ markdown: string }> = ({ markdown }) => {
  const lines = markdown.split("\n");
  const blocks: React.ReactNode[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;

    if (line.startsWith("# ")) {
      blocks.push(<h4 key={index}>{line.slice(2)}</h4>);
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(<h5 key={index}>{line.slice(3)}</h5>);
      continue;
    }

    if (line.startsWith("> ")) {
      blocks.push(<blockquote key={index}>{renderInlineMarkdown(line.slice(2))}</blockquote>);
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      let itemIndex = index;

      while (itemIndex < lines.length && lines[itemIndex].trim().startsWith("- ")) {
        items.push(lines[itemIndex].trim().slice(2));
        itemIndex += 1;
      }

      blocks.push(
        <ul key={index}>
          {items.map((item) => (
            <li key={item}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      );
      index = itemIndex - 1;
      continue;
    }

    blocks.push(<p key={index}>{renderInlineMarkdown(line)}</p>);
  }

  return <div className="about-editorial__markdown">{blocks}</div>;
};

export const FeaturedWritingList: React.FC<{ writings: PortfolioWriting[] }> = ({ writings }) => {
  const featuredWritings = useMemo(
    () => (writings ?? []).slice(0, FEATURED_WRITING_LIMIT),
    [writings],
  );
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const activeWriting =
    featuredWritings.find((writing) => writing.slug === activeSlug) ?? null;

  useEffect(() => {
    if (activeSlug && !featuredWritings.some((writing) => writing.slug === activeSlug)) {
      setActiveSlug(null);
    }
  }, [activeSlug, featuredWritings]);

  if (!featuredWritings.length) return null;

  return (
    <div className="about-editorial__values">
      <p className="about-editorial__values-heading">{`{ values / beliefs / writings / thoughts }`}</p>
      <div className="about-editorial__writing-grid">
        <ul className="about-editorial__writing-list" aria-label="Featured writings">
          {featuredWritings.map((writing, index) => {
            const number = String(index + 1).padStart(2, "0");
            const isActive = writing.slug === activeWriting?.slug;

            return (
              <li
                key={writing.slug}
                className={isActive ? "is-active" : undefined}
                onMouseEnter={() => setActiveSlug(writing.slug)}
                onMouseLeave={() => setActiveSlug(null)}
                onFocus={() => setActiveSlug(writing.slug)}
                onBlur={() => setActiveSlug(null)}
              >
                <span className="about-editorial__writing-index">{number}</span>
                <div className="about-editorial__writing-copy">
                  <p
                    className="about-editorial__writing-title"
                    data-custom-cursor="interactive"
                    tabIndex={0}
                    aria-describedby={`${writing.slug}-summary`}
                  >
                    {writing.title}
                  </p>
                  <p id={`${writing.slug}-summary`} className="about-editorial__writing-summary">
                    {writing.summary}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {activeWriting ? (
          <article className="about-editorial__writing-preview" aria-live="polite">
            <div className="about-editorial__writing-preview-rule" aria-hidden="true" />
            <p className="about-editorial__writing-preview-kicker">
              {String(activeWriting.order).padStart(2, "0")} / {activeWriting.category}
            </p>
            <WritingMarkdownPreview markdown={activeWriting.markdown} />
          </article>
        ) : null}
      </div>
    </div>
  );
};

const AboutSection: React.FC<{
  eagerMedia?: boolean;
}> = ({ eagerMedia = false }) => {
  const [about, setAbout] = useState<PortfolioAboutContent>(
    () => getCachedPortfolioSnapshot()?.about ?? portfolioSnapshotBootstrap.about,
  );
  const [writings, setWritings] = useState<PortfolioWriting[]>(
    () => getCachedPortfolioSnapshot()?.writings ?? portfolioSnapshotBootstrap.writings,
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadPortfolioContent = async () => {
      try {
        const response = await fetchPortfolioSnapshot(controller.signal);
        setAbout(response.about ?? portfolioSnapshotBootstrap.about);
        setWritings(response.writings ?? portfolioSnapshotBootstrap.writings);
      } catch {
        if (!controller.signal.aborted) {
          // Keep the generated portfolio bootstrap if the live API is unavailable.
        }
      }
    };

    void loadPortfolioContent();
    return () => controller.abort();
  }, []);

  return (
    <section className="about-editorial">
      <div className="about-editorial__inner">
        <div className="about-editorial__copy">
          <h2 className="about-editorial__title">
            About <span>me</span>
          </h2>

          <div className="about-editorial__body">
            <p>{about.introHeading}</p>
            <p>{about.introBody}</p>
          </div>

          <FeaturedWritingList writings={writings} />

        </div>

        <div className="about-editorial__visual">
          <div className="about-editorial__frame about-editorial__frame--back" />
          <div className="about-editorial__frame about-editorial__frame--front">
            <div className="about-editorial__tape" />
            <PortfolioImage
              src="/portfolio/profile/headshot.png"
              alt="Kushagra Bharti portrait"
              className="about-editorial__image"
              loading={eagerMedia ? "eager" : "lazy"}
              decoding="async"
              sizes="(max-width: 700px) 82vw, 430px"
            />
          </div>
          <p className="about-editorial__coordinates">
            <span>25.2048° N, 55.2708° E</span>
            <span>+</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
