import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LikelyrBackground } from "@/components/likelyr-background";
import { TrendingIdeas } from "@/components/trending-ideas";
import { HomeStats } from "@/components/home-stats";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b border-border/30 min-h-[70vh] sm:min-h-[85vh] flex items-center">
        <LikelyrBackground />
        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-32 w-full">
          <div className="perspective-card">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-fire animate-slide-up">
              likelyr
            </p>
            <h1 className="text-[2.8rem] leading-[0.95] font-black tracking-tight sm:text-[5.5rem] font-[family-name:var(--font-chakra)] animate-slide-up">
              what is
              <br />
              <span className="text-gradient-fire">likelier?</span>
            </h1>
          </div>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground animate-slide-up" style={{ animationDelay: "0.1s" }}>
            submit an idea. people vote head-to-head on what is more likely to make money.
            climb the ranks or learn why it loses.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link
              href="/battle"
              className="group inline-flex items-center justify-center gap-2.5 rounded-none bg-fire px-8 py-4 text-base font-bold uppercase tracking-wider text-fire-foreground shadow-[0_0_40px_rgba(220,60,30,0.35)] transition-all hover:shadow-[0_0_60px_rgba(220,60,30,0.45)] hover:scale-[1.02]"
            >
              start voting
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center gap-2 rounded-none border border-border/60 px-8 py-4 text-base font-semibold uppercase tracking-wider transition-colors hover:bg-panel hover:border-fire/30"
            >
              submit idea
            </Link>
          </div>

          <HomeStats />
        </div>
      </section>

      {/* 3D Battle preview */}
      <section className="relative border-b border-border/30 bg-card/20">
        <LikelyrBackground className="opacity-20" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-fire">
            This is what happens
          </p>
          <h2 className="mb-10 text-3xl font-black sm:text-4xl font-[family-name:var(--font-chakra)]">
            two ideas compete. one ranks higher.
          </h2>

          <div className="perspective-card">
            <div className="grid gap-px sm:grid-cols-2 sm:gap-0">
              <div className="border border-border/40 p-6 sm:rounded-l-xl sm:border-r-0 transition-all duration-300 hover:border-fire/30 hover:shadow-lg dark:hover:shadow-fire/10">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/15 text-xs font-black text-blue-400">A</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">B2B SaaS · MVP</span>
                </div>
                <h3 className="text-xl font-black font-[family-name:var(--font-chakra)]">LeadSniper AI</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  AI tool that finds local businesses with bad websites and sends personalized cold emails.
                </p>
                <div className="mt-5 flex gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-sm font-semibold">$49/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="text-sm font-semibold">Small biz owners</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/30 pt-4">
                  <div>
                    <p className="text-xl font-black tabular-nums text-fire font-[family-name:var(--font-chakra)]">1284</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Elo</p>
                  </div>
                  <div>
                    <p className="text-xl font-black tabular-nums text-emerald-400 font-[family-name:var(--font-chakra)]">82%</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Win rate</p>
                  </div>
                  <div>
                    <p className="text-xl font-black tabular-nums text-amber-400 font-[family-name:var(--font-chakra)]">78%</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Survival</p>
                  </div>
                </div>
              </div>

              <div className="border border-border/40 p-6 sm:rounded-r-xl transition-all duration-300 hover:border-fire/30 hover:shadow-lg dark:hover:shadow-fire/10">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/15 text-xs font-black text-violet-400">B</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Education · Idea</span>
                </div>
                <h3 className="text-xl font-black font-[family-name:var(--font-chakra)]">TutorCredits</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  App where students trade homework help using credits earned by helping others.
                </p>
                <div className="mt-5 flex gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-sm font-semibold">10% commission</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="text-sm font-semibold">Students</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/30 pt-4">
                  <div>
                    <p className="text-xl font-black tabular-nums font-[family-name:var(--font-chakra)]">1087</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Elo</p>
                  </div>
                  <div>
                    <p className="text-xl font-black tabular-nums font-[family-name:var(--font-chakra)]">59%</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Win rate</p>
                  </div>
                  <div>
                    <p className="text-xl font-black tabular-nums font-[family-name:var(--font-chakra)]">49%</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Survival</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-px border-x border-b border-fire/30 bg-fire/5 px-6 py-5 sm:rounded-b-xl">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fire/20 text-xs font-black text-fire">A</span>
              <div>
                <p className="font-bold text-fire font-[family-name:var(--font-chakra)]">LeadSniper AI wins.</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                Clear buyer. Direct ROI. Proven willingness to pay. The education model has adoption risk and monetization hurdles.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/battle"
              className="group inline-flex items-center gap-2 rounded-none border border-border/60 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-panel hover:border-fire/30"
            >
              Try a real battle
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Elo ranking explanation */}
      <section className="relative border-b border-border/30">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <div className="grid gap-12 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-fire">The ranking</p>
              <h2 className="text-3xl font-black font-[family-name:var(--font-chakra)]">
                elo ratings.<br />like chess, but for ideas.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                every idea starts at 1000. beat a higher-ranked idea, gain more points.
                lose to a lower one, lose more. your <span className="text-fire font-semibold">survival rating</span> is derived from your elo.
              </p>
            </div>
            <div className="space-y-0">
              {[
                { tier: "Dominant", elo: "1400+", color: "text-emerald-400", bg: "bg-emerald-400/5 dark:bg-emerald-400/5" },
                { tier: "Strong", elo: "1200–1399", color: "text-fire", bg: "bg-fire/5 dark:bg-fire/5" },
                { tier: "Contender", elo: "1050–1199", color: "text-amber-400", bg: "bg-amber-400/5 dark:bg-amber-400/5" },
                { tier: "Rising", elo: "950–1049", color: "text-blue-400", bg: "bg-blue-400/5 dark:bg-blue-400/5" },
                { tier: "Unproven", elo: "800–949", color: "text-zinc-500", bg: "bg-zinc-500/5 dark:bg-zinc-500/5" },
                { tier: "Fresh meat", elo: "<800", color: "text-zinc-600 dark:text-zinc-500", bg: "bg-zinc-600/5 dark:bg-zinc-500/5" },
              ].map(({ tier, elo, color, bg }) => (
                <div key={tier} className={`flex items-center justify-between border-b border-border/20 px-0 py-3 ${bg} pl-4`}>
                  <span className={`text-sm font-bold ${color} font-[family-name:var(--font-chakra)]`}>{tier}</span>
                  <span className="text-xs tabular-nums text-muted-foreground font-mono">{elo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative border-b border-border/30">
        <LikelyrBackground className="opacity-10" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-3">
            <div className="perspective-card">
              <div className="transition-all duration-300 hover:rotate-x-1 hover:rotate-y-1 hover:shadow-lg dark:hover:shadow-fire/5">
                <p className="text-5xl font-black text-fire/20 font-[family-name:var(--font-chakra)]">01</p>
                <h3 className="mt-2 text-base font-bold">submit your idea</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  name. pitch. target customer. revenue model. 30 seconds. no decks.
                </p>
              </div>
            </div>
            <div className="perspective-card">
              <div className="transition-all duration-300 hover:rotate-x-1 hover:rotate-y--1 hover:shadow-lg dark:hover:shadow-fire/5">
                <p className="text-5xl font-black text-fire/20 font-[family-name:var(--font-chakra)]">02</p>
                <h3 className="mt-2 text-base font-bold">battle for votes</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  your idea goes head to head. strangers pick the one likelier to make money.
                </p>
              </div>
            </div>
            <div className="perspective-card">
              <div className="transition-all duration-300 hover:rotate-x--1 hover:rotate-y-1 hover:shadow-lg dark:hover:shadow-fire/5">
                <p className="text-5xl font-black text-fire/20 font-[family-name:var(--font-chakra)]">03</p>
                <h3 className="mt-2 text-base font-bold">climb or learn</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  win battles. gain elo. rise through the ranks. or find the weak spot fast.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending ideas */}
      <section className="border-b border-border/30">
        <LikelyrBackground className="opacity-5" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-fire">Live now</p>
              <h2 className="text-3xl font-black font-[family-name:var(--font-chakra)]">
                top rated ideas
              </h2>
            </div>
            <Link
              href="/leaderboard"
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-fire transition-colors"
            >
              view all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <TrendingIdeas />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-16 sm:py-20">
        <LikelyrBackground className="opacity-15" />
        <div className="relative z-10 mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden border border-border/30 bg-card/30 px-8 py-12 sm:px-12 sm:py-16 text-center glow-border backdrop-blur-sm">
            <h2 className="text-3xl font-black sm:text-4xl font-[family-name:var(--font-chakra)]">
              find out what is likelier to succeed.
            </h2>
            <p className="mt-3 text-muted-foreground">
              no judges. no panels. just fast comparisons and clear signals.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/submit"
                className="group inline-flex items-center gap-2.5 rounded-none bg-fire px-8 py-4 text-base font-bold uppercase tracking-wider text-fire-foreground shadow-[0_0_40px_rgba(220,60,30,0.3)] transition-all hover:shadow-[0_0_60px_rgba(220,60,30,0.45)] hover:scale-[1.02]"
              >
                submit your idea
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/battle"
                className="inline-flex items-center gap-2 rounded-none border border-border/60 px-8 py-4 text-base font-semibold uppercase tracking-wider transition-colors hover:bg-panel hover:border-fire/30"
              >
                start voting
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}