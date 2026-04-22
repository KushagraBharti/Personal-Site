import React from "react";

type FeaturedProject = {
  index: string;
  title: string;
  description: string;
  tags: string[];
  imageAlt: string;
  image?: string;
  isPlaceholder?: boolean;
};

const featuredProjects: FeaturedProject[] = [
  {
    index: "01",
    title: "MonopolyBench",
    description: "LLM benchmark for strategic reasoning and decision making.",
    tags: ["PYTHON", "BENCHMARKS"],
    image: "/portfolio/projects/monopoly-llm-benchmark.svg",
    imageAlt: "Monopoly board visual",
  },
  {
    index: "02",
    title: "PseudoLawyer",
    description: "AI mediator for negotiation and contract drafting.",
    tags: ["AI", "NLP", "FULLSTACK"],
    image: "/portfolio/projects/pseudo-lawyer.png",
    imageAlt: "PseudoLawyer workflow visual",
  },
  {
    index: "03",
    title: "Quant Trading Lab",
    description: "Backtesting, strategies, and market research.",
    tags: ["PYTHON", "FINANCE"],
    image: "/portfolio/projects/quant-test-environment.svg",
    imageAlt: "Quant trading chart visual",
  },
  {
    index: "04",
    title: "More Projects",
    description: "A collection of experiments and prototypes.",
    tags: [],
    imageAlt: "More projects placeholder",
    isPlaceholder: true,
  },
];

const FeaturedSection: React.FC = () => {
  return (
    <section className="featured-editorial">
      <div className="featured-editorial__inner">
        <div className="featured-editorial__intro">
          <h2 className="featured-editorial__title">
            <span>Selected</span>
            <span>Work</span>
          </h2>

          <p className="featured-editorial__summary">
            Explorations in systems,
            <br />
            intelligence, and impact.
          </p>
        </div>

        <div className="featured-editorial__list" aria-label="Selected work">
          {featuredProjects.map((project) => (
            <article key={project.index} className="featured-editorial__item">
              <div className="featured-editorial__image-wrap">
                {project.isPlaceholder ? (
                  <div className="featured-editorial__placeholder" aria-label={project.imageAlt}>
                    <span>...</span>
                  </div>
                ) : (
                  <img
                    src={project.image}
                    alt={project.imageAlt}
                    className="featured-editorial__image"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>

              <div className="featured-editorial__meta">
                <p className="featured-editorial__index">{project.index}</p>
                <h3 className="featured-editorial__item-title">{project.title}</h3>
                <p className="featured-editorial__description">{project.description}</p>
                {project.tags.length > 0 ? (
                  <p className="featured-editorial__tags">{project.tags.join(" • ")}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
