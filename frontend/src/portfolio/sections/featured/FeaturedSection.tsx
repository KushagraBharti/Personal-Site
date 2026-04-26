import React from "react";

type FeaturedProject = {
  index: string;
  title: string;
  description: string;
  imageAlt: string;
  image?: string;
  imageFit?: "cover" | "contain";
  isPlaceholder?: boolean;
};

const featuredProjects: FeaturedProject[] = [
  {
    index: "01",
    title: "MonopolyBench",
    description:
      "Benchmarking long-horizon strategic reasoning in LLM agents through repeatable Monopoly simulations, schema-typed tool calls, and inspectable decision traces. Open to collaborators interested in turning this into a publishable research paper.",
    image: "/portfolio/projects/monopoly-llm-benchmark.svg",
    imageAlt: "Monopoly board visual",
  },
  {
    index: "02",
    title: "IMC Prosperity",
    description:
      "Competing in IMC's global trading challenge, combining manual strategy with Python-based algorithmic trading across simulated markets. Currently top 7% globally by overall score.",
    image: "/portfolio/projects/imc-prosperity.png",
    imageAlt: "IMC Prosperity trading challenge visual",
  },
  {
    index: "03",
    title: "LeetCode Practice",
    description:
      "Solving difficult algorithm problems daily in Python, keeping paper notes alongside code to sharpen pattern recognition, implementation speed, and proof-level reasoning.",
    image: "/portfolio/projects/leetcode-logo.png",
    imageFit: "contain",
    imageAlt: "LeetCode logo",
  },
  {
    index: "04",
    title: "F1 Optimization",
    description:
      "Rebuilding the racing optimization project with a 2D physics simulation, then extending it into a multi-agent PPO reinforcement learning system for strategy and control.",
    image: "/portfolio/projects/f1-optimization.svg",
    imageAlt: "Formula 1 optimization visual",
  },
];

const FeaturedSection: React.FC = () => {
  return (
    <section className="featured-editorial">
      <div className="featured-editorial__inner">
        <div className="featured-editorial__intro">
          <h2 className="featured-editorial__title">
            <span>Recent</span>
            <span>Works</span>
          </h2>

          <p className="featured-editorial__summary">
            Explorations in systems, intelligence, and impact.
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
                    className={`featured-editorial__image${
                      project.imageFit === "contain" ? " featured-editorial__image--contain" : ""
                    }`}
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>

              <div className="featured-editorial__meta">
                <p className="featured-editorial__index">{project.index}</p>
                <h3 className="featured-editorial__item-title">{project.title}</h3>
                <p className="featured-editorial__description">{project.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
