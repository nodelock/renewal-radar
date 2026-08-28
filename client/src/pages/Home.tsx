import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { ArrowRight, BellRing, Check, Github, LockKeyhole, Menu, ShieldCheck, Sparkles, TimerReset } from "lucide-react";
import { useLocation } from "wouter";

const repoUrl = import.meta.env.VITE_REPO_URL || "https://github.com/nodelock/renewal-radar";

const features = [
  { icon: TimerReset, title: "30-day advance alerts", text: "Scan expiry dates daily, send a one-month heads-up, and surface overdue assets separately." },
  { icon: ShieldCheck, title: "Security by design", text: "Signed sessions, server-side validation, restricted HTTPS renewal links, and production secrets kept off the client." },
  { icon: BellRing, title: "Traceable delivery", text: "Every scan and Telegram delivery is recorded, with uniqueness rules that prevent duplicate alerts." },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const openDashboard = () => navigate("/dashboard");

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8fc] text-[#172033]">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <a href="/" className="flex items-center gap-3" aria-label="Domain Renewal Radar home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#172033] text-white shadow-lg shadow-[#172033]/15"><Sparkles size={18} /></span>
          <span className="text-sm font-semibold tracking-[0.16em] text-[#172033]">RENEWAL RADAR</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-[#667085] md:flex">
          <a href="#features" className="transition hover:text-[#172033]">Features</a>
          <a href="#open-source" className="transition hover:text-[#172033]">Open source</a>
          <a href="#deploy" className="transition hover:text-[#172033]">Deploy</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden text-[#667085] sm:inline-flex" onClick={() => window.open(repoUrl, "_blank", "noopener,noreferrer")}><Github size={16} /> GitHub</Button>
          {!loading && user ? <Button onClick={openDashboard} className="rounded-xl bg-[#172033] px-5 hover:bg-[#2a3550]">Open dashboard <ArrowRight size={16} /></Button> : <Button onClick={startLogin} className="rounded-xl bg-[#172033] px-5 hover:bg-[#2a3550]">Sign in <ArrowRight size={16} /></Button>}
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu"><Menu size={20} /></Button>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-12 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#b9c7ff]/45 blur-3xl" />
          <div className="pointer-events-none absolute left-20 top-72 h-52 w-52 rounded-full bg-[#f2c6a0]/30 blur-3xl" />
          <div className="relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dfe3ef] bg-white/75 px-3 py-1.5 text-xs font-medium text-[#68738b] shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-[#5b6ee1]" /> Open source domain operations</div>
              <h1 className="text-5xl font-semibold leading-[1.03] tracking-[-0.055em] text-[#172033] sm:text-6xl lg:text-7xl">Never lose a domain<br /><span className="text-[#6473d8]">to a forgotten date.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#667085]">A calm, secure control room for your domain portfolio. Keep renewal dates, registrar links and Telegram alerts in one place—without spreadsheets or last-minute panic.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button onClick={user ? openDashboard : startLogin} size="lg" className="h-12 rounded-xl bg-[#172033] px-6 text-sm shadow-xl shadow-[#172033]/15 hover:bg-[#2a3550]">{user ? "Open your radar" : "Start with secure sign-in"}<ArrowRight size={17} /></Button>
                <Button onClick={() => window.open(repoUrl, "_blank", "noopener,noreferrer")} variant="outline" size="lg" className="h-12 rounded-xl border-[#dfe3ef] bg-white px-6 text-sm text-[#344054] hover:bg-[#f1f3f9]"><Github size={17} /> View on GitHub</Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#7a849a]"><span className="flex items-center gap-2"><Check size={14} className="text-[#6473d8]" /> MIT licensed</span><span className="flex items-center gap-2"><Check size={14} className="text-[#6473d8]" /> PostgreSQL ready</span><span className="flex items-center gap-2"><Check size={14} className="text-[#6473d8]" /> Telegram native</span></div>
            </div>
            <div className="relative mx-auto w-full max-w-[520px]">
              <div className="absolute -inset-5 rounded-[2.5rem] bg-white/50 blur-2xl" />
              <div className="relative rotate-[2deg] rounded-[2rem] border border-white bg-white p-3 shadow-[0_28px_80px_-28px_rgba(23,32,51,0.38)] transition duration-300 hover:rotate-0">
                <div className="rounded-[1.45rem] bg-[#172033] p-5 text-white">
                  <div className="flex items-center justify-between"><div><p className="text-xs text-white/45">Portfolio health</p><p className="mt-1 text-2xl font-semibold">Mostly on track<span className="text-[#aebaff]">.</span></p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><ShieldCheck size={19} className="text-[#b7c1ff]" /></div></div>
                  <div className="mt-7 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white/10 p-3"><p className="text-[10px] text-white/45">Tracked</p><p className="mt-1 text-xl font-semibold">24</p></div><div className="rounded-xl bg-[#6675e4] p-3"><p className="text-[10px] text-white/70">Soon</p><p className="mt-1 text-xl font-semibold">03</p></div><div className="rounded-xl bg-white/10 p-3"><p className="text-[10px] text-white/45">Archived</p><p className="mt-1 text-xl font-semibold">07</p></div></div>
                  <div className="mt-5 space-y-2"><div className="flex items-center justify-between rounded-xl bg-white/[0.07] px-3 py-3"><span className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-[#ffbd70]" /> studio.tools</span><span className="text-xs text-[#ffbd70]">29 days</span></div><div className="flex items-center justify-between rounded-xl bg-white/[0.07] px-3 py-3"><span className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-[#8be1bb]" /> archive.page</span><span className="text-xs text-[#8be1bb]">186 days</span></div><div className="flex items-center justify-between rounded-xl bg-white/[0.07] px-3 py-3"><span className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-[#ff8f9c]" /> tiny.host</span><span className="text-xs text-[#ff8f9c]">expired</span></div></div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-8 hidden rounded-2xl border border-white bg-white px-4 py-3 shadow-xl shadow-[#172033]/10 sm:block"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef0ff] text-[#6574dc]"><BellRing size={17} /></div><div><p className="text-xs font-semibold text-[#344054]">Telegram sent</p><p className="text-[11px] text-[#98a2b3]">3 reminders this month</p></div></div></div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-[#e8eaf1] bg-white/70 py-16 lg:py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="grid gap-8 md:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <div key={title} className="group rounded-2xl p-4 transition hover:bg-white hover:shadow-[0_14px_40px_-25px_rgba(23,32,51,0.3)]"><div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-[#eef0ff] text-[#6574dc] transition group-hover:scale-105"><Icon size={19} /></div><h2 className="text-base font-semibold text-[#172033]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#7a849a]">{text}</p></div>)}</div></div></section>

        <section id="open-source" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-28"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6574dc]">Built in public</p><h2 className="mt-4 max-w-md text-4xl font-semibold tracking-[-0.04em] text-[#172033]">Small tool.<br />Clear ownership.</h2></div><div className="grid gap-5 sm:grid-cols-2"><div className="rounded-2xl border border-[#e5e8f0] bg-white p-6"><Github className="text-[#6574dc]" size={21} /><h3 className="mt-7 font-semibold">Fork it. Make it yours.</h3><p className="mt-2 text-sm leading-6 text-[#7a849a]">MIT licensed, documented, and designed for human contributors plus AI-assisted maintenance.</p><button onClick={() => window.open(repoUrl, "_blank", "noopener,noreferrer")} className="mt-5 text-sm font-semibold text-[#6574dc]">Open repository →</button></div><div id="deploy" className="rounded-2xl border border-[#e5e8f0] bg-[#172033] p-6 text-white"><LockKeyhole className="text-[#b7c1ff]" size={21} /><h3 className="mt-7 font-semibold">Deploy without secrets in Git</h3><p className="mt-2 text-sm leading-6 text-white/55">Connect your repository to Vercel or Netlify, then add PostgreSQL and Telegram secrets only in the platform settings.</p><button onClick={user ? openDashboard : startLogin} className="mt-5 text-sm font-semibold text-[#b7c1ff]">Enter the radar →</button></div></div></section>
      </main>
      <footer className="border-t border-[#e8eaf1] px-5 py-8 text-center text-xs text-[#98a2b3]"><span>Domain Renewal Radar</span><span className="mx-2">·</span><span>Original open-source project by the author</span><span className="mx-2">·</span><span>MIT License</span></footer>
    </div>
  );
}
