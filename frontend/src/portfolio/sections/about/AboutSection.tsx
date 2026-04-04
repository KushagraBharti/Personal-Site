import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "../../../shared/components/ui/GlassCard";
import LazyIframe from "../../../shared/components/ui/LazyIframe";
import { fetchPortfolioSnapshot, getCachedPortfolioSnapshot } from "../../api/portfolioApi";
import type { PortfolioSnapshot } from "../../api/contracts";

const About: React.FC = () => {
  const [startTyping, setStartTyping] = useState(false);
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(() => getCachedPortfolioSnapshot());
  const [typedText] = useTypewriter({
    words: startTyping ? ["About Me"] : [""],
    loop: false,
    typeSpeed: 120,
    deleteSpeed: 60,
    delaySpeed: 1000,
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        setSnapshot(await fetchPortfolioSnapshot(controller.signal));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load about profile content:", error);
        }
      }
    };

    loadProfile();

    return () => controller.abort();
  }, []);

  return (
    <section className="py-20">
      <div className="container mx-auto max-w-screen-2xl px-4 md:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onViewportEnter={() => setStartTyping(true)}
          viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 1.5 }}
          className="mb-12 text-left"
        >
          <h2 className="relative inline-block text-4xl md:text-5xl font-bold text-gray-50">
            {typedText}
            <Cursor />
            <span className="section-accent-bar"></span>
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] xl:grid-cols-[1.6fr_1fr]">
          <GlassCard className="w-full max-w-none mx-0 p-7 md:p-8 text-gray-200 space-y-6">
            <div className="space-y-2.5">
              <h3 className="text-2xl font-semibold text-gray-50">
                {snapshot?.about.introHeading ?? "Loading..."}
              </h3>
              <p className="text-lg leading-relaxed text-gray-100/90">
                {snapshot?.about.introBody ?? "Fetching current profile details..."}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xl font-semibold text-gray-50">
                Projects I'm working on
              </h4>
              <ol className="list-decimal list-inside space-y-2.5 leading-relaxed">
                {(snapshot?.about.currentProjects ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>

            <div className="space-y-3">
              <h4 className="text-xl font-semibold text-gray-50">
                I am currently learning
              </h4>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                {(snapshot?.about.currentLearning ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xl font-semibold text-gray-50">
                Things outside of technology
              </h4>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                {(snapshot?.about.interestsOutsideTechnology ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {snapshot?.profile.externalLinks.map((link) => (
                <p key={link.label} className="text-sm text-gray-100/90">
                  {link.label}:{" "}
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-100 underline decoration-white/30 underline-offset-4 hover:text-[#D44638] hover:decoration-[#D44638] transition-colors duration-200"
                  >
                    {link.href}
                  </a>
                </p>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="w-full max-w-none mx-0 px-5 py-3.5 text-center">
              <p className="text-sm font-semibold tracking-wider uppercase text-gray-200/80">Check out my film work</p>
            </GlassCard>
            {(snapshot?.media ?? []).map((item) => (
              <GlassCard key={item.slug} className="w-full max-w-none mx-0 overflow-hidden p-0">
                <LazyIframe
                  className="aspect-video"
                  src={item.embedUrl}
                  title={item.title}
                  loadingLabel="Buffering film..."
                />
                <p className="text-sm text-gray-200/80 py-3 text-center font-medium">
                  {item.subtitle} - {item.title}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
