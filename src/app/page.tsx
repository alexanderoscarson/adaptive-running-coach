import Link from 'next/link';
import { ArrowRight, Brain, BarChart3, Calendar, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background image overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1920&q=80&auto=format"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32">
          <nav className="flex items-center justify-between mb-16 md:mb-24">
            <h2 className="text-xl font-bold tracking-tight">RUN<span className="text-primary">.</span></h2>
            <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
              Sign in
            </Link>
          </nav>

          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Training plans that <span className="text-primary">adapt</span> to your life
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed">
              AI-powered coaching from 5K to marathon. Your plan adjusts in real time based on how you feel, what you do, and where life takes you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-8 py-3.5 font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-base"
              >
                Start training free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl border-2 border-border px-8 py-3.5 font-semibold hover:bg-card transition-colors text-base"
              >
                I have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything a coach does,<br />without the price tag
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Periodized plans, adaptive pacing, and real-time adjustments — powered by AI that understands exercise physiology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Periodized plans</h3>
              <p className="text-muted-foreground leading-relaxed">
                Base → Build → Peak → Taper → Race. Recovery weeks built in. Strength work phased to match your running.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI coach that listens</h3>
              <p className="text-muted-foreground leading-relaxed">
                Chat naturally about your training. The coach proposes changes you can apply, tweak, or skip — always in your control.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Adapts to your life</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tennis on Tuesdays? Vacation in August? Niggling knee? Add constraints and the plan flows around them automatically.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Learns from every run</h3>
              <p className="text-muted-foreground leading-relaxed">
                Rate your effort after each session. Connect Strava for automatic tracking. The plan gets smarter with every workout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Inspirational image break */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1920&q=80&auto=format"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6">
          <div className="max-w-5xl mx-auto w-full">
            <blockquote className="text-white text-2xl md:text-3xl font-bold max-w-md drop-shadow-lg">
              Every finish line is the beginning of a new race.
            </blockquote>
          </div>
        </div>
      </section>

      {/* Distances */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Pick your distance
          </h2>
          <p className="text-muted-foreground text-lg mb-12">
            From your first 5K to a Boston qualifier — we build the plan.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { distance: '5K', desc: '8–12 weeks', color: 'from-green-500/20 to-green-600/10' },
              { distance: '10K', desc: '10–14 weeks', color: 'from-blue-500/20 to-blue-600/10' },
              { distance: '13.1', desc: '12–17 weeks', color: 'from-orange-500/20 to-orange-600/10' },
              { distance: '26.2', desc: '16–20 weeks', color: 'from-red-500/20 to-red-600/10' },
            ].map(d => (
              <div key={d.distance} className={`rounded-2xl bg-gradient-to-br ${d.color} border p-6 md:p-8`}>
                <div className="text-3xl md:text-4xl font-bold mb-1">{d.distance}</div>
                <div className="text-sm text-muted-foreground">{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Ready to start?</h2>
          <p className="text-muted-foreground">
            Set up takes 2 minutes. Your personalized plan is generated instantly.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-8 py-3.5 font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Create your plan <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <p className="text-xs text-muted-foreground">
            Free · No credit card · Strava integration
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 text-center text-sm text-muted-foreground">
        <p>RUN. — Adaptive training powered by Claude</p>
      </footer>
    </div>
  );
}
