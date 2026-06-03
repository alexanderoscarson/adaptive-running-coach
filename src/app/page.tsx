import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted">
      <div className="max-w-md text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">RunCoach AI</h1>
          <p className="text-lg text-muted-foreground">
            Your adaptive AI running coach. Personalized training plans that evolve with you.
          </p>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</span>
            <span>Tell us about your fitness and goals</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</span>
            <span>Get a periodized training plan (5K to marathon)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</span>
            <span>Your AI coach adapts the plan as you train</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-lg border px-6 py-3 font-medium hover:bg-muted transition-colors"
          >
            Sign in
          </Link>
        </div>

        <p className="text-xs text-muted-foreground pt-4">
          Powered by Claude AI. Connect Strava for automatic activity sync.
        </p>
      </div>
    </div>
  );
}
