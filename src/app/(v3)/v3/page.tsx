import { Hero } from "../_components/hero";
import { Topbar } from "../_components/topbar";
import {
  FinalCta,
  Footer,
  HowItWorks,
  KlassikerShowcase,
  Philosophy,
  RaceMarquee,
} from "../_components/landing-sections";

export default function V3LandingPage() {
  return (
    <main>
      <Topbar />
      <Hero />
      <RaceMarquee />
      <KlassikerShowcase />
      <Philosophy />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </main>
  );
}
