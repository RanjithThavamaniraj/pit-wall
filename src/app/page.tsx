import { Container, GlassCard, SectionHeading, StatusPill } from "@/components/ui";
import { features, heroMetrics, leaderboard, navItems, stints } from "@/lib/data";

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090f]/80 backdrop-blur-xl">
      <Container className="flex h-20 items-center justify-between">
        <a href="#top" className="group inline-flex items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-300 text-lg font-black text-slate-950 shadow-lg shadow-amber-500/20">
            PW
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight text-white">Pit Wall</span>
            <span className="block text-xs uppercase tracking-[0.22em] text-slate-400">Motorsport intelligence</span>
          </span>
        </a>
        <nav aria-label="Primary navigation" className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-slate-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
              {item.label}
            </a>
          ))}
        </nav>
        <a href="#download" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
          Join beta
        </a>
      </Container>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-24">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.22),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,#07090f_0%,#0f172a_48%,#050507_100%)]" />
      <div aria-hidden="true" className="absolute left-1/2 top-0 -z-10 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.03] blur-3xl" />
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_0.86fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-200">
            <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
            Live race companion for serious fans
          </div>
          <h1 className="mt-8 max-w-5xl text-5xl font-semibold tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl">
            Your premium command centre for every racing weekend.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Pit Wall fuses live timing, strategy models, telemetry narratives, and race-control intelligence into one beautiful companion app built for the moments that decide a Grand Prix.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <a href="#live" className="rounded-full bg-amber-300 px-7 py-4 text-center text-base font-bold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Explore live wall
            </a>
            <a href="#strategy" className="rounded-full border border-white/15 px-7 py-4 text-center text-base font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
              See strategy tools
            </a>
          </div>
          <dl className="mt-12 grid gap-4 sm:grid-cols-3">
            {heroMetrics.map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <dt className="text-sm text-slate-400">{metric.label}</dt>
                <dd className="mt-2 text-2xl font-semibold text-white">{metric.value}</dd>
                <dd className="mt-1 text-xs text-amber-200">{metric.trend}</dd>
              </div>
            ))}
          </dl>
        </div>
        <RacePanel />
      </Container>
    </section>
  );
}

function RacePanel() {
  const toneByStatus = {
    Attack: "green",
    Box: "amber",
    Defend: "blue",
    Push: "red",
  } as const;

  return (
    <GlassCard className="relative overflow-hidden p-5 sm:p-7" >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-red-400 to-cyan-300" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Live timing</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Monaco GP · Lap 42/78</h2>
        </div>
        <StatusPill tone="green">DRS enabled</StatusPill>
      </div>
      <div className="mt-7 space-y-3" role="list" aria-label="Current top four leaderboard">
        {leaderboard.map((driver) => (
          <div key={driver.code} role="listitem" className="grid grid-cols-[2.4rem_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            <span className="font-mono text-sm text-slate-500">{driver.position}</span>
            <div>
              <p className="font-semibold text-white"><span className="font-mono text-amber-200">{driver.code}</span> · {driver.name}</p>
              <p className="text-sm text-slate-400">{driver.team}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm text-white">{driver.gap}</p>
              <StatusPill tone={toneByStatus[driver.status]}>{driver.status}</StatusPill>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-3xl bg-slate-950/70 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Predicted undercut window</p>
          <span className="font-mono text-sm text-amber-200">Lap 46–49</span>
        </div>
        <div className="mt-4 h-3 rounded-full bg-white/10" aria-hidden="true">
          <div className="h-3 w-[68%] rounded-full bg-gradient-to-r from-amber-300 to-red-400" />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">Norris gains 0.42s/lap in clean air. Cover stop recommended if gap closes below 1.2s.</p>
      </div>
    </GlassCard>
  );
}

function FeatureGrid() {
  return (
    <section id="live" className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Built for the decisive lap"
          title="Everything a race strategist sees, redesigned for fans."
          description="Pit Wall gives context to every call: what changed, why it matters, and how it reshapes the race before the broadcast catches up."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <GlassCard key={feature.title} className="transition hover:-translate-y-1 hover:bg-white/[0.08]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200">{feature.eyebrow}</p>
              <h3 className="mt-5 text-2xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-4 leading-7 text-slate-300">{feature.description}</p>
            </GlassCard>
          ))}
        </div>
      </Container>
    </section>
  );
}

function StrategySection() {
  return (
    <section id="strategy" className="border-y border-white/10 bg-white/[0.03] py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeading
          eyebrow="Strategy layer"
          title="Know the next move before the radio message."
          description="Readable models combine stint life, traffic, degradation, safety-car probability, and live gap dynamics into confident recommendations."
        />
        <GlassCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-white">Tyre plan simulator</h3>
              <p className="mt-2 text-slate-400">Optimal plan updates every sector.</p>
            </div>
            <StatusPill tone="amber">High confidence</StatusPill>
          </div>
          <div className="mt-8 grid gap-4">
            {stints.map((stint) => (
              <div key={stint.compound} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{stint.compound}</p>
                    <p className="text-sm text-slate-400">Projected life · {stint.laps}</p>
                  </div>
                  <p className="text-right font-mono text-sm text-amber-200">{stint.delta}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </Container>
    </section>
  );
}

function TelemetrySection() {
  return (
    <section id="telemetry" className="py-20 sm:py-28">
      <Container className="grid gap-8 lg:grid-cols-2">
        <GlassCard className="min-h-[26rem] overflow-hidden">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Telemetry story</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Sector 2 traction loss is costing 0.18s.</h2>
          <div className="mt-10 grid h-52 grid-cols-12 items-end gap-2" aria-label="Telemetry bars showing sector pace">
            {[54, 68, 72, 61, 80, 88, 75, 69, 92, 83, 78, 86].map((height, index) => (
              <div key={index} className="rounded-t-full bg-gradient-to-t from-cyan-400 to-amber-200" style={{ height: `${height}%` }} />
            ))}
          </div>
        </GlassCard>
        <div className="grid gap-5">
          {[
            ["Energy deployment", "Harvest complete before tunnel exit; attack available into Sainte Dévote."],
            ["Traffic risk", "Backmarkers projected at lap 45, likely costing 0.7s if stop delayed."],
            ["Radio brief", "Concise summaries turn team-radio fragments into actionable context."],
          ].map(([title, body]) => (
            <GlassCard key={title}>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 leading-7 text-slate-300">{body}</p>
            </GlassCard>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CTA() {
  return (
    <section id="briefings" className="pb-20 sm:pb-28">
      <Container>
        <div id="download" className="overflow-hidden rounded-[2.5rem] border border-amber-200/20 bg-amber-300 p-8 text-slate-950 shadow-2xl shadow-amber-500/20 sm:p-12 lg:p-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em]">Private beta</p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">Bring the pit wall to your sofa.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-800">Join the first release for intelligent race briefings, spoiler-safe replays, live timing, and strategy explainers built for the full motorsport calendar.</p>
            </div>
            <a href="mailto:beta@pitwall.example?subject=Pit%20Wall%20beta" className="rounded-full bg-slate-950 px-8 py-4 text-center text-base font-bold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-4 focus-visible:ring-offset-amber-300">
              Request access
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeatureGrid />
        <StrategySection />
        <TelemetrySection />
        <CTA />
      </main>
      <footer className="border-t border-white/10 py-8">
        <Container className="flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Pit Wall. Premium motorsport intelligence.</p>
          <p>Designed for accessibility, speed, and race-day focus.</p>
        </Container>
      </footer>
    </>
  );
}
