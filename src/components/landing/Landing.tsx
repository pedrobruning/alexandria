import { Hero } from "./Hero";
import { TreeNotLine } from "./TreeNotLine";
import { HowItWorks } from "./HowItWorks";
import { WhyDifferent } from "./WhyDifferent";
import { Faq } from "./Faq";
import { LandingFooter } from "./LandingFooter";

export function Landing() {
  return (
    <main className="screen scroll-y landing">
      <Hero />
      <TreeNotLine />
      <div className="fret" />
      <HowItWorks />
      <WhyDifferent />
      <div className="fret" />
      <Faq />
      <LandingFooter />
    </main>
  );
}
