import React, { useEffect, useMemo, useState } from "react";
import {
  fetchPortfolioSnapshot,
  getCachedPortfolioSnapshot,
} from "../../api/portfolioApi";
import type { PortfolioMediaItem } from "../../api/contracts";
import { portfolioSnapshotBootstrap } from "../../generated/portfolioSnapshotBootstrap";

const getInitialFilms = () =>
  getCachedPortfolioSnapshot()?.media ?? portfolioSnapshotBootstrap.media;

const getFilmIndex = (film: PortfolioMediaItem) =>
  String(film.order).padStart(2, "0");

const getFilmActions = (film: PortfolioMediaItem) =>
  film.actions?.length
    ? film.actions
    : film.watchUrl
      ? [{ label: "Watch", url: film.watchUrl, variant: "primary" as const }]
      : [];

const FilmSection: React.FC = () => {
  const [films, setFilms] = useState<PortfolioMediaItem[]>(getInitialFilms);
  const [activeFilmSlug, setActiveFilmSlug] = useState(films[0]?.slug ?? "");

  useEffect(() => {
    const controller = new AbortController();

    const loadSnapshot = async () => {
      try {
        const liveSnapshot = await fetchPortfolioSnapshot(controller.signal);
        if (!controller.signal.aborted) {
          setFilms(liveSnapshot.media);
          setActiveFilmSlug((current) => current || liveSnapshot.media[0]?.slug || "");
        }
      } catch {
        // Generated bootstrap media keeps this section renderable offline.
      }
    };

    void loadSnapshot();

    return () => controller.abort();
  }, []);

  const activeFilm = useMemo(
    () => films.find((film) => film.slug === activeFilmSlug) ?? films[0],
    [activeFilmSlug, films]
  );

  if (!activeFilm) return null;

  const activeFilmActions = getFilmActions(activeFilm);

  return (
    <section className="film-editorial" aria-labelledby="film-title">
      <div className="film-editorial__inner">
        <aside className="film-editorial__intro">
          <div className="film-editorial__intro-copy">
            <h2 id="film-title" className="film-editorial__title">
              Film
            </h2>
            <p className="film-editorial__summary">Stories and taste make us human, and I enjoy telling them through the lens.</p>
          </div>
          <a className="film-editorial__view-all" href={activeFilm.watchUrl ?? activeFilm.embedUrl} target="_blank" rel="noreferrer">
            view all films
            <span aria-hidden="true">→</span>
          </a>
        </aside>

        <div className="film-editorial__main">
          <div className="film-editorial__player-shell">
            <iframe
              key={activeFilm.slug}
              className="film-editorial__player"
              src={activeFilm.embedUrl}
              title={activeFilm.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          <div className="film-editorial__details">
            <p className="film-editorial__active-kicker">
              {activeFilm.year ?? activeFilm.subtitle} / {(activeFilm.genre ?? activeFilm.type).toLowerCase()} / {activeFilm.duration ?? "runtime n/a"}
            </p>
            <h3 className="film-editorial__active-title">{activeFilm.shortTitle ?? activeFilm.title}</h3>

            {activeFilm.notes?.length ? (
              <div className="film-editorial__recognition" aria-label="Film recognition">
                <ul>
                  {activeFilm.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="film-editorial__active-description">{activeFilm.description ?? activeFilm.summary ?? activeFilm.subtitle}</p>

            <div className="film-editorial__actions">
              {activeFilmActions.map((action) => {
                const isPrimary = action.variant !== "secondary";

                return (
                  <a
                    key={`${activeFilm.slug}-${action.label}`}
                    className={
                      isPrimary ? "film-editorial__watch-link" : "film-editorial__secondary-link"
                    }
                    href={action.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {action.label}
                    {isPrimary ? <span aria-hidden="true">▶</span> : null}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="film-editorial__sidebar">
          <div className="film-editorial__list" role="tablist" aria-label="Film portfolio list">
            {films.map((film) => {
              const isActive = film.slug === activeFilm.slug;

              return (
                <button
                  key={film.slug}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`film-editorial__list-item${isActive ? " is-active" : ""}`}
                  onClick={() => setActiveFilmSlug(film.slug)}
                >
                  <span className="film-editorial__list-index">{getFilmIndex(film)}</span>
                  <span className="film-editorial__list-title">{film.shortTitle ?? film.title}</span>
                </button>
              );
            })}
          </div>

          <ul className="film-editorial__roles" aria-label="Film roles">
            {(activeFilm.roles ?? []).map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FilmSection;
