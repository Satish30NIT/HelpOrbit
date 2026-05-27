"use client";

import Link from "next/link";
import { ArrowRight, LayoutGrid, Sparkles, Workflow } from "lucide-react";
import {
  APP_ABOUT,
  ARCHITECTURE_FLOW,
  DASHBOARD_MODULES,
  TECH_STACK,
  type DashboardModule,
} from "@/config/dashboardContent";

type Props = {
  isAdmin: boolean;
};

export function DashboardHome({ isAdmin }: Props) {
  const visibleModules = DASHBOARD_MODULES.filter((m) => !m.adminOnly || isAdmin);

  return (
    <div className="dashboard-home">
      <article className="dashboard-card dashboard-card--full">
        <header className="dashboard-card__head">
          <Sparkles className="dashboard-card__icon" aria-hidden />
          <h2 className="dashboard-card__title">About {APP_ABOUT.name}</h2>
        </header>
        <p className="dashboard-card__text dashboard-card__text--lead">{APP_ABOUT.tagline}</p>
        <p className="dashboard-card__text">{APP_ABOUT.goal}</p>
        <p className="dashboard-card__text">{APP_ABOUT.summary} {APP_ABOUT.overview}</p>
      </article>

      <div className="dashboard-card-row dashboard-card-row--2">
        <article className="dashboard-card">
          <header className="dashboard-card__head">
            <Workflow className="dashboard-card__icon" aria-hidden />
            <h3 className="dashboard-card__title">{APP_ABOUT.howItWorksTitle}</h3>
          </header>
          <ul className="dashboard-card__list">
            {APP_ABOUT.howItWorks.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </article>

        <article className="dashboard-card">
          <header className="dashboard-card__head">
            <LayoutGrid className="dashboard-card__icon" aria-hidden />
            <h3 className="dashboard-card__title">{APP_ABOUT.keyCapabilitiesTitle}</h3>
          </header>
          <ul className="dashboard-card__list">
            {APP_ABOUT.keyCapabilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <section className="dashboard-section" aria-labelledby="tech-stack-heading">
        <h2 id="tech-stack-heading" className="dashboard-section__title">
          Tech stack
        </h2>
        <div className="dashboard-card-row dashboard-card-row--4">
          {TECH_STACK.map((layer) => {
            const Icon = layer.icon;
            return (
              <article key={layer.name} className="dashboard-card dashboard-card--compact">
                <header className="dashboard-card__head">
                  <Icon className="dashboard-card__icon" aria-hidden />
                  <h3 className="dashboard-card__title">{layer.name}</h3>
                </header>
                <ul className="dashboard-card__tags">
                  {layer.items.map((item) => (
                    <li key={item.label}>
                      <span className="dashboard-tag" title={item.detail}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        <article className="dashboard-card dashboard-card--full dashboard-card--flow">
          <header className="dashboard-card__head">
            <h3 className="dashboard-card__title">Request flow</h3>
          </header>
          <div className="dashboard-card__tags dashboard-card__tags--center">
            {ARCHITECTURE_FLOW.map((step) => (
              <span key={step} className="dashboard-tag">
                {step}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-section" aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="dashboard-section__title">
          Application modules
        </h2>
        <div className="dashboard-card-row dashboard-card-row--3">
          {visibleModules.map((mod) => (
            <ModuleCard key={mod.id} module={mod} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ModuleCard({ module: mod }: { module: DashboardModule }) {
  const Icon = mod.icon;
  const isLive = mod.status === "live" && mod.href;

  const inner = (
    <article className="dashboard-card dashboard-card--compact dashboard-card--module">
      <header className="dashboard-card__head">
        <Icon className="dashboard-card__icon" aria-hidden />
        <h3 className="dashboard-card__title">{mod.title}</h3>
      </header>
      <ul className="dashboard-card__tags">
        <li>
          {mod.status === "live" ? (
            <span className="dashboard-tag dashboard-tag--live">Live</span>
          ) : (
            <span className="dashboard-tag dashboard-tag--muted">Soon</span>
          )}
        </li>
      </ul>
      <p className="dashboard-card__text">{mod.description}</p>
      {isLive && (
        <span className="dashboard-card__link">
          Open module
          <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </article>
  );

  if (isLive) {
    return (
      <Link href={mod.href!} className="dashboard-card-link">
        {inner}
      </Link>
    );
  }

  return <div className="dashboard-card-link dashboard-card-link--disabled">{inner}</div>;
}
