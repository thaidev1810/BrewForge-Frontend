import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { login } from '@/features/auth/authSlice';
import { DEMO_PASSWORD } from '@/features/auth/mockAuthService';
import { dashboardPath, roleConfig } from '@/constants/roles';
import { ROLES, type Role } from '@/features/auth/authTypes';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const handleQuickLogin = async (role: Role) => {
    const email = `${role.toLowerCase()}@demo.brewforge.test`;
    try {
      const res = await dispatch(login({ email, password: DEMO_PASSWORD }));
      if (login.fulfilled.match(res)) {
        navigate(dashboardPath(role));
      }
    } catch {
      navigate('/login');
    }
  };

  useEffect(() => {
    const d = document, root = d.documentElement;
    root.classList.add('js');
    const $ = (s: string, r: ParentNode = d) => r.querySelector(s) as HTMLElement | null;
    const $$ = (s: string, r: ParentNode = d) => Array.from(r.querySelectorAll(s)) as HTMLElement[];
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const FINE = matchMedia('(pointer: fine)').matches;
    const clamp = (v: number, a = 0, b = 1) => v < a ? a : v > b ? b : v;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const io3 = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const out3 = (t: number) => 1 - Math.pow(1 - t, 3);
    const esc = (s: string | number) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
    const pad2 = (n: number) => String(n).padStart(2, '0');

    let vw = window.innerWidth, vh = window.innerHeight, sy = window.scrollY;
    let mx = -1e4, my = -1e4, mouse = false, T = 0, dt = 1 / 60;
    const damp = (k: number) => 1 - Math.pow(1 - k, dt * 60);

    const onPointerMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      mouse = e.pointerType === 'mouse';
    };
    const onMouseLeave = () => { mouse = false; };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('mouseleave', onMouseLeave);

    /* ---------- Coffee & Forge Generative Palettes ---------- */
    const PAL: Record<string, string[]> = {
      espresso: ['#120B07', '#4A2A17', '#C68B59', '#FAF3EB'],
      caramel: ['#1E1005', '#8A4512', '#E08B38', '#FDE8CC'],
      crema: ['#1A0C06', '#693717', '#D49455', '#FFF3E3'],
      roast: ['#0F0A09', '#3B211A', '#A25942', '#F1DFD8'],
      forge: ['#160805', '#7A2214', '#D94D26', '#FED7AA'],
      amber: ['#1A0F03', '#8C4D08', '#E69926', '#FEF3C7'],
      nitro: ['#0A0E18', '#1E2D4A', '#4F75A8', '#E0EDFB'],
      cascara: ['#1C070B', '#6D1525', '#C2384D', '#FCE7EA'],
      matcha: ['#0A1409', '#2E5023', '#689B48', '#ECF6E5'],
      steam: ['#121316', '#353B47', '#7E8B9F', '#EFF2F7'],
      cupping: ['#180F0A', '#523321', '#B57C52', '#F7ECE1'],
      terracotta: ['#1A0C08', '#6E2E1B', '#BA5836', '#FBECE6']
    };
    const pf = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const PF: Record<string, Float32Array> = {};
    for (const k in PAL) PF[k] = new Float32Array(PAL[k].flatMap(pf));

    /* ---------- BrewForge Showcase Cases ---------- */
    const CASES = [
      {
        name: 'Golden Cascara Nitro Cold Brew',
        year: 'R&D Lab · Release 2026',
        pal: 'forge',
        handle: 'brewforge_lab',
        cap: 'Signature cascara infusion. 18h slow steep. Nitrogen draft.',
        likes: 'TDS 1.38%',
        url: '#cases',
        desc: 'Formulated in the BrewForge R&D lab for synchronized franchise deployment. Features single-origin Typica cascara, washed Ethiopian beans, and calibrated micro-filtration yielding a velvety guinness-style head.',
        cats: ['R&D Signature', 'Nitro Draft', 'Cascara Fusion'],
        stats: [
          ['1.38%', 'Target TDS', 0.42, -0.34],
          ['21.5%', 'Extr. Yield', -0.8, -0.08],
          ['18 hrs', 'Steep Duration', 0.44, 0.2],
          ['99.4', 'Sensory Score', -0.72, 0.42]
        ]
      },
      {
        name: 'Espresso Dialing & Extraction SOP',
        year: 'SOP Standard · v2.4',
        pal: 'espresso',
        handle: 'brewforge_sop',
        cap: '18.5g in · 38.0g out · 27 sec · 9.2 bar · 93.5°C.',
        likes: 'Daily Calibration',
        url: '#cases',
        desc: 'Our definitive multi-branch espresso standard. Eliminates barista extraction drift with micrometric grind tolerances, standardized WDT distribution, automated volumetric dosing, and real-time refractometer logging.',
        cats: ['Espresso Standard', 'Barista Calibration', 'Zero Drift'],
        stats: [
          ['18.5g', 'Dry Dose', 0.44, -0.44],
          ['38.0g', 'Liquid Yield', 0.42, 0.06],
          ['27.0s', 'Extraction Time', -0.74, 0.2],
          ['±0.2g', 'Tolerance', -0.72, -0.38]
        ]
      },
      {
        name: 'Barista Academy & Sensory Mastery',
        year: 'Certification · Level 3',
        pal: 'crema',
        handle: 'brewforge_academy',
        cap: 'Dialing precision, latte art microfoam, and blind sensory cupping.',
        likes: '80% Pass Mark',
        url: '#cases',
        desc: 'Interactive learning modules, prerequisite knowledge quizzes, and blind sensory cupping tests. Baristas earn verified digital credentials and badge milestones before stepping onto live franchise shifts.',
        cats: ['Barista LMS', 'Sensory Cupping', 'Latte Art'],
        stats: [
          ['80%', 'Pass Threshold', 0.42, -0.2],
          ['14', 'Training Modules', -0.82, 0],
          ['1,240+', 'Certified Baristas', 0.44, 0.3],
          ['100%', 'SOP Compliance', -0.62, 0.46]
        ]
      },
      {
        name: 'Multi-Branch Quality Audit Matrix',
        year: 'Franchise Audit · Q4',
        pal: 'amber',
        handle: 'brewforge_audit',
        cap: '50+ branches. 1 unified standard across every cup.',
        likes: 'Live Audits',
        url: '#cases',
        desc: 'Equip quality auditors and store managers with digital checklists, water filtration testing, milk steaming hygiene checks, and blind taste audits across Hanoi, Saigon, Da Nang, and regional stores.',
        cats: ['Franchise Scale', 'Quality Audits', 'Zero Tolerance'],
        stats: [
          ['99.2%', 'Franchise Score', 0.42, 0.08],
          ['50+', 'Active Branches', -0.8, 0.32],
          ['0', 'Critical Fails', 0.44, 0.44],
          ['24/7', 'Cloud Sync', -0.7, -0.42]
        ]
      }
    ];

    const GPAL = ['espresso', 'forge', 'crema', 'amber', 'caramel', 'roast', 'nitro', 'cascara', 'matcha', 'steam'];
    const GNAMES = [
      'Nitro Cold Brew', 'V60 Ethiopian', 'Espresso Romano', 'Matcha Cloud',
      'Salted Cream Coffee', 'Signature Latte', 'Cascara Spritz', 'Phin Reimagined',
      'Geisha Pour Over', 'Kyoto Slow Drip', 'Cortado Especial', 'Cascara Blossom'
    ];

    const BRANDS: [string, string, string, number, number, string][] = [
      ['V60 Dripper', 'tri', 'Inter Tight', 600, 20, '-0.4'],
      ['Portafilter', 'circle', 'Archivo', 800, 19, '-0.2'],
      ['TDS Meter', 'grid', 'Geist Mono', 600, 18, '0'],
      ['Steam Wand', 'bars', 'Archivo', 900, 19, '1.2'],
      ['Burr Grinder', 'sun', 'Inter Tight', 700, 22, '-0.6'],
      ['Arabica Beans', 'leaf', 'Georgia, serif', 400, 22, '0.2'],
      ['AeroPress', 'slash', 'Geist Mono', 600, 17, '1.4'],
      ['Cold Drip', 'dots', 'Inter Tight', 600, 20, '-0.4'],
      ['Gooseneck', 'arc', 'Archivo', 700, 18, '-0.5'],
      ['Scale 0.1g', 'diamond', 'Inter Tight', 600, 19, '-0.3'],
      ['Cupping Spoon', 'ring', 'Georgia, serif', 400, 22, '0'],
      ['Nitro Tap', 'star', 'Archivo', 900, 19, '0.4']
    ];

    const SERVICES = [
      ['Recipe & Extraction R&D', 'Formulate signature espresso blends, seasonal cold brews, and tea infusions with calibrated brew ratios, TDS targets, and extraction curves.', 'forge'],
      ['Standard Operating Procedures', 'Translate complex specialty craft into fool-proof digital SOPs with integrated brew timers, equipment calibration, and strict tolerances.', 'espresso'],
      ['Barista Academy & Quizzes', 'Train front-line teams through interactive course modules, sensory cupping guides, and strict 80% passing threshold knowledge exams.', 'crema'],
      ['Franchise Quality Audits', 'Empower Quality Auditors and Store Managers with real-time audit tools to guarantee identical cup consistency across every franchise store.', 'amber']
    ];

    const TIERS = [
      {
        n: 'Starter Roastery', word: 'LAB', unit: '1–3 Stores',
        d: 'Essential digital recipe management, standard operating procedures, and basic barista onboarding for independent specialty cafes.',
        f: ['Digital Recipe Library', 'Core SOP Builder & Timers', 'Basic Barista Onboarding', 'Mobile Web App Access'],
        href: '/login', cta: 'Explore Lab', solid: false
      },
      {
        n: 'Franchise Enterprise', word: 'SCALE', unit: 'Multi-Branch', tag: 'Recommended',
        d: 'The complete operations suite for growing coffee chains. Automated multi-branch quality audits, advanced LMS with certification, and versioned R&D.',
        f: ['Unlimited Branches & Stores', 'Full 7-Role Workspace Suite', 'Real-time Branch Auditing', 'Automated Barista Certifications', 'R&D Approval Workflows'],
        href: '/login', cta: 'Launch Workspace', solid: true
      },
      {
        n: 'Custom Chain & API', word: 'FORGE', unit: '50+ Stores',
        d: 'Enterprise-grade customization for large coffee corporations with custom POS/ERP integration and dedicated coffee science consulting.',
        f: ['Custom ERP / POS Integrations', 'Dedicated Coffee Master Consultant', 'Custom Sensory Calibration Matrix', 'White-Label Store Portal'],
        href: '/login', cta: 'Explore Enterprise', solid: false
      }
    ];

    const CMP = [
      ['Recipe Standardization', 'Scattered paper sheets or PDF binders', 'Interactive digital SOPs with live timers & tolerances'],
      ['Espresso Dialing', 'Subjective barista intuition and guesswork', 'Calibrated targets for dry dose, liquid yield, and TDS'],
      ['Staff Training', 'Informal verbal shadowing on busy shifts', 'Structured Barista Academy with 80% passing quizzes'],
      ['Branch Auditing', 'Infrequent sporadic visits from managers', 'Real-time digital audits with photo evidence & scores'],
      ['Recipe Rollouts', 'Outdated instructions lingering in cafes', 'Semantic versioning with instant zero-delay rollouts'],
      ['Equipment Care', 'Repairs only after machine breakdowns', 'Scheduled calibration checklists & water filter logs']
    ];

    const FAQ = [
      ['What is BrewForge and who is it designed for?', 'BrewForge is an end-to-end platform built for specialty coffee chains, roasteries, and franchise brands. It connects R&D teams, trainers, store managers, baristas, and quality auditors into one single source of truth.'],
      ['How does BrewForge ensure identical drink taste across 50+ stores?', 'Through standardized digital SOPs, calibrated extraction targets (dose, yield, temperature, time), and regular audit inspections. When every barista follows identical parameters, customers experience identical specialty quality in every city.'],
      ['Can baristas use BrewForge on mobile phones during busy shifts?', 'Yes! BrewForge is engineered mobile-first. Baristas can look up SOPs in seconds, follow interactive brew timers, and complete daily calibration checks directly from their phone or bar tablet.'],
      ['How do R&D Specialists and Managers collaborate on new drinks?', 'Specialists draft beverages with experimental extraction parameters. When dialed in, they submit for review. R&D Managers approve and publish with semantic versioning (v1.0, v2.0), leaving historical snapshots intact.'],
      ['How do the 7 demo role workspaces work?', 'You can test all 7 roles directly on the platform: Administrator, R&D Specialist, R&D Manager, Trainer, Store Manager, Barista, and Quality Auditor. Click "Launch App" or pick any role in the top header to explore their dedicated dashboard.'],
      ['Does BrewForge support offline bar usage?', 'Yes, core SOPs and dialing guides are cached locally so baristas can continue pulling dialed shots even if the cafe internet temporarily drops.']
    ];

    /* ---------- build DOM elements ---------- */
    const ext = (u: string) => `href="${u}"`;
    const artAttr = (pal: string, seed: number, zoom: number | string) =>
      `data-pal="${pal}" data-seed="${seed}" data-zoom="${zoom}" style="--a:${PAL[pal][0]};--c:${PAL[pal][2]}"`;

    const caseListEl = $('#caseList');
    if (caseListEl) {
      caseListEl.innerHTML = CASES.map((c, i) => `<article class="case" data-i="${i}">
        <div class="case-inner">
          <div class="case-row pad"><span class="mono lab"><i class="sq"></i>Standard</span><span class="case-line"></span><span class="case-num">${pad2(i + 1)}</span></div>
          <div class="case-body pad"><p class="mono">${c.year}</p><h3 class="case-name">${esc(c.name)}</h3><p class="case-desc">${esc(c.desc)}</p><a class="case-link mono" ${ext(c.url)}>Explore Specification <span>→</span></a></div>
          <div class="case-cats"><p class="mono">Domains</p><div class="chips mono">${c.cats.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div></div>
        </div>
      </article>`).join('');
    }

    const caseStatsLayerEl = $('#caseStatsLayer');
    if (caseStatsLayerEl) {
      caseStatsLayerEl.innerHTML = CASES.map((c, i) => `
        <div class="case-stats-group" data-case="${i}">
          ${c.stats.map((s, k) => `<div class="stat" style="--sx:${s[2]};--sy:${s[3]};--k:${k}"><b data-count="${esc(s[0])}">${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}
        </div>
      `).join('');
    }

    const galGridEl = $('#galGrid');
    if (galGridEl) {
      let gh = '';
      for (let c = 0; c < 6; c++) {
        gh += `<div class="gal-col" style="margin-top:${c % 2 ? -24 : 0}vw">`;
        for (let r = 0; r < 4; r++) {
          const i = c * 4 + r, pal = GPAL[(i * 7 + c) % GPAL.length];
          gh += `<figure class="gal-card" style="margin:0"><div class="art" ${artAttr(pal, i + 3, (1 + ((i * 37) % 9) / 10).toFixed(2))}></div><figcaption><span>${esc(GNAMES[i % GNAMES.length])}</span><span>${pad2(i + 1)}</span></figcaption></figure>`;
        }
        gh += '</div>';
      }
      galGridEl.innerHTML = gh;
    }

    const ICON: Record<string, string> = {
      circle: '<circle cx="14" cy="20" r="9" fill="currentColor"/>',
      tri: '<path d="M4 29 14 10 24 29Z" fill="currentColor"/>',
      leaf: '<path d="M5 29C5 17 13 10 24 10 24 22 16 29 5 29Z" fill="currentColor"/>',
      bars: '<rect x="4" y="12" width="4.5" height="17" fill="currentColor"/><rect x="11.5" y="16" width="4.5" height="13" fill="currentColor"/><rect x="19" y="9" width="4.5" height="20" fill="currentColor"/>',
      star: '<path d="M14 8l2.7 7.6H25l-6.4 4.7 2.4 7.7L14 23.3 7 28l2.4-7.7L3 15.6h8.3z" fill="currentColor"/>',
      arc: '<path d="M4 29a10 10 0 0 1 20 0" fill="none" stroke="currentColor" stroke-width="4.5"/>',
      grid: '<rect x="5" y="11" width="8" height="8" fill="currentColor"/><rect x="15" y="11" width="8" height="8" fill="currentColor" opacity=".45"/><rect x="5" y="21" width="8" height="8" fill="currentColor" opacity=".45"/><rect x="15" y="21" width="8" height="8" fill="currentColor"/>',
      diamond: '<rect x="8" y="14" width="12" height="12" transform="rotate(45 14 20)" fill="currentColor"/>',
      ring: '<circle cx="14" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="3.8"/>',
      sun: '<circle cx="14" cy="20" r="5" fill="currentColor"/><path d="M14 8v5M14 27v5M2 20h5M21 20h5M5.5 11.5 9 15M19 25l3.5 3.5M5.5 28.5 9 25M19 15l3.5-3.5" stroke="currentColor" stroke-width="2"/>',
      dots: '<circle cx="6" cy="20" r="3.4" fill="currentColor"/><circle cx="14" cy="20" r="3.4" fill="currentColor"/><circle cx="22" cy="20" r="3.4" fill="currentColor"/>',
      slash: '<path d="M6 30 14 10M13.5 30l8-20" stroke="currentColor" stroke-width="4"/>'
    };

    const brandGridEl = $('#brandGrid');
    if (brandGridEl) {
      brandGridEl.innerHTML = BRANDS.map((b, i) => `<div class="brand" data-r style="--d:${i * 45}"><svg viewBox="0 0 160 40" role="img" aria-label="${esc(b[0])}">${ICON[b[1]]}<text x="33" y="27" font-family="${b[2]}, Arial, sans-serif" font-size="${b[4]}" font-weight="${b[3]}" letter-spacing="${b[5]}" fill="currentColor">${esc(b[0])}</text></svg></div>`).join('');
    }

    const svcListEl = $('#svcList');
    if (svcListEl) {
      svcListEl.innerHTML = SERVICES.map((s, i) => `<div class="svc" data-r data-svc="${i}"><h3><span class="svc-n">${pad2(i + 1)}</span>${s[0]}</h3><p>${esc(s[1])}</p></div>`).join('');
    }

    const svcPrevEl = $('#svcPrev');
    if (svcPrevEl) {
      svcPrevEl.innerHTML = SERVICES.map((s, i) => `<div class="art" data-pal="${s[2]}" data-seed="${40 + i}" data-zoom="1.3" style="--a:${PAL[s[2]][0]};--c:${PAL[s[2]][2]};opacity:${i ? 0 : 1}"></div>`).join('');
    }

    const priceRowEl = $('#priceRow');
    if (priceRowEl) {
      priceRowEl.innerHTML = TIERS.map(t => `<div class="pcard"><div class="pcard-h"><span class="mono lab"><i class="sq" style="width:5px;height:5px"></i>${t.n}</span><span class="mono" style="color:var(--accent)">${t.tag || ''}</span></div>
<div class="price"><b>${t.word}</b><small>${esc(t.unit)}</small></div><p>${esc(t.d)}</p>
<a class="btn ${t.solid ? 'btn-red' : 'btn-ghost'}" ${ext(t.href)}><span class="btn-l" data-scramble>${t.cta}</span><span class="btn-a" aria-hidden="true"><i>→</i><i>→</i></span></a>
<ul class="feat">${t.f.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('');
    }

    const cmpBodyEl = $('#cmpBody');
    if (cmpBodyEl) {
      cmpBodyEl.innerHTML = CMP.map((r, i) => `<tr style="--k:${i}"><td class="mono">${r[0]}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('');
    }

    const faqListEl = $('#faqList');
    if (faqListEl) {
      faqListEl.innerHTML = FAQ.map((f, i) => `<div class="qa"${i === 0 ? ' open' : ''}><button type="button" aria-expanded="${i === 0}" aria-controls="qa${i}">${esc(f[0])}<i aria-hidden="true">+</i></button><div class="qa-a" id="qa${i}"><div><p>${esc(f[1])}</p></div></div></div>`).join('');
    }

    /* ---------- text splitting ---------- */
    function splitWords(el: HTMLElement) {
      const words = el.textContent?.trim().split(/\s+/) || [];
      let i = 0;
      el.innerHTML = words.map(w => w === '/' ? '<br>' : `<span class="w"><i style="--i:${i++}">${esc(w)}</i></span>`).join(' ');
    }
    $$('[data-split],[data-words-split]').forEach(splitWords);
    const stEl = $('#statement');
    let stSpans: HTMLElement[] = [];
    if (stEl) {
      $$('.st-text', stEl).forEach(p => {
        const words = p.textContent?.trim().split(/\s+/) || [];
        p.innerHTML = words.map(w => `<span>${esc(w)}</span>`).join(' ');
      });
      stSpans = $$('.st-text span', stEl);
    }

    /* ---------- smooth wheel scroll ---------- */
    const sm = { t: window.scrollY, c: window.scrollY, on: false, en: !RM && FINE };
    const maxS = () => root.scrollHeight - window.innerHeight;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.defaultPrevented) return;
      e.preventDefault();
      if (!sm.on) { sm.c = sm.t = window.scrollY; }
      const k = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
      sm.t = clamp(sm.t + e.deltaY * k, 0, maxS());
      sm.on = true;
    };
    const onScroll = () => { if (!sm.on) { sm.c = sm.t = window.scrollY; } };
    const onKeydown = (e: KeyboardEvent) => { if (!/^(Tab|Shift|Alt|Control|Meta)$/.test(e.key)) sm.on = false; };

    if (sm.en) {
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('keydown', onKeydown, { passive: true });
    }

    function scrollToY(y: number) {
      y = clamp(y, 0, maxS());
      if (sm.en) { if (!sm.on) sm.c = window.scrollY; sm.t = y; sm.on = true; }
      else window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
    }
    const docTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const t = id && id.length > 1 ? d.getElementById(id.slice(1)) : null;
      if (!t) return;
      e.preventDefault();
      scrollToY(id === '#top' ? 0 : docTop(t));
    }));

    /* ---------- scramble effect ---------- */
    const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>';
    function scramble(el: HTMLElement & { _s?: number }) {
      if (el._s || RM) return;
      const fin = el.dataset.txt || (el.dataset.txt = el.textContent || '');
      el._s = 1;
      let f = 0;
      const run = () => {
        let o = '';
        for (let i = 0; i < fin.length; i++) {
          const c = fin[i];
          o += (i < f / 2 || c === ' ') ? c : CH[(Math.random() * CH.length) | 0];
        }
        el.textContent = o;
        f++;
        if (f / 2 < fin.length) requestAnimationFrame(run);
        else { el.textContent = fin; el._s = 0; }
      };
      run();
    }
    $$('[data-scramble]').forEach(el => {
      const h = el.closest('a,button') || el;
      h.addEventListener('mouseenter', () => scramble(el));
    });

    /* ---------- reveal & countUp ---------- */
    function countUp(el: HTMLElement) {
      const raw = el.dataset.count || '', m = raw.match(/^([+−-]?)([\d.]+)(.*)$/);
      if (!m || RM) return;
      const v = parseFloat(m[2]), dec = (m[2].split('.')[1] || '').length, t0 = performance.now();
      const run = (now: number) => {
        const p = clamp((now - t0) / 1300);
        el.textContent = m[1] + (v * out3(p)).toFixed(dec) + m[3];
        if (p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const t = e.target as HTMLElement;
      t.classList.add('in');
      io.unobserve(t);
      if (t.classList.contains('case')) $$('[data-count]', t).forEach(countUp);
    }), { rootMargin: '0px 0px -12% 0px' });
    $$('[data-r],[data-split],.case,#cmp').forEach(el => io.observe(el));

    /* ---------- Kinetic Wordmark: BREWFORGE ---------- */
    function WM(el: HTMLElement | null, { word = 'BREWFORGE', ratio, ratioM, front, extra = 1 }: { word?: string; ratio: number; ratioM: number; front?: boolean; extra?: number }) {
      if (!el) return { el, G: [], measure: () => {}, update: () => {} };
      el.innerHTML = word.split('').map((c, i) => `<span class="wm-l${front && i === 4 ? ' front' : ''}" style="--k:${i}" aria-hidden="true"><span class="wm-g">${c}</span></span>`).join('');
      const L = $$('.wm-l', el), G = $$('.wm-g', el), n = L.length, inf = new Array(n).fill(0), base = new Array(n).fill(1);
      let W = 1;
      function measure() {
        if (!el) return;
        W = el.clientWidth;
        const H = W / (vw < 700 ? ratioM : ratio);
        el.style.height = (H * extra) + 'px';
        el.style.setProperty('--wm-fs', (H / 0.74) + 'px');
        L.forEach((l, i) => { l.style.transform = 'none'; base[i] = l.offsetWidth || 1; });
      }
      function update() {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        const act = mouse && my > r.top - 180 && my < r.bottom + 180, tot = base.reduce((a, b) => a + b, 0);
        let acc = 0, sum = 0;
        const des = new Array(n);
        for (let i = 0; i < n; i++) {
          const cx = r.left + (acc + base[i] / 2) / tot * W;
          acc += base[i];
          let g = act ? Math.exp(-Math.pow((mx - cx) / (W * 0.15), 2)) : 0;
          if (!RM) g += 0.07 * (Math.sin(T * 1.2 + i * 1.4) * 0.5 + 0.5);
          inf[i] += (g - inf[i]) * damp(0.09);
          des[i] = base[i] * (1 + 1.05 * inf[i]);
          sum += des[i];
        }
        const k = sum > 0 ? W / sum : 1;
        let x = 0;
        for (let i = 0; i < n; i++) {
          const w = des[i] * k;
          L[i].style.transform = `translate3d(${x.toFixed(2)}px,0,0) scale(${(w / base[i]).toFixed(4)},${(1 + 0.17 * inf[i]).toFixed(4)})`;
          x += w;
        }
      }
      return { el, G, measure, update };
    }
    const wmHero = WM($('#wmHero'), { word: 'BREWFORGE', ratio: 5.1, ratioM: 3.8, front: true });
    const wmFoot = WM($('#wmFoot'), { word: 'BREWFORGE', ratio: 5.3, ratioM: 4.0, extra: 1.16 });

    /* ---------- WebGL Procedural Fluid Shaders ---------- */
    const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;uniform float uTime;uniform float uSeed;uniform float uMix;uniform float uZoom;uniform vec3 uPA[4];uniform vec3 uPB[4];
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/uRes;
 vec2 p=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y)*uZoom+vec2(uSeed*3.17,uSeed*1.71);
 float t=uTime*.07;
 vec2 q=vec2(fbm(p+vec2(0.,t)),fbm(p+vec2(5.2,1.3)-t*.8));
 vec2 r=vec2(fbm(p+2.4*q+vec2(1.7,9.2)+.18*t),fbm(p+2.4*q+vec2(8.3,2.8)-.14*t));
 float f=fbm(p+2.2*r);
 vec3 c0=mix(uPA[0],uPB[0],uMix),c1=mix(uPA[1],uPB[1],uMix),c2=mix(uPA[2],uPB[2],uMix),c3=mix(uPA[3],uPB[3],uMix);
 vec3 col=mix(c0,c1,smoothstep(.18,.62,f));
 col=mix(col,c2,smoothstep(.45,.95,length(q)*.95));
 col=mix(col,c3,smoothstep(.6,.92,r.y)*.8);
 float ridge=abs(sin((f*1.3+r.x)*10.));
 col+=(1.-smoothstep(0.,.22,ridge))*.06*(.5+f);
 col*=.78+.42*f;
 vec2 lp=uv-vec2(.72,.82);col+=c3*.22*exp(-dot(lp,lp)*7.);
 vec2 v=uv-.5;col*=1.-.55*dot(v,v);
 col+=(h(gl_FragCoord.xy+fract(uTime*3.7)*91.)-.5)*.075;
 gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;
    function makeGL(canvas: HTMLCanvasElement, keep = false) {
      let gl: WebGLRenderingContext | null = null;
      try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: !!keep, powerPreference: 'low-power' }); } catch { /* webgl unavailable */ }
      if (!gl) return null;
      const sh = (t: number, s: string) => {
        if (!gl) return null;
        const o = gl.createShader(t);
        if (!o) return null;
        gl.shaderSource(o, s);
        gl.compileShader(o);
        return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null;
      };
      const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) return null;
      const pr = gl.createProgram();
      if (!pr) return null;
      gl.attachShader(pr, vs);
      gl.attachShader(pr, fs);
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
      gl.useProgram(pr);
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U: Record<string, WebGLUniformLocation | null> = {};
      ['uRes', 'uTime', 'uSeed', 'uMix', 'uZoom', 'uPA', 'uPB'].forEach(k => U[k] = gl!.getUniformLocation(pr, k));
      return {
        gl, canvas, draw(t: number, seed: number, pa: Float32Array, pb: Float32Array, mix: number, zoom: number) {
          if (!gl) return;
          const w = canvas.width, h = canvas.height;
          gl.viewport(0, 0, w, h);
          if (U.uRes) gl.uniform2f(U.uRes, w, h);
          if (U.uTime) gl.uniform1f(U.uTime, t);
          if (U.uSeed) gl.uniform1f(U.uSeed, seed);
          if (U.uMix) gl.uniform1f(U.uMix, mix);
          if (U.uZoom) gl.uniform1f(U.uZoom, zoom);
          if (U.uPA) gl.uniform3fv(U.uPA, pa);
          if (U.uPB) gl.uniform3fv(U.uPB, pb);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
      };
    }
    const bakeCv = d.createElement('canvas');
    const baker = makeGL(bakeCv, true);
    function bake(el: HTMLElement & { _baked?: number }) {
      if (!baker || el._baked) return;
      el._baked = 1;
      const pal = PF[el.dataset.pal || ''] || PF.espresso || PF.forge, seed = +(el.dataset.seed || 1), zoom = +(el.dataset.zoom || 1);
      const w = el.offsetWidth, h = el.offsetHeight;
      const ar = w && h ? w / h : 9 / 16;
      const L = 440;
      bakeCv.width = Math.round(ar >= 1 ? L : L * ar);
      bakeCv.height = Math.round(ar >= 1 ? L / ar : L);
      if (bakeCv.width < 24) { bakeCv.width = bakeCv.height = 96; }
      baker.draw(seed * 3.7, seed, pal, pal, 0, zoom);
      try { el.style.backgroundImage = `url(${bakeCv.toDataURL('image/jpeg', 0.84)})`; } catch { /* bake unavailable */ }
    }
    const bakeQ = $$('.art');
    function bakeSome() {
      let k = 0;
      while (bakeQ.length && k < 4) {
        const item = bakeQ.shift();
        if (item) bake(item);
        k++;
      }
      if (bakeQ.length) requestAnimationFrame(bakeSome);
    }

    /* Phone + Reel GL */
    const phoneCv = $('#phoneCv') as HTMLCanvasElement | null;
    const phoneGL = phoneCv ? makeGL(phoneCv) : null;
    const reelCv = $('#reelCv') as HTMLCanvasElement | null;
    const reelGL = reelCv ? makeGL(reelCv) : null;
    if (phoneCv && !phoneGL) phoneCv.style.display = 'none';
    let pa = new Float32Array(PF[CASES[0].pal]), pb = new Float32Array(pa), pmix = 1, ptime = Math.random() * 20;
    function palTo(name: string) {
      const cur = new Float32Array(12);
      for (let i = 0; i < 12; i++) cur[i] = lerp(pa[i], pb[i], pmix);
      pa = cur;
      pb = new Float32Array(PF[name]);
      pmix = 0;
      const scrEl = $('.phone-scr');
      if (scrEl) scrEl.style.background = `linear-gradient(160deg,${PAL[name][2]},${PAL[name][0]})`;
    }
    let reelPlay = false, rtime = 5;
    const DPR = () => Math.min(window.devicePixelRatio || 1, 1.5);

    /* ---------- Phone Travel Engine ---------- */
    const phone = $('#phone'), phoneIn = $('#phoneIn'), scr = $('.phone-scr');
    const slotH = $('#slotHero'), slotS = $('#slotStatement'), slotC = $('#slotCase'), work = $('#work');
    let T1 = 1, T2 = 2, tx = 0, ty = 0;
    let pvW = 180, pvH = 240;

    function sizes() {
      let pw = vw < 700 ? vw * 0.4 : Math.min(vw * 0.21, 300, (vh - 150) / 2.06);
      pw = Math.max(pw, 140);
      root.style.setProperty('--pw', pw + 'px');
      root.style.setProperty('--ph', (pw * 2.06) + 'px');
    }
    function measurePhone() {
      if (!slotS || !work || !phoneCv || !scr || !reelCv) return;
      const b = slotS.getBoundingClientRect();
      T1 = Math.max(1, b.top + window.scrollY + b.height / 2 - vh / 2);
      T2 = Math.max(T1 + 1, work.getBoundingClientRect().top + window.scrollY);
      const dpr = DPR();
      phoneCv.width = Math.round(scr.clientWidth * dpr);
      phoneCv.height = Math.round(scr.clientHeight * dpr);
      reelCv.width = Math.round(reelCv.clientWidth * 0.7) || 2;
      reelCv.height = Math.round(reelCv.clientHeight * 0.7) || 2;
      const prevEl = $('#svcPrev');
      if (prevEl) { pvW = prevEl.offsetWidth; pvH = prevEl.offsetHeight; }
    }
    let phoneOn = false;
    function updatePhone() {
      if (!slotH || !slotS || !slotC || !phone || !phoneIn) return;
      const a = slotH.getBoundingClientRect(), b = slotS.getBoundingClientRect(), c = slotC.getBoundingClientRect();
      let x: number, y: number, rot: number;
      const r0 = vw < 700 ? 6 : 7;
      if (sy <= T1) {
        const t = io3(clamp(sy / T1));
        x = lerp(a.left, b.left, t);
        y = lerp(a.top, b.top, t);
        rot = lerp(r0, 0, t);
      } else {
        const t = io3(clamp((sy - T1) / (T2 - T1)));
        x = lerp(b.left, c.left, t);
        y = lerp(b.top, c.top, t);
        rot = 0;
      }
      const ph = c.height;
      phoneOn = y < vh + 40 && y + ph > -40;
      phone.style.visibility = phoneOn ? 'visible' : 'hidden';
      if (!phoneOn) return;
      phone.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg)`;
      const tgx = mouse && !RM ? (my / vh - 0.5) * -9 : 0;
      const tgy = mouse && !RM ? (mx / vw - 0.5) * 13 : 0;
      tx += (tgx - tx) * damp(0.06);
      ty += (tgy - ty) * damp(0.06);
      phoneIn.style.transform = `perspective(1100px) rotateX(${tx.toFixed(2)}deg) rotateY(${ty.toFixed(2)}deg)`;
      if (phoneGL) {
        if (pmix < 1) pmix = Math.min(1, pmix + dt / 1.1);
        ptime += dt;
        phoneGL.draw(ptime, 1.3, pa, pb, io3(pmix), 1.25);
      }
    }

    /* Phone UI State & Stats Transition */
    const caseEls = $$('.case'), bars = $$('#phBars i'), statGroups = $$('.case-stats-group');
    let caseIdx = -1, barI = 0, barT = 0;
    let swapTO: ReturnType<typeof setTimeout>;
    function setCase(i: number) {
      caseIdx = i;
      if (i < 0 || i >= CASES.length) {
        statGroups.forEach(g => {
          $$('.stat', g).forEach(s => {
            s.classList.remove('in');
            s.classList.add('out');
          });
        });
        return;
      }

      const c = CASES[i];
      palTo(c.pal);
      barI = 0;
      barT = 0;
      const parts = [$('#phTop'), $('#phBottom')];
      parts.forEach(p => p?.classList.add('out'));
      clearTimeout(swapTO);
      swapTO = setTimeout(() => {
        const handle = $('#phHandle'), cap = $('#phCap'), likes = $('#phLikes');
        if (handle) handle.textContent = c.handle;
        if (cap) cap.textContent = c.cap;
        if (likes) likes.textContent = c.likes;
        parts.forEach(p => p?.classList.remove('out'));
      }, 320);

      statGroups.forEach((g, idx) => {
        const stats = $$('.stat', g);
        if (idx === i) {
          stats.forEach(s => {
            s.classList.remove('out');
            s.classList.add('in');
            const num = $('b[data-count]', s);
            if (num) countUp(num);
          });
        } else {
          stats.forEach(s => {
            s.classList.remove('in');
            s.classList.add('out');
          });
        }
      });
    }
    function updateCases() {
      const workEl = $('#work');
      const workRect = workEl?.getBoundingClientRect();
      const inWork = !!(workRect && sy >= T2 - 35 && workRect.bottom >= vh * 0.35);

      let idx = -1;
      if (inWork) {
        idx = 0;
        for (let i = 0; i < caseEls.length; i++) {
          if (caseEls[i].getBoundingClientRect().top <= vh * 0.5) idx = i;
        }
      }

      if (idx !== caseIdx) setCase(idx);
      if (!phoneOn) return;
      barT += dt / 4.5;
      if (barT >= 1) { barT = 0; barI = (barI + 1) % (bars.length || 1); }
      bars.forEach((b, i) => {
        const first = b.firstChild as HTMLElement | null;
        if (first) first.style.width = (i < barI ? 100 : i === barI ? barT * 100 : 0) + '%';
      });
    }

    /* Hero Tags parallax */
    const tags = $$('.tag-p').map(el => ({ el, dp: +(el.dataset.depth || 0), x: 0, y: 0 }));
    function updateTags() {
      if (sy > vh * 1.4) return;
      tags.forEach(t => {
        const gx = mouse && !RM ? (mx / vw - 0.5) * t.dp : 0;
        const gy = mouse && !RM ? (my / vh - 0.5) * t.dp : 0;
        t.x += (gx - t.x) * damp(0.07);
        t.y += (gy - t.y) * damp(0.07);
        t.el.style.transform = `translate3d(${t.x.toFixed(2)}px,${t.y.toFixed(2)}px,0)`;
      });
    }

    /* Statement Words */
    function updateStatement() {
      if (!stEl || !stSpans.length) return;
      const r = stEl.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh) return;
      const p = clamp((vh * 0.88 - r.top) / (r.height * 0.75 + vh * 0.3)), n = stSpans.length;
      stSpans.forEach((s, i) => { s.style.opacity = RM ? '1' : (.16 + .84 * clamp(p * n * 1.15 - i)).toFixed(3); });
    }

    /* Gallery 3D rotation */
    const gal = $('#gallery'), galGrid = $('#galGrid'), galCols = $$('.gal-col'), galCur = $('#galCursor'), galPin = $('#galPin');
    let gcx = vw / 2, gcy = vh / 2;
    function updateGallery() {
      if (!gal || !galGrid || !galPin || !galCur) return;
      const r = gal.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = clamp(-r.top / (r.height - vh)), e = io3(clamp(p * 1.3));
      const s = RM ? 1 : lerp(2.4, 1, e);
      galGrid.style.transform = `translate(-50%,-50%) rotate(${lerp(-4, -9, e).toFixed(2)}deg) scale(${s.toFixed(4)})`;
      galCols.forEach((c, i) => { c.style.transform = `translate3d(0,${((i % 2 ? 1 : -1) * (p - 0.5) * 16).toFixed(2)}vw,0)`; });
      const pr = galPin.getBoundingClientRect(), inside = mouse && my > pr.top && my < pr.bottom;
      const gx = inside ? mx - pr.left : pr.width / 2, gy = inside ? my - pr.top : pr.height / 2;
      gcx += (gx - gcx) * damp(0.14);
      gcy += (gy - gcy) * damp(0.14);
      galCur.style.transform = `translate3d(${gcx.toFixed(1)}px,${gcy.toFixed(1)}px,0)`;
      galCur.style.setProperty('--cs', inside ? '1' : '.9');
    }

    /* Services cursor preview */
    const prev = $('#svcPrev'), prevArts = prev ? $$('.art', prev) : [];
    const pv = { x: 0, y: 0, on: false, r: 0 };
    $$('.svc').forEach(row => {
      row.addEventListener('mouseenter', () => {
        if (!FINE || !prev) return;
        const i = +(row.dataset.svc || 0);
        prevArts.forEach((a, k) => a.style.opacity = k === i ? '1' : '0');
        if (!pv.on) { pv.x = mx; pv.y = my; }
        pv.on = true;
        prev.classList.add('on');
      });
      row.addEventListener('mouseleave', () => {
        pv.on = false;
        prev?.classList.remove('on');
      });
    });
    function updatePrev() {
      if (!prev) return;
      if (!pv.on && !prev.classList.contains('on') && Math.abs(mx - pv.x) < 1) return;
      const px = pv.x;
      pv.x += (mx - pv.x) * damp(0.12);
      pv.y += (my - pv.y) * damp(0.12);
      pv.r += (clamp((pv.x - px) * 0.6, -14, 14) - pv.r) * damp(0.1);
      prev.style.transform = `translate3d(${(pv.x - pvW * 0.5).toFixed(1)}px,${(pv.y - pvH * 0.55).toFixed(1)}px,0) rotate(${pv.r.toFixed(2)}deg)`;
    }

    /* Reel Card */
    const reelCard = $('#reelCard'), reelPlayEl = $('#reelPlay'), reelIcon = $('#reelIcon'), reelState = $('#reelState');
    let rpx = 0, rpy = 0, reelVis = false;
    function toggleReel() {
      reelPlay = !reelPlay;
      if (reelIcon) reelIcon.textContent = reelPlay ? '❚❚' : '▶';
      if (reelState) reelState.textContent = reelPlay ? 'Playing · Masterclass 2026' : 'Showreel · 01:24';
    }
    if (reelCard) {
      reelCard.addEventListener('click', toggleReel);
      reelCard.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleReel(); }
      });
    }
    function updateReel() {
      if (!reelCard || !reelPlayEl) return;
      const sec = reelCard.parentElement?.getBoundingClientRect();
      if (!sec) return;
      reelVis = sec.bottom > 0 && sec.top < vh;
      if (!reelVis) return;
      const p = clamp((vh - sec.top) / (vh * 0.95));
      reelCard.style.transform = RM ? 'none' : `scale(${lerp(0.82, 1, out3(p)).toFixed(4)})`;
      reelCard.style.borderRadius = lerp(28, 12, p).toFixed(1) + 'px';
      const r = reelCard.getBoundingClientRect(), inside = mouse && mx > r.left && mx < r.right && my > r.top && my < r.bottom;
      const gx = inside ? mx - r.left : r.width / 2, gy = inside ? my - r.top : r.height / 2;
      const sc = r.width / (reelCv?.clientWidth || r.width) || 1;
      rpx += (gx / sc - rpx) * damp(0.12);
      rpy += (gy / sc - rpy) * damp(0.12);
      reelPlayEl.style.transform = `translate3d(${rpx.toFixed(1)}px,${rpy.toFixed(1)}px,0)`;
      reelPlayEl.style.setProperty('--ps', inside ? '1.15' : '1');
      if (reelGL) {
        rtime += dt * (reelPlay ? 3 : 0.7);
        reelGL.draw(rtime, 4.2, PF.forge, PF.espresso, 0.4, 1.05);
      }
    }

    /* Pricing Scramble & Lift */
    const priceRow = $('#priceRow'), pcards = priceRow ? $$('.pcard', priceRow) : [];
    const prices = pcards.map(c => $('.price b', c));
    function updatePricing() {
      if (!priceRow) return;
      const r = priceRow.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = clamp((vh - r.top) / (vh * 0.8));
      pcards.forEach((c, i) => {
        const q = RM ? 1 : out3(clamp(p * 1.2 - i * 0.08));
        c.style.transform = RM ? 'none' : `translate3d(0,${((1 - q) * (80 + i * 60)).toFixed(1)}px,0)`;
        const w = TIERS[i].word;
        if (q >= 0.995) {
          if (prices[i] && prices[i]!.textContent !== w) prices[i]!.textContent = w;
          return;
        }
        const k = Math.floor(q * w.length);
        let o = w.slice(0, k);
        for (let j = k; j < w.length; j++) o += CH[(Math.random() * CH.length) | 0];
        if (prices[i]) prices[i]!.textContent = o;
      });
    }

    /* FAQ accordion */
    const qas = $$('.qa');
    qas.forEach(q => {
      const b = $('button', q);
      b?.addEventListener('click', () => {
        const o = !q.hasAttribute('open');
        q.toggleAttribute('open', o);
        b.setAttribute('aria-expanded', String(o));
      });
    });
    function updateFaq() {
      qas.forEach(q => {
        const r = q.getBoundingClientRect();
        if (r.top > vh + 20 || r.bottom < 0) return;
        q.style.opacity = RM ? '1' : (.12 + .88 * clamp((vh * .97 - r.top) / (vh * .28))).toFixed(3);
      });
    }

    $('#newsForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const emailInput = $('#nEmail') as HTMLInputElement | null;
      const em = emailInput?.value.trim() || '';
      const msg = $('#newsMsg');
      if (msg) msg.textContent = /^\S+@\S+\.\S+$/.test(em) ? 'Subscribed to The Brew Dispatch. Thank you!' : 'Please enter a valid email address.';
    });

    /* Footer Rise */
    function updateFoot() {
      if (!wmFoot.el) return;
      const r = wmFoot.el.getBoundingClientRect();
      if (r.top > vh + 20) return;
      const p = clamp((vh - r.top) / (r.height * 1.5));
      wmFoot.G.forEach((g, i) => {
        const q = RM ? 1 : out3(clamp(p * 1.35 - i * 0.08));
        g.style.transform = `translate3d(0,${((1 - q) * 105).toFixed(2)}%,0)`;
      });
    }

    /* Navigation scroll show/hide */
    const nav = $('#nav');
    let lastY = window.scrollY;
    function updateNav() {
      if (!nav) return;
      if (sy > lastY + 3 && sy > vh * 0.5) nav.classList.add('hide');
      else if (sy < lastY - 3) nav.classList.remove('hide');
      nav.classList.toggle('logo', sy > vh * 0.75);
      lastY = sy;
    }

    /* Resize & Animation Loop */
    function onResize() {
      vw = window.innerWidth;
      vh = window.innerHeight;
      sizes();
      wmHero.measure();
      wmFoot.measure();
      measurePhone();
    }
    let rzT: ReturnType<typeof setTimeout>;
    const handleResize = () => { clearTimeout(rzT); rzT = setTimeout(onResize, 80); };
    window.addEventListener('resize', handleResize);

    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      let roT: ReturnType<typeof setTimeout>;
      ro = new ResizeObserver(() => { clearTimeout(roT); roT = setTimeout(() => { measurePhone(); }, 120); });
      ro.observe(d.body);
    }

    let last = performance.now();
    let animFrameId: number;
    function frame(now: number) {
      dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      T += dt;
      if (sm.on) {
        sm.c += (sm.t - sm.c) * damp(0.1);
        if (Math.abs(sm.t - sm.c) < 0.5) { sm.c = sm.t; sm.on = false; }
        window.scrollTo(0, sm.c);
      }
      sy = window.scrollY;
      updateNav();
      updateTags();
      wmHero.update();
      updatePhone();
      updateCases();
      updateStatement();
      updateGallery();
      updatePrev();
      updateReel();
      updatePricing();
      updateFaq();
      wmFoot.update();
      updateFoot();
      animFrameId = requestAnimationFrame(frame);
    }

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    onResize();
    animFrameId = requestAnimationFrame(frame);

    const go = () => {
      if (root.classList.contains('ready')) return;
      onResize();
      root.classList.add('ready');
      setTimeout(bakeSome, 250);
    };
    type DocumentWithFonts = Document & { fonts?: { ready?: Promise<void> } };
    const docFonts = (d as DocumentWithFonts).fonts;
    const fontsReady = docFonts?.ready ?? Promise.resolve();
    Promise.race([fontsReady, new Promise(r => setTimeout(r, 1400))]).then(() => requestAnimationFrame(go));
    if (docFonts?.ready) docFonts.ready.then(() => setTimeout(onResize, 50));
    const fallbackTO = setTimeout(go, 2500);

    return () => {
      cancelAnimationFrame(animFrameId);
      clearTimeout(rzT);
      clearTimeout(fallbackTO);
      window.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', handleResize);
      if (sm.en) {
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('keydown', onKeydown);
      }
      ro?.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <>
      <header className="nav" id="nav">
        <div className="nav-in">
          <a className="nav-logo" href="#top" aria-label="BrewForge, back to top">BREWFORGE</a>
          <div className="nav-r">
            <nav className="nav-links mono" aria-label="Primary">
              <a href="#work"><span data-scramble>Standards</span></a>
              <a href="#services"><span data-scramble>Platform</span></a>
              <a href="#pricing"><span data-scramble>Editions</span></a>
              <a href="#faq"><span data-scramble>FAQ</span></a>
            </nav>
            {isAuthenticated && user ? (
              <button
                type="button"
                className="btn btn-red"
                onClick={() => navigate(dashboardPath(user.role))}
              >
                <span className="btn-l" data-scramble>Dashboard ({roleConfig[user.role].label})</span>
                <span className="btn-a" aria-hidden="true"><i>→</i><i>→</i></span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-red"
                onClick={() => navigate('/login')}
              >
                <span className="btn-l" data-scramble>Launch App</span>
                <span className="btn-a" aria-hidden="true"><i>→</i><i>→</i></span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3D Traveling Phone Mockup */}
      <div className="phone" id="phone" aria-hidden="true">
        <div className="phone-in" id="phoneIn">
          <div className="phone-body">
            <div className="phone-scr">
              <canvas id="phoneCv"></canvas>
              <div className="phone-island"></div>
              <div className="ph-ui">
                <div className="ph-bars" id="phBars"><i><b></b></i><i><b></b></i><i><b></b></i></div>
                <div className="ph-top ph-swap" id="phTop">
                  <span className="ph-av"></span>
                  <span className="ph-handle" id="phHandle">brewforge_lab</span>
                  <span className="ph-time">18.5g · 93°C</span>
                </div>
                <div className="ph-swap" id="phBottom">
                  <p className="ph-cap" id="phCap">Signature cascara infusion. 18h slow steep. Nitrogen draft.</p>
                  <div className="ph-meta">
                    <span>★ <span id="phLikes">TDS 1.38%</span></span>
                    <span>↗ SOP Sync</span>
                    <span>☕ BrewForge</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="case-stats-layer" id="caseStatsLayer"></div>
      </div>

      <main>
        {/* Hero Section */}
        <section className="hero" id="top">
          <div className="hero-copy pad">
            <h1 className="h1 intro-split" data-words-split>
              Precision coffee / standard across every cup
            </h1>
            <p className="hero-lead intro-fade">
              The operations and training engine for specialty coffee chains. Dial in signature recipes, automate SOP standards, and certify barista teams at scale.
            </p>
            <div className="roles-bar intro-fade" style={{ marginTop: '20px' }}>
              <span className="mono" style={{ color: 'var(--mute)', fontSize: '10px' }}>Quick Demo:</span>
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className="role-pill"
                  onClick={() => handleQuickLogin(role)}
                  title={`Sign in as ${roleConfig[role].label}`}
                >
                  <span className="sq" style={{ width: '5px', height: '5px' }}></span>
                  {roleConfig[role].label}
                </button>
              ))}
            </div>
          </div>
          <div className="slot slot-hero" id="slotHero"></div>
          <div className="tags mono" aria-hidden="true">
            <span className="tag-p t1" data-depth="22" style={{ left: 'calc(57.5% - var(--pw)*.98)', top: 'calc(max(10.5vh,84px) + var(--ph)*.44)' }}>
              <span className="tag" style={{ '--k': 0 } as React.CSSProperties}>★ Specialty Coffee R&amp;D</span>
            </span>
            <span className="tag-p t2" data-depth="-16" style={{ left: 'calc(57.5% + var(--pw)*.36)', top: 'calc(max(10.5vh,84px) + var(--ph)*.5)' }}>
              <span className="tag" style={{ '--k': 1 } as React.CSSProperties}>Espresso Dialing SOP</span>
            </span>
            <span className="tag-p t3" data-depth="12" style={{ left: 'calc(57.5% - var(--pw)*.9)', top: 'calc(max(10.5vh,84px) + var(--ph)*.59)' }}>
              <span className="tag" style={{ '--k': 2 } as React.CSSProperties}>Barista Academy LMS</span>
            </span>
            <span className="tag-p t4" data-depth="-26" style={{ left: 'calc(57.5% + var(--pw)*.08)', top: 'calc(max(10.5vh,84px) + var(--ph)*.68)' }}>
              <span className="tag" style={{ '--k': 3 } as React.CSSProperties}>Multi-Branch Auditing</span>
            </span>
          </div>
          <div className="pad"><div className="wm wm-hero" id="wmHero" role="img" aria-label="BREWFORGE"></div></div>
        </section>

        {/* Statement Section */}
        <section className="statement pad" id="statement">
          <div className="slot slot-statement" id="slotStatement"></div>
          <div className="st-grid">
            <div className="st-col st-col-left">
              <p className="st-text st-left">
                Whether dialing in micro-lot geisha espressos, synchronizing 50 franchise stores, or training apprentice baristas,
              </p>
            </div>
            <div className="st-col st-col-mid" aria-hidden="true"></div>
            <div className="st-col st-col-right">
              <p className="st-text st-right">
                BrewForge standardizes every variable so every single cup tastes legendary.
              </p>
              <button
                type="button"
                className="btn btn-red"
                onClick={() => navigate('/login')}
              >
                <span className="btn-l" data-scramble>Enter Workspace</span>
                <span className="btn-a" aria-hidden="true"><i>→</i><i>→</i></span>
              </button>
            </div>
          </div>
        </section>

        {/* Interactive Cases Section with Traveling Phone */}
        <div className="seam">
          <section className="cases round-b" id="work" aria-label="BrewForge Standards & Case Studies">
            <div className="cases-pin">
              <div className="slot slot-case" id="slotCase"></div>
            </div>
            <div id="caseList"></div>
          </section>
        </div>

        {/* 3D Rotating Gallery Section */}
        <section className="gallery" id="gallery" aria-label="Beverage R&D Portfolio">
          <div className="gal-pin" id="galPin">
            <div className="gal-grid" id="galGrid"></div>
            <div className="gal-shade"></div>
            <a className="gal-link" href="#services" aria-label="Explore BrewForge Platform Capabilities"></a>
            <div className="gal-cursor" id="galCursor" aria-hidden="true"><span>Explore Beverage R&amp;D ↗</span></div>
          </div>
        </section>

        {/* Things We Love (Equipment Grid) & Services */}
        <div className="seam">
          <div className="slab round-t round-b">
            <section className="brands pad" aria-label="Equipment & Tools of the Craft">
              <p className="mono lab" data-r><i className="sq"></i>Tools of Precision Craft</p>
              <div className="brand-grid" id="brandGrid"></div>
            </section>

            <section className="services pad" id="services">
              <div className="sec-grid">
                <div><span className="vlabel mono"><i className="sq"></i>What We Do</span></div>
                <div>
                  <h2 className="h2" data-split>
                    Recipe R&amp;D, digital SOPs, barista academies and multi-store consistency
                  </h2>
                </div>
              </div>
              <div className="svc-list" id="svcList"></div>
            </section>

            {/* Showreel Section */}
            <section className="reel pad" aria-label="Highlights & Dialing Showreel">
              <div className="reel-card" id="reelCard" role="button" tabIndex={0} aria-label="Play or pause the BrewForge highlights showreel">
                <canvas id="reelCv"></canvas>
                <div className="reel-play" id="reelPlay"><span id="reelIcon">▶</span></div>
                <span className="reel-state mono" id="reelState">Highlights · BrewForge 2026</span>
                <div className="reel-badge"><b>BREW</b><small>FORGE<br />2026</small></div>
              </div>
            </section>
          </div>
        </div>

        {/* Pricing & Editions */}
        <div className="dark">
          <section className="pricing pad" id="pricing">
            <div className="sec-grid">
              <div><span className="vlabel mono"><i className="sq"></i>Editions</span></div>
              <div>
                <h2 className="h2" data-split>Engineered for any coffee footprint</h2>
                <p className="sub" data-r>
                  From single specialty lab roasteries to regional multi-branch franchise networks and global coffee chains.
                </p>
              </div>
            </div>
            <div className="price-row" id="priceRow"></div>
            <div className="custom" data-r>
              <div className="art" data-pal="forge" data-seed="11" data-zoom="1.3"></div>
              <div>
                <p className="mono" style={{ color: 'var(--mute-d)' }}>Deploying multiple branches?</p>
                <h3>Try the 7-role interactive simulation.</h3>
                <p>
                  Switch instantly between Administrator, R&amp;D Specialist, R&amp;D Manager, Trainer, Store Manager, Barista, and Quality Auditor to experience how BrewForge powers your entire operation.
                </p>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => navigate('/login')}
                  style={{ marginTop: '16px' }}
                >
                  <span className="btn-l" data-scramble>Open Demo Workspace</span>
                  <span className="btn-a" aria-hidden="true"><i>→</i><i>→</i></span>
                </button>
              </div>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="compare pad" aria-label="BrewForge vs Traditional Cafe Management">
            <p className="mono lab" data-r style={{ marginBottom: '22px', color: 'var(--mute-d)' }}>
              <i className="sq"></i>The BrewForge Difference
            </p>
            <div className="cmp-wrap">
              <table className="cmp" id="cmp">
                <thead>
                  <tr>
                    <th></th>
                    <th className="mono">Traditional Cafe Management</th>
                    <th><span className="cmp-logo">BREWFORGE</span></th>
                  </tr>
                </thead>
                <tbody id="cmpBody"></tbody>
              </table>
            </div>
          </section>

          {/* FAQ Accordion */}
          <section className="faq pad" id="faq">
            <div className="sec-grid">
              <div><span className="vlabel mono"><i className="sq"></i>Frequently Asked</span></div>
              <div>
                <h2 className="h2" data-split>Questions, answered</h2>
                <p className="sub" data-r>
                  SOP deployment, barista certifications, franchise consistency, and how to get started.
                </p>
                <div className="faq-list" id="faqList"></div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="after">
          <footer className="footer pad">
            <div className="wm wm-foot" id="wmFoot" role="img" aria-label="BREWFORGE"></div>
            <div className="foot-grid">
              <div className="news">
                <p className="mono">The Brew Dispatch</p>
                <p>Curated extraction science, SOP frameworks, and specialty beverage R&amp;D insights delivered monthly.</p>
                <form id="newsForm" noValidate>
                  <label className="mono" htmlFor="nEmail" style={{ position: 'absolute', left: '-9999px' }}>Email</label>
                  <input id="nEmail" type="email" placeholder="you@coffeechain.com" autoComplete="email" />
                  <button type="submit" aria-label="Subscribe">→</button>
                </form>
                <p className="news-msg" id="newsMsg" role="status"></p>
                <div className="readers">
                  <div className="avs">
                    <span className="art" data-pal="forge" data-seed="21" data-zoom="2"></span>
                    <span className="art" data-pal="espresso" data-seed="22" data-zoom="2"></span>
                    <span className="art" data-pal="crema" data-seed="23" data-zoom="2"></span>
                    <span className="art" data-pal="amber" data-seed="24" data-zoom="2"></span>
                  </div>
                  <span className="mono" style={{ color: 'var(--mute-d)' }}>Empowering 1,200+ Craft Baristas</span>
                </div>
              </div>
              <div>
                <p className="mono">Navigation</p>
                <nav className="flinks" aria-label="Footer">
                  <a href="#top">Overview</a>
                  <a href="#work">Standards &amp; SOPs</a>
                  <a href="#services">Platform</a>
                  <a href="#pricing">Editions</a>
                  <a href="#faq">FAQ</a>
                  <a href="/login">Launch Workspace ↗</a>
                </nav>
              </div>
              <div className="fcontact">
                <p className="mono">Workspace Access</p>
                <a className="big" href="/login">demo.brewforge.test</a>
                <address className="mono">
                  BrewForge Platform HQ<br />
                  Specialty Coffee Franchise Engine<br />
                  Precision Extraction Systems
                </address>
                <div className="socials" aria-label="Social">
                  <a href="#top" title="Specialty Coffee">☕</a>
                  <a href="#top" title="R&D Lab">🧪</a>
                  <a href="#top" title="Standards">📋</a>
                </div>
              </div>
            </div>
            <div className="foot-bar mono">
              <span>© 2026 BrewForge · Precision Coffee Chain &amp; Training Platform</span>
              <span>Crafted for Coffee Masters <span className="star">★</span></span>
              <a className="top" href="#top">Back to top ↑</a>
            </div>
          </footer>
        </div>
      </main>
      <div className="svc-prev" id="svcPrev" aria-hidden="true"></div>
    </>
  );
};

export default LandingPage;
