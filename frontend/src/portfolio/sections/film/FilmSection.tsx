import React, { useMemo, useState } from "react";

type FilmEntry = {
  id: string;
  index: string;
  year: string;
  title: string;
  shortTitle: string;
  summary: string;
  description: string;
  linkLabel: string;
  watchUrl: string;
  embedUrl: string;
  type: "youtube" | "drive";
  roles: string[];
  notes?: string[];
};

const films: FilmEntry[] = [
  {
    id: "dining-hall-documentary",
    index: "01",
    year: "2022",
    title: "St. Stephen's Dining Hall Documentary",
    shortTitle: "Dining Hall Documentary",
    summary: "A documentary on the dining hall staff and the people behind the daily experience.",
    description:
      "A documentary following the St. Stephen's dining hall staff from the start of their day to the end, combining observational footage, intimate interviews, and a close look at the full dining hall experience.",
    linkLabel: "Watch",
    watchUrl: "https://youtu.be/WM6RvRfDCX4",
    embedUrl: "https://www.youtube-nocookie.com/embed/WM6RvRfDCX4",
    type: "youtube",
    roles: ["Director", "Cinematographer", "Editor"],
    notes: [
      "Nominated for The All-American High School Film Festival 2023.",
      "Screened at AMC Theatres in New York City.",
    ],
  },
  {
    id: "pbj-documentary",
    index: "02",
    year: "2023",
    title: "The PB&J Documentary",
    shortTitle: "The PB&J Documentary",
    summary: "A comedic documentary about obsession, mentorship, and the perfect PB&J sandwich.",
    description:
      "A comedic documentary following Liam and Edison as they chase the perfect PB&J through restaurants, roadside discoveries, and a boutique in San Antonio before the whole mentor-protege dynamic starts to unravel.",
    linkLabel: "Watch",
    watchUrl: "https://youtu.be/FS8l8G2p7PM",
    embedUrl: "https://www.youtube-nocookie.com/embed/FS8l8G2p7PM",
    type: "youtube",
    roles: ["Director", "Cinematographer", "Editor"],
  },
  {
    id: "rtms-recap",
    index: "03",
    year: "2018",
    title: "RTMS Semesterly Recap",
    shortTitle: "RTMS Semesterly Recap",
    summary: "A semester photo montage focused on rhythm, pacing, and raw editing craft.",
    description:
      "A semesterly recap film from Ras Tanura Middle School built as a photo montage. It has no traditional narrative, but it highlights editing instincts, visual sequencing, and the ability to build momentum through rhythm alone.",
    linkLabel: "Watch",
    watchUrl:
      "https://drive.google.com/file/d/1az0x6mwBzTXJEPBC7zhBQk9_DGO_8GwN/view?usp=sharing",
    embedUrl:
      "https://drive.google.com/file/d/1az0x6mwBzTXJEPBC7zhBQk9_DGO_8GwN/preview",
    type: "drive",
    roles: ["Editor", "Photographer", "Story Builder"],
  },
];

const nominationUrl = "https://www.hsfilmfest.com/2023-official-selections";

const FilmSection: React.FC = () => {
  const [activeFilmId, setActiveFilmId] = useState(films[0]?.id ?? "");

  const activeFilm = useMemo(
    () => films.find((film) => film.id === activeFilmId) ?? films[0],
    [activeFilmId]
  );

  if (!activeFilm) return null;

  return (
    <section className="film-editorial" aria-labelledby="film-title">
      <div className="film-editorial__inner">
        <aside className="film-editorial__intro">
          <div className="film-editorial__intro-copy">
            <h2 id="film-title" className="film-editorial__title">
              Film
            </h2>
            <p className="film-editorial__summary">Stories move people. I love telling them through the lens.</p>
          </div>
        </aside>

        <div className="film-editorial__main">
          <div className="film-editorial__player-shell">
            <iframe
              key={activeFilm.id}
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
              {activeFilm.year} / {activeFilm.type === "youtube" ? "Film" : "Recap"}
            </p>
            <h3 className="film-editorial__active-title">{activeFilm.shortTitle}</h3>

            {activeFilm.notes?.length ? (
              <div className="film-editorial__recognition" aria-label="Film recognition">
                <ul>
                  {activeFilm.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="film-editorial__active-description">{activeFilm.description}</p>

            <div className="film-editorial__actions">
              <a
                className="film-editorial__watch-link"
                href={activeFilm.watchUrl}
                target="_blank"
                rel="noreferrer"
              >
                {activeFilm.linkLabel}
                <span aria-hidden="true">▶</span>
              </a>
              {activeFilm.id === "dining-hall-documentary" ? (
                <a
                  className="film-editorial__secondary-link"
                  href={nominationUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Festival Selection
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="film-editorial__sidebar">
          <div className="film-editorial__list" role="tablist" aria-label="Film portfolio list">
            {films.map((film) => {
              const isActive = film.id === activeFilm.id;

              return (
                <button
                  key={film.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`film-editorial__list-item${isActive ? " is-active" : ""}`}
                  onClick={() => setActiveFilmId(film.id)}
                >
                  <span className="film-editorial__list-index">{film.index}</span>
                  <span className="film-editorial__list-title">{film.shortTitle}</span>
                </button>
              );
            })}
          </div>

          <ul className="film-editorial__roles" aria-label="Film roles">
            {activeFilm.roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FilmSection;
