'use client'

import { useState } from 'react'
import { LoginForm, RegisterForm } from 'lyzr-architect-pg/client'
import { Check, FileCheck2, LockKeyhole, Network, ShieldCheck } from 'lucide-react'

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)
  return (
    <main className="min-h-screen bg-muted/30 text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
        <section className="flex flex-col justify-between bg-primary px-6 py-10 text-primary-foreground sm:px-10 lg:px-16 lg:py-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 rotate-45 place-items-center rounded-sm border border-primary-foreground/30 bg-primary-foreground/10"><span className="h-2.5 w-2.5 -rotate-45 bg-primary-foreground" /></span>
              <div><p className="text-sm font-bold tracking-tight">Requirement Lens</p><p className="font-mono text-[9px] uppercase tracking-[0.17em] text-primary-foreground/65">Private analysis workspace</p></div>
            </div>
            <div className="mt-20 max-w-xl sm:mt-28">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60">Structured thinking for complex work</p>
              <h1 className="mt-5 text-balance font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">Turn scattered context into <span className="italic text-primary-foreground/70">requirements people can act on.</span></h1>
              <p className="mt-6 max-w-lg text-pretty text-base leading-7 text-primary-foreground/70 sm:text-lg">Analyze business problems, expose gaps, prioritize product requirements, and preserve traceability from evidence to outcome.</p>
            </div>
          </div>
          <div className="mt-16 grid gap-5 border-t border-primary-foreground/20 pt-5 sm:grid-cols-3">
            <ProofPoint icon={<FileCheck2 className="h-4 w-4" />} title="Structured" detail="Consistent analysis sections" />
            <ProofPoint icon={<Network className="h-4 w-4" />} title="Traceable" detail="Evidence-linked decisions" />
            <ProofPoint icon={<ShieldCheck className="h-4 w-4" />} title="Reviewable" detail="Human-controlled output" />
          </div>
        </section>
        <section className="flex items-center justify-center bg-background px-5 py-12 sm:px-8">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-7 flex items-center justify-between gap-4">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Secure access</p><h2 className="mt-2 text-2xl font-bold tracking-tight">{isLogin ? 'Welcome back' : 'Create your account'}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{isLogin ? 'Sign in to continue to your saved analysis workspace.' : 'Your analyses stay private, persistent, and ready for review.'}</p></div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted"><LockKeyhole className="h-4 w-4 text-muted-foreground" /></span>
            </div>
            {isLogin ? <LoginForm onSwitchToRegister={() => setIsLogin(false)} /> : <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />}
            <div className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />Private workspace access uses platform-managed email/password authentication.</div>
          </div>
        </section>
      </div>
    </main>
  )
}

function ProofPoint({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="border-t border-primary-foreground/20 pt-3"><div className="flex items-center gap-2 text-sm font-semibold"><span className="text-primary-foreground/70">{icon}</span>{title}</div><p className="mt-1 text-xs text-primary-foreground/60">{detail}</p></div>
}
