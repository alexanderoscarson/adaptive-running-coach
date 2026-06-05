import Link from 'next/link';
import { ArrowRight, Brain, BarChart3, Calendar, Zap, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ===== HERO ===== */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center justify-between py-6">
            <h2 className="text-2xl font-extrabold tracking-tight">RUN<span className="text-primary">.</span></h2>
            <Link href="/auth/login" className="text-sm font-bold hover:text-primary transition-colors">
              Sign in
            </Link>
          </nav>

          <div className="pt-12 md:pt-20 max-w-3xl">
            <p className="text-primary font-bold text-sm tracking-widest uppercase mb-4">Adaptive coaching</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95]">
              Running<br />
              made <span className="text-primary">simple</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mt-6 leading-relaxed">
              Tailored training plans for runners and hybrid athletes. Running, strength, cycling, swimming, tennis and more, all in one coach that adapts to your life.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-8 py-4 font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/25 text-base"
              >
                Start your free plan <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-full border-2 border-border px-8 py-4 font-bold hover:bg-muted transition-colors text-base"
              >
                I have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DISTANCE CARDS ===== */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary font-bold text-sm tracking-widest uppercase mb-3 text-center">Choose your distance</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-10">
            Find the plan that&apos;s right for you
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { distance: '5K', label: '5K', weeks: '8 to 12 weeks', gradient: 'from-emerald-500 to-emerald-600' },
              { distance: '10K', label: '10K', weeks: '10 to 14 weeks', gradient: 'from-blue-500 to-blue-600' },
              { distance: 'Half', label: 'Half Marathon', weeks: '12 to 17 weeks', gradient: 'from-primary to-orange-600' },
              { distance: 'Marathon', label: 'Marathon', weeks: '16 to 20 weeks', gradient: 'from-red-500 to-red-600' },
            ].map(d => (
              <Link href="/auth/signup" key={d.distance} className={`rounded-2xl bg-gradient-to-br ${d.gradient} p-6 md:p-8 text-white hover:scale-[1.03] transition-transform shadow-lg`}>
                <div className="text-3xl md:text-4xl font-extrabold">{d.distance}</div>
                <div className="text-xs font-semibold mt-1 opacity-80">{d.weeks}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary font-bold text-sm tracking-widest uppercase mb-3 text-center">Features</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-center">
            Everything a coach does
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto text-center mb-12">
            Periodized plans, adaptive pacing, and real time adjustments powered by AI.
          </p>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {[
              { icon: Calendar, title: 'Periodized plans', desc: 'Base, Build, Peak, Taper, Race. Recovery weeks built in. Strength work phased to match your running.' },
              { icon: Brain, title: 'AI coach that listens', desc: 'Chat naturally about your training. The coach proposes changes you can apply, tweak, or skip.' },
              { icon: Zap, title: 'Adapts to your life', desc: 'Tennis on Tuesdays? Vacation in August? Niggling knee? The plan flows around your constraints.' },
              { icon: BarChart3, title: 'Learns from every run', desc: 'Rate your effort after each session. Connect Strava for auto tracking. The plan gets smarter.' },
            ].map(f => (
              <div key={f.title} className="rounded-2xl border bg-card p-6 md:p-8 hover:border-primary/30 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-extrabold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 md:py-24 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary font-bold text-sm tracking-widest uppercase mb-3 text-center">How it works</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-12">
            Ready in 2 minutes
          </h2>

          <div className="space-y-6">
            {[
              { step: '01', title: 'Tell us about yourself', desc: 'Age, fitness level, goals, weekly schedule, and other activities so we can build a plan that fits your life.' },
              { step: '02', title: 'Get your periodized plan', desc: 'A full training plan from today to race day, with every session structured with warmup, main set, cooldown, and target paces.' },
              { step: '03', title: 'Train and adapt', desc: 'Log your runs, rate your effort, and chat with your AI coach. The plan evolves based on how your body responds.' },
            ].map(s => (
              <div key={s.step} className="flex gap-5 items-start">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground font-extrabold text-sm">{s.step}</span>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KEY STATS ===== */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: '5K to 42K', label: 'All distances' },
              { stat: '17 wk', label: 'Default plan' },
              { stat: 'AI', label: 'Powered coach' },
              { stat: '∞', label: 'Adaptations' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-extrabold text-primary">{s.stat}</div>
                <div className="text-sm text-muted-foreground font-semibold mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHAT'S INCLUDED ===== */}
      <section className="py-16 md:py-24 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8">What&apos;s included</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-left">
            {[
              'Personalized periodized plan',
              'AI chat coach (Claude)',
              'Strava auto sync',
              'RPE based adaptation',
              'Structured workout blocks',
              'Constraint scheduling',
              'Vacation and injury handling',
              'Phase aware strength training',
              'Audit log for all changes',
              'Dark mode',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 py-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-bold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Your next PR<br />starts <span className="text-primary">here</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Set up takes 2 minutes. Your plan is generated instantly.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-10 py-4 font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/25 text-lg"
          >
            Start training free <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="text-xs text-muted-foreground font-semibold">
            Free · No credit card · Strava integration
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-sm font-bold">RUN<span className="text-primary">.</span></p>
          <p className="text-xs text-muted-foreground">Adaptive training powered by AI</p>
        </div>
      </footer>
    </div>
  );
}
