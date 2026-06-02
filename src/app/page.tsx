"use client";

import Link from "next/link";
import { ArrowRight, Swords, TrendingUp, Flame } from "lucide-react";
import { LikelyrBackground } from "@/components/likelyr-background";
import { TrendingIdeas } from "@/components/trending-ideas";
import { HomeStats } from "@/components/home-stats";
import { ScrollReveal } from "@/components/scroll-reveal";

const ELO_TIERS = [
  { tier: "Dominant", elo: "1400+", color: "text-emerald-400", barColor: "bg-emerald-400", bg: "bg-emerald-400/5", pct: 100 },
  { tier: "Strong", elo: "1200–1399", color: "text-fire", barColor: "bg-fire", bg: "bg-fire/5", pct: 78 },
  { tier: "Contender", elo: "1050–1199", color: "text-amber-400", barColor: "bg-amber-400", bg: "bg-amber-400/5", pct: 56 },
  { tier: "Rising", elo: "950–1049", color: "text-blue-400", barColor: "bg-blue-400", bg: "bg-blue-400/5", pct: 34 },
  { tier: "Unproven", elo: "800–949", color: "text-zinc-500", barColor: "bg-zinc-500", bg: "bg-zinc-500/5", pct: 18 },
  { tier: "Fresh meat", elo: "<800", color: "text-zinc-600 dark:text-zinc-500", barColor: "bg-zinc-600 dark:bg-zinc-500", bg: "bg-zinc-600/5 dark:bg-zinc-500/5", pct: 8 },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border/30 min-h-[70vh] sm:min-h-[90vh] flex items-center">
        <LikelyrBackground />
        <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
          <div className="h-[500px] w-[500px] rounded-full bg-fire/10 blur-[150px] animate-pulse-ring" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-32 w-full">
          <div className="perspective-card">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-fire animate-hero-text">
              the startup arena
            </p>
            <h1 className="text-[2.8rem] leading-[0.95] font-black tracking-tight sm:text-[5.5rem] font-[family-name:var(--font-chakra)] animate-hero-text" style={{ animationDelay: "0.1s" }}>
              vote on ideas
              <br />
              <span className="text-gradient-fire">predict the crowd</span>
            </h1>
          </div>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground animate-hero-text" style={{ animationDelay: "0.25s" }}>
            Submit a startup idea or vote in head-to-head battles. Ideas climb by surviving votes.
            Voters climb by predicting the crowd signal before ratings are revealed.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center animate-hero-text" style={{ animationDelay: "0.4s" }}>
            <Link
              href="/battle"
              className="group inline-flex items-center justify-center gap-2.5 rounded-none bg-fire px-8 py-4 text-base font-bold uppercase tracking-wider text-fire-foreground shadow-[0_0_40px_rgba(220,60,30,0.35)] transition-all hover:shadow-[0_0_60px_rgba(220,60,30,0.5)] hover:scale-[1.03] active:scale-[0.98]"
            >
              start predicting
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center gap-2 rounded-none border border-border/60 px-8 py-4 text-base font-semibold uppercase tracking-wider transition-all hover:bg-panel hover:border-fire/30 hover:shadow-[0_0_20px_rgba(220,60,30,0.1)]"
            >
              submit idea
            </Link>
          </div>
          <HomeStats />
        </div>
      </section>

      {/* ── 3D Battle preview ── */}
      <section className="relative border-b border-border/30 bg-card/20 overflow-hidden">
        <LikelyrBackground className="opacity-20" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <ScrollReveal animation="reveal-up">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-fire flex items-center gap-2">
              <Swords className="h-3.5 w-3.5" />
              This is what happens
            </p>
            <h2 className="mb-12 text-3xl font-black sm:text-4xl font-[family-name:var(--font-chakra)]">
              two ideas compete. one survives.
            </h2>
          </ScrollReveal>

          <div className="perspective-card">
            <div className="grid gap-0 sm:grid-cols-2 relative">
              <ScrollReveal animation="reveal-left" delay={100}>
                <div className="glass-card glass-card-hover p-6 sm:rounded-l-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/15 text-xs font-black text-blue-400 ring-1 ring-blue-500/30">A</span>
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
                        <p className="text-2xl font-black tabular-nums text-fire font-[family-name:var(--font-chakra)]">1284</p>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Elo</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black tabular-nums text-emerald-400 font-[family-name:var(--font-chakra)]">82%</p>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Win rate</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black tabular-nums text-amber-400 font-[family-name:var(--font-chakra)]">78%</p>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Survival</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="reveal-right" delay={100}>
                <div className="glass-card glass-card-hover p-6 sm:rounded-r-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-bl from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/15 text-xs font-black text-violet-400 ring-1 ring-violet-500/30">B</span>
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
                        <p className="text-2xl font-black tabular-nums font-[family-name:var(--font-chakra)]">1087</p>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Elo</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black tabular-nums font-[family-name:var(--font-chakra)]">59%</p>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Win rate</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black tabular-nums font-[family-name:var(--font-chakra)]">49%</p>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Survival</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <div className="hidden sm:absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-fire/40 bg-background/90 backdrop-blur-sm shadow-[0_0_30px_rgba(220,60,30,0.3)] animate-vs-pulse">
                  <span className="text-base font-black text-fire font-[family-name:var(--font-chakra)]">VS</span>
                </div>
              </div>
              <div className="flex sm:hidden items-center justify-center my-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-fire/40 bg-background/90 backdrop-blur-sm shadow-[0_0_20px_rgba(220,60,30,0.3)] animate-vs-pulse">
                  <span className="text-sm font-black text-fire font-[family-name:var(--font-chakra)]">VS</span>
                </div>
              </div>
            </div>
          </div>

          <ScrollReveal animation="reveal-up" delay={200}>
            <div className="mt-px border-x border-b border-fire/30 bg-fire/5 px-6 py-5 sm:rounded-b-xl shimmer">
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
          </ScrollReveal>

          <ScrollReveal animation="reveal-scale" delay={300}>
            <div className="mt-8 text-center">
              <Link
                href="/battle"
                className="group inline-flex items-center gap-2.5 rounded-none bg-fire px-6 py-3 text-sm font-bold uppercase tracking-wider text-fire-foreground shadow-[0_0_30px_rgba(220,60,30,0.25)] transition-all hover:shadow-[0_0_50px_rgba(220,60,30,0.4)] hover:scale-[1.03]"
              >
                Try a real battle
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Elo ranking ── */}
      <section className="relative border-b border-border/30">
        <LikelyrBackground className="opacity-15" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <div className="grid gap-12 sm:grid-cols-2">
            <ScrollReveal animation="reveal-left">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-fire flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  The ranking
                </p>
                <h2 className="text-3xl font-black font-[family-name:var(--font-chakra)]">
                  elo ratings.<br />like chess, but for ideas.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  every idea starts at 1000. beat a higher-ranked idea, gain more points.
                  lose to a lower one, lose more. your <span className="text-fire font-semibold">survival rating</span> is derived from your elo.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal animation="reveal-right" delay={100}>
              <div className="space-y-1">
                {ELO_TIERS.map(({ tier, elo, color, barColor, bg, pct }, i) => (
                  <div key={tier} className={`tier-bar flex items-center gap-3 border-b border-border/15 py-3 px-4 ${bg}`}>
                    <span className={`text-sm font-bold ${color} font-[family-name:var(--font-chakra)] min-w-[90px]`}>{tier}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-border/15 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} animate-bar-fill`} style={{ animationDelay: `${200 + i * 100}ms`, width: `${pct}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground font-mono min-w-[72px] text-right">{elo}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative border-b border-border/30">
        <LikelyrBackground className="opacity-10" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <ScrollReveal animation="reveal-up">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-fire text-center">How it works</p>
            <h2 className="mb-14 text-3xl font-black sm:text-4xl font-[family-name:var(--font-chakra)] text-center">
              three steps. thirty seconds.
            </h2>
          </ScrollReveal>

          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-3 relative">
            <div className="hidden sm:block absolute top-12 left-[16.7%] right-[16.7%] h-px bg-gradient-to-r from-transparent via-fire/20 to-transparent" />
            <div className="hidden sm:block absolute top-12 left-[50%] right-0 h-px bg-gradient-to-r from-fire/20 to-transparent" />

            {[
              { num: "01", title: "submit your idea", desc: "name. pitch. target customer. revenue model. 30 seconds. no decks.", icon: "✦" },
              { num: "02", title: "battle for votes", desc: "your idea goes head to head. strangers pick the one likelier to make money.", icon: "⚔" },
              { num: "03", title: "climb or learn", desc: "win battles. gain elo. rise through the ranks. or find the weak spot fast.", icon: "◆" },
            ].map((step, i) => (
              <ScrollReveal key={step.num} animation="reveal-up" delay={i * 150}>
                <div className="perspective-card">
                  <div className="glass-card glass-card-hover p-6 text-center group transition-all duration-500 hover:shadow-[0_8px_40px_rgba(220,60,30,0.1)]">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fire/10 ring-1 ring-fire/20 group-hover:bg-fire/15 group-hover:ring-fire/30 transition-all duration-500 group-hover:scale-110">
                      <span className="text-2xl font-black text-fire/20 font-[family-name:var(--font-chakra)] group-hover:text-fire/40 transition-colors">{step.num}</span>
                    </div>
                    <h3 className="text-base font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending ideas ── */}
      <section className="border-b border-border/30">
        <LikelyrBackground className="opacity-10" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <ScrollReveal animation="reveal-up">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-fire flex items-center gap-2">
                  <Flame className="h-3.5 w-3.5" />
                  Live now
                </p>
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
          </ScrollReveal>
          <TrendingIdeas />
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative py-16 sm:py-24">
        <LikelyrBackground className="opacity-15" />
        <div className="relative z-10 mx-auto max-w-4xl px-6">
          <ScrollReveal animation="reveal-scale">
            <div className="relative overflow-hidden bg-card/30 px-8 py-12 sm:px-12 sm:py-16 text-center backdrop-blur-sm animated-border rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-fire/5 via-transparent to-ember/5 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-3xl font-black sm:text-4xl font-[family-name:var(--font-chakra)]">
                  find out what survives the crowd.
                </h2>
                <p className="mt-3 text-muted-foreground">
                  no judges. no panels. just fast comparisons, public rankings, and predictor scores.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/submit"
                    className="group inline-flex items-center gap-2.5 rounded-none bg-fire px-8 py-4 text-base font-bold uppercase tracking-wider text-fire-foreground shadow-[0_0_40px_rgba(220,60,30,0.3)] transition-all hover:shadow-[0_0_60px_rgba(220,60,30,0.5)] hover:scale-[1.03] active:scale-[0.98]"
                  >
                    submit your idea
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/battle"
                    className="inline-flex items-center gap-2 rounded-none border border-border/60 px-8 py-4 text-base font-semibold uppercase tracking-wider transition-all hover:bg-panel hover:border-fire/30 hover:shadow-[0_0_20px_rgba(220,60,30,0.1)]"
                  >
                    start voting
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}