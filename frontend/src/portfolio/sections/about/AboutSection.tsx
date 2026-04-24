import React from "react";

const values = [
  { index: "01", label: "curiosity" },
  { index: "02", label: "craft" },
  { index: "03", label: "impact" },
  { index: "04", label: "integrity" },
];

const AboutSection: React.FC<{
  eagerMedia?: boolean;
}> = () => {
  return (
    <section className="about-editorial">
      <div className="about-editorial__inner">
        <div className="about-editorial__copy">
          <h2 className="about-editorial__title">About me</h2>

          <div className="about-editorial__body">
            <p>
              I&apos;m Kushagra. I love building things that solve meaningful problems and
              create leverage.
            </p>
            <p>
              Curious by nature. Driven by impact. Always learning.
            </p>
          </div>

          <div className="about-editorial__values">
            <p className="about-editorial__values-heading">{`{ values }`}</p>
            <ul>
              {values.map((value) => (
                <li key={value.index}>
                  <span>{value.index}</span>
                  <span>{value.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="about-editorial__visual">
          <div className="about-editorial__frame about-editorial__frame--back" />
          <div className="about-editorial__frame about-editorial__frame--front">
            <div className="about-editorial__tape" />
            <img
              src="/portfolio/profile/headshot.png"
              alt="Kushagra Bharti portrait"
              className="about-editorial__image"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="about-editorial__flower" aria-hidden="true">
            <span className="about-editorial__flower-stem" />
            <span className="about-editorial__flower-bloom bloom-a" />
            <span className="about-editorial__flower-bloom bloom-b" />
            <span className="about-editorial__flower-bloom bloom-c" />
            <span className="about-editorial__flower-bloom bloom-d" />
            <span className="about-editorial__flower-bloom bloom-e" />
          </div>
          <p className="about-editorial__coordinates">25.2048° N, 55.2708° E</p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
