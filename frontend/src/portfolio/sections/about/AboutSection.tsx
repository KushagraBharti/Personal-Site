import React from "react";
import PortfolioImage from "../../components/PortfolioImage";

const values = [
  { index: "01", label: "curiosity" },
  { index: "02", label: "craft" },
  { index: "03", label: "impact" },
  { index: "04", label: "integrity" },
];

const AboutSection: React.FC<{
  eagerMedia?: boolean;
}> = ({ eagerMedia = false }) => {
  return (
    <section className="about-editorial">
      <div className="about-editorial__inner">
        <div className="about-editorial__copy">
          <h2 className="about-editorial__title">
            About <span>me</span>
          </h2>

          <div className="about-editorial__body">
            <p>
              I build systems that make complex behavior easier to see, test, and improve.
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
