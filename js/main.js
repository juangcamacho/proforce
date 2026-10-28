/* =========================================================
   PROFORCE Treinamentos — interações
   ========================================================= */
(function () {
  'use strict';

  const WHATSAPP = '5511982980140';
  const EMAIL = 'proforcetreinamentos@gmail.com';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Trava de rolagem compartilhada (menu, modal, lightbox) ----- */
  const locks = new Set();
  const lockScroll = (key, on) => {
    on ? locks.add(key) : locks.delete(key);
    document.body.style.overflow = locks.size ? 'hidden' : '';
  };

  /* ----- Mantém o foco dentro de um diálogo aberto ----- */
  const trapFocus = (container, e) => {
    if (e.key !== 'Tab') return;
    const focusable = $$('a[href], button:not([disabled]), input, select, textarea, video[controls]', container)
      .filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  /* ----- Ano no rodapé ----- */
  $('#year').textContent = new Date().getFullYear();

  /* ----- Header ao rolar ----- */
  const header = $('.header');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----- Menu mobile ----- */
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const mobileQuery = window.matchMedia('(max-width: 960px)');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    lockScroll('menu', open);
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  // Fecha o menu se a tela crescer para o layout desktop com ele aberto
  mobileQuery.addEventListener('change', (e) => { if (!e.matches) setMenu(false); });

  /* ----- Link ativo conforme seção ----- */
  const links = $$('.nav__link');
  const sections = links.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  /* ----- Animações de entrada ----- */
  // Ao terminar, remove .reveal para não interferir nas transições de hover
  const finishReveal = (el) => {
    el.classList.remove('reveal', 'is-visible');
    el.style.removeProperty('--reveal-delay');
  };
  const revealer = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      obs.unobserve(el);
      el.classList.add('is-visible');
      const done = (ev) => {
        if (ev && ev.target !== el) return;
        el.removeEventListener('transitionend', done);
        finishReveal(el);
      };
      el.addEventListener('transitionend', done);
      setTimeout(done, 1200); // garantia caso transitionend não dispare
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach((el, i) => {
    if (reducedMotion) return finishReveal(el);
    el.style.setProperty('--reveal-delay', (i % 4) * 80 + 'ms');
    revealer.observe(el);
  });

  /* ----- Contadores ----- */
  const counter = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = Number(el.dataset.count);
      obs.unobserve(el);
      if (reducedMotion) { el.textContent = target; return; }
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => counter.observe(el));

  /* ----- Modal de cursos ----- */
  const modal = $('#courseModal');
  const courseSelect = $('#contactForm select[name="curso"]');
  let modalOpener = null;
  let selectedOption = '';

  const openModal = (card, opener) => {
    selectedOption = card.dataset.course;
    $('#modalTag').textContent = $('.course__tag', card).textContent;
    $('#modalTitle').textContent = $('.course__title', card).textContent.trim();
    $('#modalMeta').innerHTML = $('.course__meta', card).outerHTML;
    $('#modalContent').innerHTML = $('.course__content', card).innerHTML;
    modalOpener = opener;
    modal.hidden = false;
    lockScroll('modal', true);
    $('.modal__close', modal).focus();
  };
  const closeModal = (restoreFocus = true) => {
    modal.hidden = true;
    lockScroll('modal', false);
    if (restoreFocus && modalOpener) modalOpener.focus({ preventScroll: true });
  };

  $$('[data-course]').forEach((card) => {
    const btn = $('.course__btn', card);
    btn.addEventListener('click', () => openModal(card, btn));
  });
  $$('[data-close]', modal).forEach((el) => el.addEventListener('click', () => closeModal()));
  modal.addEventListener('keydown', (e) => trapFocus($('.modal__box', modal), e));

  // "Solicitar proposta deste curso": pré-seleciona o curso e leva ao formulário
  $('[data-pick-course]', modal).addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(false);
    if (Array.from(courseSelect.options).some((o) => o.value === selectedOption)) {
      courseSelect.value = selectedOption;
    }
    $('#contato').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    courseSelect.focus({ preventScroll: true });
  });

  /* ----- Galeria: filtros ----- */
  const items = $$('.gallery__item');
  const filters = $$('.filter');
  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      filters.forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      const f = btn.dataset.filter;
      items.forEach((it) => it.classList.toggle('is-hidden', f !== 'all' && it.dataset.cat !== f));
    });
  });

  /* ----- Galeria: lightbox ----- */
  const lb = $('#lightbox');
  const lbImg = $('#lightboxImg');
  const lbCap = $('#lightboxCaption');
  let lbOpener = null;
  let lbList = [];
  let current = 0;

  const preload = (idx) => {
    const it = lbList[(idx + lbList.length) % lbList.length];
    if (it) new Image().src = it.getAttribute('href');
  };
  const show = (idx) => {
    current = (idx + lbList.length) % lbList.length;
    const it = lbList[current];
    const alt = $('img', it).alt;
    lbImg.src = it.getAttribute('href');
    lbImg.alt = alt;
    lbCap.textContent = `${alt} (${current + 1}/${lbList.length})`;
    preload(current + 1);
    preload(current - 1);
  };
  const openLb = (it) => {
    lbList = items.filter((i) => !i.classList.contains('is-hidden'));
    lbOpener = it;
    lb.hidden = false;
    lockScroll('lightbox', true);
    show(lbList.indexOf(it));
    $('.lightbox__close', lb).focus();
  };
  const closeLb = () => {
    lb.hidden = true;
    lbImg.removeAttribute('src');
    lockScroll('lightbox', false);
    if (lbOpener) lbOpener.focus({ preventScroll: true });
  };

  items.forEach((it) => it.addEventListener('click', (e) => { e.preventDefault(); openLb(it); }));
  lb.addEventListener('click', (e) => {
    const action = e.target.dataset.lb;
    if (action === 'close' || e.target === lb) closeLb();
    else if (action === 'prev') show(current - 1);
    else if (action === 'next') show(current + 1);
  });
  lb.addEventListener('keydown', (e) => trapFocus(lb, e));

  // Swipe no celular
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ----- Teclado (Esc / setas) ----- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!lb.hidden) closeLb();
      else if (!modal.hidden) closeModal();
      else if (nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
      return;
    }
    if (!lb.hidden && e.key === 'ArrowLeft') show(current - 1);
    if (!lb.hidden && e.key === 'ArrowRight') show(current + 1);
  });

  /* ----- Vídeos: tocar um pausa os outros ----- */
  const videos = $$('video');
  videos.forEach((v) => v.addEventListener('play', () => videos.forEach((o) => { if (o !== v) o.pause(); })));

  /* ----- Formulário de contato (WhatsApp ou e-mail, sem backend) ----- */
  const form = $('#contactForm');
  const errorBox = $('#formError');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const required = $$('[required]', form);
    const invalid = required.filter((f) => !f.value.trim());
    required.forEach((f) => f.closest('.field').classList.toggle('is-invalid', invalid.includes(f)));
    errorBox.hidden = !invalid.length;
    if (invalid.length) { invalid[0].focus(); return; }

    const d = Object.fromEntries(new FormData(form).entries());
    const message = [
      'Olá, PROFORCE! Gostaria de solicitar uma proposta de treinamento.',
      '',
      `Nome: ${d.nome.trim()}`,
      `Empresa: ${d.empresa.trim()}`,
      `Telefone: ${d.telefone.trim()}`,
      d.email && `E-mail: ${d.email.trim()}`,
      `Treinamento: ${d.curso}`,
      d.qtd && `Nº de colaboradores: ${d.qtd}`,
      d.mensagem.trim() && `\nMensagem: ${d.mensagem.trim()}`,
    ].filter(Boolean).join('\n');

    // Enter no formulário (sem submitter) segue pelo WhatsApp
    const channel = (e.submitter && e.submitter.dataset.channel) || 'whatsapp';
    if (channel === 'email') {
      const subject = `Solicitação de proposta - ${d.curso} - ${d.empresa.trim()}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    } else {
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    }
  });
  $$('[required]', form).forEach((f) => {
    const clear = () => f.closest('.field').classList.remove('is-invalid');
    f.addEventListener('input', clear);
    f.addEventListener('change', clear);
  });
})();
