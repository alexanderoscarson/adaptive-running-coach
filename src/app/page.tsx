import Link from 'next/link';
import { ArrowRight, Brain, BarChart3, Calendar, Zap, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle grid texture */}
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* ===== HERO ===== */}
      <section className="relative px-6 pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center justify-between py-6">
            <h2 className="text-2xl font-extrabold tracking-tight">RUN<span className="text-primary">.</span></h2>
            <Link href="/auth/login" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
              Sign in
            </Link>
          </nav>

          <div className="pt-16 md:pt-24 max-w-3xl">
            <p className="text-primary font-bold text-xs tracking-[0.2em] uppercase mb-5">Adaptive coaching</p>
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-display tracking-tight leading-[0.95] uppercase">
              The training app adjusted for your <span className="text-primary">actual life</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mt-8 leading-relaxed font-semibold">
              Tailored training plans for runners and hybrid athletes. Running, strength, cycling, swimming, tennis and more, all in one coach that adapts to your life.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground px-8 py-4 font-extrabold hover:brightness-110 transition-all shadow-lg shadow-primary/30 text-base"
              >
                Start your free plan <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-border px-8 py-4 font-extrabold hover:bg-card hover:border-primary/30 transition-all text-base"
              >
                I have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DISTANCE CARDS ===== */}
      <section className="relative px-6 py-20 md:py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary font-bold text-xs tracking-[0.2em] uppercase mb-3 text-center">Choose your distance</p>
          <h2 className="text-3xl md:text-4xl font-display tracking-tight text-center mb-12">
            Find the plan that&apos;s right for you
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { distance: '5K', weeks: '8 to 12 weeks', gradient: 'from-violet-500 to-purple-600' },
              { distance: '10K', weeks: '10 to 14 weeks', gradient: 'from-fuchsia-500 to-pink-600' },
              { distance: 'Half', weeks: '12 to 17 weeks', gradient: 'from-primary to-purple-700' },
              { distance: 'Marathon', weeks: '16 to 20 weeks', gradient: 'from-pink-500 to-rose-600' },
            ].map(d => (
              <Link href="/auth/signup" key={d.distance} className={`group rounded-2xl bg-gradient-to-br ${d.gradient} p-6 md:p-8 text-white hover:scale-[1.03] transition-all shadow-lg hover:shadow-xl`}>
                <div className="text-3xl md:text-5xl font-display stat-num">{d.distance}</div>
                <div className="text-xs font-bold mt-2 opacity-70 group-hover:opacity-100 transition-opacity">{d.weeks}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary font-bold text-xs tracking-[0.2em] uppercase mb-3 text-center">Features</p>
          <h2 className="text-3xl md:text-4xl font-display tracking-tight mb-4 text-center">
            Everything a coach does
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto text-center mb-14 font-semibold">
            Periodized plans, adaptive pacing, and real time adjustments powered by AI.
          </p>

          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {[
              { icon: Calendar, title: 'Periodized plans', desc: 'Base, Build, Peak, Taper, Race. Recovery weeks built in. Strength work phased to match your running.' },
              { icon: Brain, title: 'AI coach that listens', desc: 'Chat naturally about your training. The coach proposes changes you can apply, tweak, or skip.' },
              { icon: Zap, title: 'Adapts to your life', desc: 'Tennis on Tuesdays? Vacation in August? Niggling knee? The plan flows around your constraints.' },
              { icon: BarChart3, title: 'Learns from every run', desc: 'Rate your effort after each session. Connect Strava for auto tracking. The plan gets smarter.' },
            ].map(f => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 md:p-8 glow-card transition-all group">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-extrabold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm font-semibold leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary font-bold text-xs tracking-[0.2em] uppercase mb-3 text-center">How it works</p>
          <h2 className="text-3xl md:text-4xl font-display tracking-tight text-center mb-14">
            Ready in 2 minutes
          </h2>

          <div className="space-y-8">
            {[
              { step: '01', title: 'Tell us about yourself', desc: 'Age, fitness level, goals, weekly schedule, and other activities so we can build a plan that fits your life.' },
              { step: '02', title: 'Get your periodized plan', desc: 'A full training plan from today to race day, with every session structured with warmup, main set, cooldown, and target paces.' },
              { step: '03', title: 'Train and adapt', desc: 'Log your runs, rate your effort, and chat with your AI coach. The plan evolves based on how your body responds.' },
            ].map(s => (
              <div key={s.step} className="flex gap-5 items-start group">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/25 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
                  <span className="text-primary-foreground font-black text-sm stat-num">{s.step}</span>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">{s.title}</h3>
                  <p className="text-muted-foreground text-sm font-semibold leading-relaxed mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KEY STATS ===== */}
      <section className="relative py-20 md:py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { stat: '5K to 42K', label: 'All distances' },
              { stat: '17wk', label: 'Default plan' },
              { stat: 'AI', label: 'Powered coach' },
              { stat: '∞', label: 'Adaptations' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-display text-primary stat-num">{s.stat}</div>
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHAT'S INCLUDED ===== */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display tracking-tight mb-10">What&apos;s included</h2>
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
              'Dark and light mode',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-card transition-colors">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-bold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-24 md:py-32 px-6">
        <div className="max-w-lg mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-display tracking-tight">
            Your next PR<br />starts <span className="text-primary">here</span>
          </h2>
          <p className="text-muted-foreground text-lg font-semibold">
            Set up takes 2 minutes. Your plan is generated instantly.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground px-10 py-4 font-extrabold hover:brightness-110 transition-all shadow-lg shadow-primary/30 text-lg"
          >
            Start training free <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="text-xs text-muted-foreground font-bold">
            Free · No credit card · Strava integration
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-sm font-extrabold">RUN<span className="text-primary">.</span></p>
          <p className="text-xs text-muted-foreground font-bold">Adaptive training powered by AI</p>
        </div>
      </footer>
    </div>
  );
}
