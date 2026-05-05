import React from "react";
import type { ImgHTMLAttributes } from "react";

void React;

const optimizedImageBases = new Set([
  "/portfolio/profile/headshot",
  "/portfolio/projects/age-gender-recognition",
  "/portfolio/projects/arachne",
  "/portfolio/projects/autohdr-ml-lens-correction",
  "/portfolio/projects/beyond-chat",
  "/portfolio/projects/circuit-seer",
  "/portfolio/projects/data-drive",
  "/portfolio/projects/f1-optimization",
  "/portfolio/projects/imc-prosperity",
  "/portfolio/projects/kaggle-titanic-ml",
  "/portfolio/projects/leetcode-logo",
  "/portfolio/projects/monopoly-llm-benchmark",
  "/portfolio/projects/northstar",
  "/portfolio/projects/novel-bench",
  "/portfolio/projects/pact",
  "/portfolio/projects/pcb-design-project",
  "/portfolio/projects/personal-site",
  "/portfolio/projects/point-cloud-down-sampler",
  "/portfolio/projects/pseudo-lawyer",
  "/portfolio/projects/quant-test-environment",
  "/portfolio/projects/self-driving-car-project",
]);

const extensionPattern = /\.(avif|webp|png|jpe?g|svg)$/i;

const getOptimizedBase = (src: string) => {
  const base = src.replace(extensionPattern, "");
  return optimizedImageBases.has(base) ? base : null;
};

type PortfolioImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  alt: string;
  src: string;
};

const PortfolioImage = ({
  alt,
  loading = "lazy",
  decoding = "async",
  sizes,
  src,
  ...imageProps
}: PortfolioImageProps) => {
  const optimizedBase = getOptimizedBase(src);

  if (!optimizedBase) {
    return (
      <img
        {...imageProps}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        sizes={sizes}
      />
    );
  }

  return (
    <picture>
      <source srcSet={`${optimizedBase}.avif`} type="image/avif" sizes={sizes} />
      <source srcSet={`${optimizedBase}.webp`} type="image/webp" sizes={sizes} />
      <img
        {...imageProps}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        sizes={sizes}
      />
    </picture>
  );
};

export default PortfolioImage;
