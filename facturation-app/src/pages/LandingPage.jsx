import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NAV_ITEMS, FEATURES, STATS, PRICING_PLANS, TESTIMONIALS, FAQ_ITEMS, HOW_IT_WORKS,
} from './landing/landingData';

const globalStyles = `
  .landing-page * { box-sizing: border-box; }
  .landing-page { scroll-behavior: smooth; }
  .landing-page ::-webkit-scrollbar { width: 6px; }
  .landing-page ::-webkit-scrollbar-track { background: #030f0a; }
  .landing-page ::-webkit-scrollbar-thumb { background: #065f46; border-radius: 3px; }
  @keyframes landing-pulse-ring {
    0% { transform: scale(0.9); opacity: 0.7; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.9); opacity: 0.7; }
  }
  @keyframes landing-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
`;

function FeatureCard({ feature }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(52,211,153,0.15)',
        borderRadius: '16px',
        padding: '28px',
        transition: 'all 0.5s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(52,211,153,0.5)';
        e.currentTarget.style.background = 'rgba(52,211,153,0.06)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(52,211,153,0.15)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ fontSize: '36px', marginBottom: '16px' }}>{feature.icon}</div>
      <h3 style={{ color: '#ecfdf5', fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>
        {feature.title}
      </h3>
      <p style={{ color: '#6ee7b7', fontSize: '14px', lineHeight: '1.6' }}>{feature.description}</p>
    </div>
  );
}

function PricingCard({ plan, onCta }) {
  return (
    <div
      style={{
        background: plan.highlighted ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
        border: plan.highlighted ? '2px solid rgba(52,211,153,0.6)' : '1px solid rgba(52,211,153,0.15)',
        borderRadius: '20px',
        padding: '36px 32px',
        position: 'relative',
        flex: '1',
        minWidth: '260px',
        maxWidth: '340px',
        transition: 'transform 0.3s',
        transform: plan.highlighted ? 'scale(1.04)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = plan.highlighted ? 'scale(1.06)' : 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = plan.highlighted ? 'scale(1.04)' : 'scale(1)';
      }}
    >
      {plan.highlighted && (
        <div style={{
          position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #10b981, #34d399)', color: '#064e3b',
          fontSize: '12px', fontWeight: 700, padding: '4px 16px', borderRadius: '20px', whiteSpace: 'nowrap',
        }}>
          PLUS POPULAIRE
        </div>
      )}
      <div style={{ color: '#6ee7b7', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>{plan.name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
        <span style={{ color: '#ecfdf5', fontSize: '42px', fontWeight: 700 }}>€{plan.price}</span>
        <span style={{ color: '#6ee7b7', fontSize: '14px' }}>{plan.period}</span>
      </div>
      <p style={{ color: '#a7f3d0', fontSize: '13px', marginBottom: '24px' }}>{plan.description}</p>
      <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0 }}>
        {plan.features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#d1fae5', fontSize: '14px', marginBottom: '10px' }}>
            <span style={{ color: '#34d399', fontSize: '16px' }}>✓</span> {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onCta}
        style={{
          width: '100%', padding: '13px', borderRadius: '10px',
          border: plan.highlighted ? 'none' : '1px solid rgba(52,211,153,0.4)',
          background: plan.highlighted ? 'linear-gradient(135deg, #10b981, #34d399)' : 'transparent',
          color: plan.highlighted ? '#064e3b' : '#34d399',
          fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!plan.highlighted) e.currentTarget.style.background = 'rgba(52,211,153,0.1)';
          else e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          if (!plan.highlighted) e.currentTarget.style.background = 'transparent';
          else e.currentTarget.style.opacity = '1';
        }}
      >
        {plan.cta}
      </button>
    </div>
  );
}

function TestimonialCard({ t }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.15)',
        borderRadius: '16px', padding: '28px', flex: '1', minWidth: '280px', maxWidth: '400px',
        transition: 'border-color 0.3s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(52,211,153,0.15)'; }}
    >
      <div style={{ color: '#34d399', fontSize: '24px', marginBottom: '16px' }}>★★★★★</div>
      <p style={{ color: '#a7f3d0', fontSize: '15px', lineHeight: '1.7', marginBottom: '20px' }}>&ldquo;{t.text}&rdquo;</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src={t.avatar} alt={t.name}
          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(52,211,153,0.3)' }}
        />
        <div>
          <div style={{ color: '#ecfdf5', fontWeight: 600, fontSize: '14px' }}>{t.name}</div>
          <div style={{ color: '#6ee7b7', fontSize: '12px' }}>{t.role} — {t.company}</div>
        </div>
      </div>
    </div>
  );
}

function FaqAccordion({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {items.map((item, i) => (
        <div
          key={item.question}
          style={{
            border: '1px solid rgba(52,211,153,0.15)', borderRadius: '12px', marginBottom: '12px',
            overflow: 'hidden',
            background: open === i ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.02)',
            transition: 'background 0.3s',
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', background: 'none', border: 'none', padding: '20px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', color: '#ecfdf5', fontSize: '15px', fontWeight: 500, textAlign: 'left', gap: '16px',
            }}
          >
            <span>{item.question}</span>
            <span style={{
              color: '#34d399', fontSize: '20px', flexShrink: 0,
              transition: 'transform 0.3s', transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
            }}>
              +
            </span>
          </button>
          {open === i && (
            <div style={{ padding: '0 24px 20px', color: '#a7f3d0', fontSize: '14px', lineHeight: '1.7' }}>
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(t);
    };
  }, []);

  const smoothScroll = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const goRegister = () => navigate('/register');
  const goLogin = () => navigate('/login');

  const btnPrimary = {
    background: 'linear-gradient(135deg, #10b981, #34d399)', border: 'none', color: '#064e3b',
    cursor: 'pointer', transition: 'opacity 0.2s',
  };
  const btnOutline = {
    background: 'none', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399',
    cursor: 'pointer', transition: 'all 0.2s',
  };

  return (
    <div
      className="landing-page"
      style={{
        fontFamily: "'Inter', sans-serif",
        background: '#030f0a',
        color: '#ecfdf5',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <style>{globalStyles}</style>

      {/* Navigation */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 clamp(16px, 4vw, 40px)', height: '70px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(3,15,10,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(52,211,153,0.1)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: '34px', height: '34px', background: 'linear-gradient(135deg, #10b981, #34d399)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>
            📋
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#ecfdf5' }}>
            Facture<span style={{ color: '#34d399' }}>Pro</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="landing-nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => smoothScroll(item.href)}
              style={{ background: 'none', border: 'none', color: '#a7f3d0', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#34d399'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#a7f3d0'; }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button type="button" onClick={goLogin} style={{ ...btnOutline, padding: '9px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(52,211,153,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            Connexion
          </button>
          <button type="button" onClick={goRegister} style={{ ...btnPrimary, padding: '9px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Essai Gratuit
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: '120px clamp(20px, 4vw, 40px) 80px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '400px', background: 'radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
          padding: '6px 18px', borderRadius: '20px', marginBottom: '28px',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.7s ease',
        }}>
          <span style={{ color: '#34d399', fontSize: '12px' }}>★</span>
          <span style={{ color: '#6ee7b7', fontSize: '13px', fontWeight: 500 }}>Nouveau — Export Excel & archivage annuel disponibles</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(38px, 6vw, 72px)', fontWeight: 700, lineHeight: 1.12, maxWidth: '820px', marginBottom: '24px',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.7s ease 0.1s',
        }}>
          Gérez vos factures{' '}
          <span style={{ background: 'linear-gradient(135deg, #10b981, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            sans effort
          </span>
          ,<br />encaissez plus vite
        </h1>

        <p style={{
          fontSize: '18px', color: '#6ee7b7', maxWidth: '560px', lineHeight: 1.7, marginBottom: '40px',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.7s ease 0.2s',
        }}>
          FacturePro simplifie la création, l&apos;envoi et le suivi de vos factures.
          Conçu pour les indépendants, TPE et PME qui veulent se concentrer sur leur métier.
        </p>

        <div style={{
          display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '64px',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.7s ease 0.3s',
        }}>
          <button type="button" onClick={goRegister} style={{
            ...btnPrimary, padding: '15px 36px', borderRadius: '12px', fontSize: '16px', fontWeight: 700,
            boxShadow: '0 0 40px rgba(16,185,129,0.35)', animation: 'landing-pulse-ring 3s infinite',
          }}>
            Démarrer gratuitement →
          </button>
          <button type="button" onClick={() => smoothScroll('#features')} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(52,211,153,0.25)', color: '#d1fae5',
            padding: '15px 36px', borderRadius: '12px', fontSize: '16px', fontWeight: 500, cursor: 'pointer',
          }}>
            ▶ Voir la démo
          </button>
        </div>

        {/* Dashboard preview */}
        <div style={{
          maxWidth: '900px', width: '100%', background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(52,211,153,0.2)', borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.6)', animation: 'landing-float 6s ease-in-out infinite',
          opacity: heroVisible ? 1 : 0, transition: 'opacity 0.7s ease 0.5s',
        }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(52,211,153,0.1)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '6px', height: '24px', margin: '0 16px', display: 'flex', alignItems: 'center', paddingLeft: '12px' }}>
              <span style={{ color: '#6ee7b7', fontSize: '11px' }}>app.facturepro.fr/dashboard</span>
            </div>
          </div>
          <div style={{ padding: '28px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '160px', flexShrink: 0 }}>
              {['Dashboard', 'Factures', 'Clients', 'Devis', 'Rapports', 'Paramètres'].map((item, i) => (
                <div key={item} style={{
                  padding: '8px 12px', borderRadius: '8px', marginBottom: '4px',
                  background: i === 1 ? 'rgba(52,211,153,0.12)' : 'transparent',
                  color: i === 1 ? '#34d399' : '#6ee7b7', fontSize: '13px', fontWeight: i === 1 ? 600 : 400,
                }}>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Revenus ce mois', value: '€ 24 580', change: '+12%' },
                  { label: 'Factures envoyées', value: '47', change: '+8%' },
                  { label: 'En attente', value: '€ 6 200', change: '-3%' },
                ].map((s) => (
                  <div key={s.label} style={{ flex: '1', minWidth: '120px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ color: '#6ee7b7', fontSize: '10px', marginBottom: '6px' }}>{s.label}</div>
                    <div style={{ color: '#ecfdf5', fontSize: '18px', fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: s.change.startsWith('+') ? '#34d399' : '#f87171', fontSize: '10px', marginTop: '4px' }}>{s.change}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(52,211,153,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(52,211,153,0.08)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a7f3d0', fontSize: '13px', fontWeight: 600 }}>Factures récentes</span>
                  <span style={{ color: '#34d399', fontSize: '11px' }}>Voir tout →</span>
                </div>
                {[
                  { num: 'FAC-2024-047', client: 'TechVision SAS', amount: '€ 4 200', status: 'Payée', color: '#34d399' },
                  { num: 'FAC-2024-046', client: 'Studio Pixel', amount: '€ 1 850', status: 'En attente', color: '#fbbf24' },
                  { num: 'FAC-2024-045', client: 'KBConsulting', amount: '€ 3 600', status: 'En retard', color: '#f87171' },
                ].map((row) => (
                  <div key={row.num} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(52,211,153,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#6ee7b7', fontSize: '11px', fontFamily: 'monospace' }}>{row.num}</span>
                    <span style={{ color: '#a7f3d0', fontSize: '12px', flex: 1 }}>{row.client}</span>
                    <span style={{ color: '#ecfdf5', fontSize: '12px', fontWeight: 600 }}>{row.amount}</span>
                    <span style={{ background: `${row.color}18`, color: row.color, fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px' }}>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '60px 40px', background: 'rgba(16,185,129,0.04)', borderTop: '1px solid rgba(52,211,153,0.1)', borderBottom: '1px solid rgba(52,211,153,0.1)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '32px' }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px' }}>
                {s.value}
              </div>
              <div style={{ color: '#6ee7b7', fontSize: '14px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '100px clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ color: '#34d399', fontSize: '13px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Fonctionnalités</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#ecfdf5', marginBottom: '16px' }}>
              Tout ce qu&apos;il faut pour facturer{' '}
              <span style={{ background: 'linear-gradient(135deg, #10b981, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>comme un pro</span>
            </h2>
            <p style={{ color: '#6ee7b7', fontSize: '16px', maxWidth: '520px', margin: '0 auto' }}>
              Une suite complète d&apos;outils pour simplifier votre comptabilité et accélérer vos encaissements.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {FEATURES.map((f) => <FeatureCard key={f.title} feature={f} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '100px clamp(20px, 4vw, 40px)', background: 'linear-gradient(180deg, transparent, rgba(16,185,129,0.03), transparent)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ color: '#34d399', fontSize: '13px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Comment ça marche</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#ecfdf5' }}>3 étapes pour simplifier votre facturation</h2>
          </div>
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{ flex: '1', minWidth: '240px', maxWidth: '280px', textAlign: 'center', position: 'relative' }}>
                {i < 2 && (
                  <div style={{ position: 'absolute', top: '36px', right: '-52px', color: 'rgba(52,211,153,0.3)', fontSize: '24px', display: 'none' }} className="landing-step-arrow">→</div>
                )}
                <div style={{ width: '72px', height: '72px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>
                  {step.icon}
                </div>
                <div style={{ color: 'rgba(52,211,153,0.5)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>ÉTAPE {step.step}</div>
                <h3 style={{ color: '#ecfdf5', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>{step.title}</h3>
                <p style={{ color: '#6ee7b7', fontSize: '14px', lineHeight: '1.6' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '100px clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <div style={{ color: '#34d399', fontSize: '13px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Tarifs</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#ecfdf5', marginBottom: '16px' }}>Des prix transparents, sans surprise</h2>
            <p style={{ color: '#6ee7b7', fontSize: '16px' }}>Commencez gratuitement. Évoluez quand vous en avez besoin.</p>
          </div>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
            {PRICING_PLANS.map((plan) => (
              <PricingCard key={plan.name} plan={plan} onCta={goRegister} />
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'rgba(110,231,183,0.5)', fontSize: '13px', marginTop: '32px' }}>
            Tous les plans incluent la TVA. Annulez à tout moment. Remboursement sous 30 jours garanti.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" style={{ padding: '100px clamp(20px, 4vw, 40px)', background: 'rgba(16,185,129,0.03)', borderTop: '1px solid rgba(52,211,153,0.08)', borderBottom: '1px solid rgba(52,211,153,0.08)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ color: '#34d399', fontSize: '13px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Témoignages</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#ecfdf5' }}>Ils font confiance à FacturePro</h2>
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {TESTIMONIALS.map((t) => <TestimonialCard key={t.name} t={t} />)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '100px clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ color: '#34d399', fontSize: '13px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>FAQ</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#ecfdf5' }}>Questions fréquentes</h2>
          </div>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px clamp(20px, 4vw, 40px)', textAlign: 'center', background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.1) 0%, transparent 70%)', borderTop: '1px solid rgba(52,211,153,0.08)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, color: '#ecfdf5', marginBottom: '20px', lineHeight: 1.15 }}>
            Prêt à simplifier votre{' '}
            <span style={{ background: 'linear-gradient(135deg, #10b981, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>facturation ?</span>
          </h2>
          <p style={{ color: '#6ee7b7', fontSize: '17px', marginBottom: '36px', lineHeight: '1.6' }}>
            Rejoignez 50 000 entreprises qui font confiance à FacturePro. Aucune carte bancaire requise pour commencer.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={goRegister} style={{ ...btnPrimary, padding: '16px 40px', borderRadius: '12px', fontSize: '17px', fontWeight: 700, boxShadow: '0 0 50px rgba(16,185,129,0.4)' }}>
              Créer mon compte gratuit
            </button>
            <button type="button" onClick={goLogin} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(52,211,153,0.25)', color: '#d1fae5', padding: '16px 40px', borderRadius: '12px', fontSize: '17px', fontWeight: 500, cursor: 'pointer' }}>
              Contacter les ventes
            </button>
          </div>
          <p style={{ color: 'rgba(110,231,183,0.4)', fontSize: '13px', marginTop: '20px' }}>
            Déjà un compte ?{' '}
            <button type="button" onClick={goLogin} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '13px', padding: 0 }}>Se connecter</button>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '48px clamp(20px, 4vw, 40px)', borderTop: '1px solid rgba(52,211,153,0.1)', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '36px' }}>
          <div style={{ maxWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #10b981, #34d399)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📋</div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#ecfdf5' }}>Facture<span style={{ color: '#34d399' }}>Pro</span></span>
            </div>
            <p style={{ color: '#6ee7b7', fontSize: '13px', lineHeight: '1.6' }}>
              La solution de gestion des factures pour les entreprises modernes. Simple, rapide et sécurisé.
            </p>
          </div>
          {[
            { title: 'Produit', links: [{ label: 'Fonctionnalités', href: '#features' }, { label: 'Tarifs', href: '#pricing' }, { label: 'Témoignages', href: '#testimonials' }] },
            { title: 'Ressources', links: [{ label: 'Documentation', href: '#faq' }, { label: 'FAQ', href: '#faq' }] },
            { title: 'Entreprise', links: [{ label: 'Contact', href: '#faq' }] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ color: '#ecfdf5', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>{col.title}</div>
              {col.links.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => smoothScroll(link.href)}
                  style={{ display: 'block', background: 'none', border: 'none', color: '#6ee7b7', fontSize: '13px', marginBottom: '10px', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#34d399'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#6ee7b7'; }}
                >
                  {link.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(52,211,153,0.08)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', maxWidth: '1100px', margin: '0 auto' }}>
          <span style={{ color: 'rgba(110,231,183,0.4)', fontSize: '13px' }}>© 2024 FacturePro. Tous droits réservés.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Confidentialité', 'CGU', 'Mentions légales', 'Cookies'].map((item) => (
              <span key={item} style={{ color: 'rgba(110,231,183,0.4)', fontSize: '12px', cursor: 'default' }}>{item}</span>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .landing-nav-links { display: none !important; }
        }
        @media (min-width: 769px) {
          .landing-step-arrow { display: block !important; }
        }
      `}</style>
    </div>
  );
}
