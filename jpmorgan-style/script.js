(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function markReady() {
    document.body.classList.add('page-ready');
  }

  function cleanIndexUrl() {
    if (!/\/index\.html$/i.test(window.location.pathname)) return;
    if (window.location.protocol === 'file:') return;

    const nextPath = window.location.pathname.replace(/index\.html$/i, '');
    window.history.replaceState(null, '', `${nextPath}${window.location.search}${window.location.hash}`);
  }

  function setupReveal() {
    const items = [
      ...document.querySelectorAll('.featured-intro-block, .featured-carousel, .home-hero .wrap, .section-head .wrap, .page-hero .wrap, .report-hero .wrap, .gallery-block .wrap, .about-photo, .about-copy > *, .profile-intro, .profile-stat, .progression-item, .profile-panel, .profile-credential-row, .profile-index-row, .report-card, .slide-card, .button-row'),
    ];

    items.forEach((item, index) => {
      item.classList.add('reveal');
      item.style.setProperty('--reveal-delay', `${Math.min(index % 8, 7) * 45}ms`);
    });

    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const isInView = (item) => {
      const rect = item.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08,
    });

    items.forEach((item) => {
      if (isInView(item)) {
        item.classList.add('is-visible');
        return;
      }
      observer.observe(item);
    });
  }

  function setupPageTransitions() {
    if (reducedMotion) return;

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target && link.target !== '_self') return;
      if (link.hasAttribute('download')) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.hash && url.pathname === window.location.pathname) return;
      if (/\.(pdf|png|jpe?g|gif|webp|svg|docx?|xlsx?|pptx?)$/i.test(url.pathname)) return;

      event.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(() => {
        window.location.href = url.href;
      }, 240);
    });
  }

  function setupCachedPageReplay() {
    if (reducedMotion) return;

    window.addEventListener('pagehide', () => {
      document.body.classList.add('page-cache-hold');
    });

    window.addEventListener('pageshow', (event) => {
      document.body.classList.remove('page-exit');

      if (!event.persisted && !document.body.classList.contains('page-cache-hold')) return;

      document.body.classList.remove('page-cache-hold', 'page-enter-replay');
      void document.body.offsetWidth;
      document.body.classList.add('page-enter-replay');
      window.clearTimeout(setupCachedPageReplay.replayTimer);
      setupCachedPageReplay.replayTimer = window.setTimeout(() => {
        document.body.classList.remove('page-enter-replay');
      }, 720);
    });
  }

  function setupLightbox() {
    const slideImages = [...document.querySelectorAll('.slide-card img')];
    if (!slideImages.length) return;

    let activeIndex = 0;
    let zoom = 1;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Slide image viewer');
    overlay.innerHTML = `
      <button class="lightbox-btn lightbox-close" type="button" aria-label="Close image viewer">Close</button>
      <button class="lightbox-btn lightbox-prev" type="button" aria-label="Previous image">Prev</button>
      <button class="lightbox-btn lightbox-next" type="button" aria-label="Next image">Next</button>
      <div class="lightbox-stage" tabindex="0">
        <img class="lightbox-image" alt="">
      </div>
      <div class="lightbox-tools" aria-label="Image zoom controls">
        <button class="lightbox-btn" type="button" data-zoom="out" aria-label="Zoom out">-</button>
        <span class="lightbox-count" aria-live="polite"></span>
        <button class="lightbox-btn" type="button" data-zoom="in" aria-label="Zoom in">+</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const stage = overlay.querySelector('.lightbox-stage');
    const image = overlay.querySelector('.lightbox-image');
    const count = overlay.querySelector('.lightbox-count');

    function updateImage() {
      const source = slideImages[activeIndex];
      image.src = source.currentSrc || source.src;
      image.alt = source.alt || `Slide ${activeIndex + 1}`;
      count.textContent = `${activeIndex + 1} / ${slideImages.length}`;
      setZoom(1);
      requestAnimationFrame(() => stage.focus({ preventScroll: true }));
    }

    function setZoom(nextZoom) {
      zoom = Math.max(1, Math.min(3, nextZoom));
      image.style.setProperty('--zoom', zoom.toFixed(2));
      stage.classList.toggle('is-zoomed', zoom > 1);
    }

    function open(index) {
      activeIndex = index;
      updateImage();
      overlay.classList.add('is-open');
      document.body.classList.add('lightbox-open');
    }

    function close() {
      overlay.classList.remove('is-open');
      document.body.classList.remove('lightbox-open');
      slideImages[activeIndex]?.focus?.({ preventScroll: true });
    }

    function move(direction) {
      activeIndex = (activeIndex + direction + slideImages.length) % slideImages.length;
      updateImage();
    }

    slideImages.forEach((img, index) => {
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `Open ${img.alt || `slide ${index + 1}`} larger`);
      img.addEventListener('click', () => open(index));
      img.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(index);
        }
      });
    });

    overlay.querySelector('.lightbox-close').addEventListener('click', close);
    overlay.querySelector('.lightbox-prev').addEventListener('click', () => move(-1));
    overlay.querySelector('.lightbox-next').addEventListener('click', () => move(1));
    overlay.querySelector('[data-zoom="in"]').addEventListener('click', () => setZoom(zoom + 0.35));
    overlay.querySelector('[data-zoom="out"]').addEventListener('click', () => setZoom(zoom - 0.35));

    image.addEventListener('click', () => setZoom(zoom === 1 ? 2 : 1));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });

    document.addEventListener('keydown', (event) => {
      if (!overlay.classList.contains('is-open')) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
      if (event.key === '+' || event.key === '=') setZoom(zoom + 0.35);
      if (event.key === '-' || event.key === '_') setZoom(zoom - 0.35);
    });
  }

  function setupReportFilters() {
    const tools = document.querySelector('[data-report-tools]');
    if (!tools) return;

    const search = tools.querySelector('[data-report-search]');
    const filterButtons = [...tools.querySelectorAll('[data-report-filter]')];
    const sort = tools.querySelector('[data-report-sort]');
    const count = tools.querySelector('[data-report-count]');
    const cards = [...document.querySelectorAll('[data-report-card]')];
    const sections = [...document.querySelectorAll('[data-report-section]')];
    const empty = document.querySelector('[data-report-empty]');
    let activeFilter = 'all';
    let hasAppliedFilters = false;

    function sortCards() {
      const mode = sort?.value || 'default';

      document.querySelectorAll('.report-index-list').forEach((grid) => {
        const gridCards = [...grid.querySelectorAll('[data-report-card]')];
        const sorted = gridCards.slice().sort((a, b) => {
          const aIndex = Number(a.dataset.index || 0);
          const bIndex = Number(b.dataset.index || 0);

          if (mode === 'az') {
            return (a.dataset.title || '').localeCompare(b.dataset.title || '', undefined, { sensitivity: 'base' });
          }

          if (mode === 'featured') {
            const featuredDelta = Number(b.dataset.featured === 'true') - Number(a.dataset.featured === 'true');
            if (featuredDelta !== 0) return featuredDelta;
          }

          return aIndex - bIndex;
        });

        sorted.forEach((card) => grid.appendChild(card));
      });
    }

    function matchesCard(card) {
      const query = (search?.value || '').trim().toLowerCase();
      const searchable = `${card.dataset.search || ''} ${card.dataset.title || ''} ${card.dataset.category || ''}`.toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesFilter = activeFilter === 'all'
        || (activeFilter === 'featured' && card.dataset.featured === 'true')
        || card.dataset.category === activeFilter;

      return matchesSearch && matchesFilter;
    }

    function updateFilterButtons() {
      filterButtons.forEach((button) => {
        const isActive = button.dataset.reportFilter === activeFilter;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    function restartFilterAnimation(elements) {
      if (reducedMotion) return;

      elements.forEach((element, index) => {
        element.classList.remove('filter-pop');
        element.style.setProperty('--filter-delay', `${Math.min(index, 8) * 58}ms`);
        void element.offsetWidth;
        element.classList.add('filter-pop');
      });
    }

    function applyFilters(animate = hasAppliedFilters) {
      sortCards();

      let visibleCount = 0;
      const visibleItems = [];
      cards.forEach((card) => {
        const isVisible = matchesCard(card);
        card.hidden = !isVisible;
        card.classList.toggle('is-filtered-out', !isVisible);
        if (isVisible) {
          visibleCount += 1;
          visibleItems.push(card);
        }
      });

      sections.forEach((section) => {
        const hasVisibleCards = [...section.querySelectorAll('[data-report-card]')].some((card) => !card.hidden);
        section.hidden = !hasVisibleCards;
        if (hasVisibleCards) {
          const heading = section.querySelector('.section-head');
          if (heading) visibleItems.unshift(heading);
        }
      });

      if (count) count.textContent = `${visibleCount} report${visibleCount === 1 ? '' : 's'}`;
      if (empty) empty.hidden = visibleCount !== 0;
      if (animate) restartFilterAnimation(visibleItems);
      hasAppliedFilters = true;
    }

    search?.addEventListener('input', () => applyFilters(true));
    sort?.addEventListener('change', () => applyFilters(true));
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.reportFilter || 'all';
        updateFilterButtons();
        applyFilters(true);
      });
    });

    updateFilterButtons();
    applyFilters(false);
  }

  function setupReportCardImageSizing() {
    const wrappers = [...document.querySelectorAll('.report-card-image-wrap')];
    if (!wrappers.length) return;

    const desktop = window.matchMedia('(min-width: 881px)');

    function fitWrapper(wrapper) {
      const media = wrapper.closest('.report-card-media');
      const image = wrapper.querySelector('img');
      if (!media || !image || !image.naturalWidth || !image.naturalHeight) return;

      if (!desktop.matches) {
        wrapper.style.removeProperty('width');
        wrapper.style.removeProperty('height');
        return;
      }

      const mediaWidth = media.clientWidth;
      const mediaHeight = media.clientHeight;
      if (!mediaWidth || !mediaHeight) return;

      const imageRatio = image.naturalWidth / image.naturalHeight;
      const mediaRatio = mediaWidth / mediaHeight;
      const width = mediaRatio > imageRatio ? mediaHeight * imageRatio : mediaWidth;
      const height = mediaRatio > imageRatio ? mediaHeight : mediaWidth / imageRatio;

      wrapper.style.width = `${Math.round(width)}px`;
      wrapper.style.height = `${Math.round(height)}px`;
    }

    function fitAll() {
      wrappers.forEach(fitWrapper);
    }

    wrappers.forEach((wrapper) => {
      const image = wrapper.querySelector('img');
      if (!image) return;
      if (image.complete) {
        fitWrapper(wrapper);
      } else {
        image.addEventListener('load', () => fitWrapper(wrapper), { once: true });
      }
    });

    let frame = 0;
    window.addEventListener('resize', () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fitAll);
    }, { passive: true });
  }

  function setupFeaturedCarousel() {
    const carousel = document.querySelector('[data-featured-carousel]');
    if (!carousel) return;

    const slides = [...carousel.querySelectorAll('[data-featured-slide]')];
    const dots = [...carousel.querySelectorAll('[data-featured-dot]')];
    const previous = carousel.querySelector('[data-featured-prev]');
    const next = carousel.querySelector('[data-featured-next]');
    const status = carousel.querySelector('[data-featured-status]');
    if (!slides.length) return;

    let activeIndex = 0;

    function setActive(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
      const activeSlide = slides[activeIndex];
      ['--featured-accent', '--featured-tint', '--featured-soft'].forEach((property) => {
        const value = activeSlide.style.getPropertyValue(property);
        if (value) carousel.style.setProperty(property, value);
      });
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      if (status) status.textContent = `${activeIndex + 1} / ${slides.length}`;
    }

    previous?.addEventListener('click', () => setActive(activeIndex - 1));
    next?.addEventListener('click', () => setActive(activeIndex + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => setActive(index)));

    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') setActive(activeIndex - 1);
      if (event.key === 'ArrowRight') setActive(activeIndex + 1);
    });

    setActive(0);
  }

  function setupMobileMenu() {
    const toggle = document.querySelector('[data-mobile-menu-toggle]');
    const panel = document.querySelector('[data-mobile-menu-panel]');
    if (!toggle || !panel) return;

    function isOpen() {
      return panel.classList.contains('is-open');
    }

    function setOpen(open) {
      panel.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', open);
    }

    toggle.addEventListener('click', () => {
      setOpen(!isOpen());
    });

    panel.addEventListener('click', (event) => {
      if (event.target.closest('a[href]')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus({ preventScroll: true });
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1120) setOpen(false);
    }, { passive: true });
  }

  function setupMobileSubmenus() {
    const panel = document.querySelector('[data-mobile-menu-panel]');
    if (!panel) return;

    const media = window.matchMedia('(max-width: 1120px)');
    const detailsItems = [...panel.querySelectorAll('details')];

    function resetMenu(menu) {
      menu.style.height = '';
      menu.style.opacity = '';
      menu.style.transform = '';
    }

    detailsItems.forEach((details) => {
      const summary = details.querySelector('summary');
      const menu = details.querySelector('.nav-menu');
      if (!summary || !menu) return;

      summary.addEventListener('click', (event) => {
        if (!media.matches || reducedMotion) return;
        event.preventDefault();
        if (details.classList.contains('is-submenu-animating')) return;

        const isOpening = !details.open;
        details.classList.add('is-submenu-animating');

        if (isOpening) {
          details.open = true;
          menu.style.height = '0px';
          menu.style.opacity = '0';
          menu.style.transform = 'translateY(-8px) scaleY(0.98)';

          requestAnimationFrame(() => {
            menu.style.height = `${menu.scrollHeight}px`;
            menu.style.opacity = '1';
            menu.style.transform = 'translateY(0) scaleY(1)';
          });
        } else {
          menu.style.height = `${menu.scrollHeight}px`;
          menu.style.opacity = '1';
          menu.style.transform = 'translateY(0) scaleY(1)';

          requestAnimationFrame(() => {
            menu.style.height = '0px';
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-6px) scaleY(0.98)';
          });
        }

        window.setTimeout(() => {
          if (!isOpening) details.open = false;
          details.classList.remove('is-submenu-animating');
          resetMenu(menu);
        }, 360);
      });
    });

    window.addEventListener('resize', () => {
      if (!media.matches) {
        detailsItems.forEach((details) => {
          details.classList.remove('is-submenu-animating');
          const menu = details.querySelector('.nav-menu');
          if (menu) resetMenu(menu);
        });
      }
    }, { passive: true });
  }

  function setupReportSearchToggle() {
    const tools = document.querySelector('[data-report-tools]');
    if (!tools) return;

    const toggles = [
      ...document.querySelectorAll('[data-mobile-search-toggle]'),
      ...tools.querySelectorAll('[data-report-search-toggle]'),
    ];
    const input = tools.querySelector('[data-report-search]');
    if (!toggles.length || !input) return;

    function setOpen(open) {
      tools.classList.toggle('is-search-open', open);
      toggles.forEach((toggle) => {
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      if (open) {
        if (window.matchMedia('(max-width: 1120px)').matches) {
          tools.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        }
        requestAnimationFrame(() => input.focus({ preventScroll: false }));
      }
    }

    toggles.forEach((toggle) => {
      toggle.addEventListener('click', () => {
        setOpen(!tools.classList.contains('is-search-open'));
      });
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggles[0]?.focus({ preventScroll: true });
      }
    });
  }

  function setupHeaderState() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const update = () => {
      document.body.classList.toggle('has-scrolled', window.scrollY > 12);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function setupThemeToggle() {
    const toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;

    const text = toggle.querySelector('.theme-toggle-text');

    const currentTheme = () => document.documentElement.dataset.theme || 'light';
    const setTheme = (theme, animate = false) => {
      if (animate && !reducedMotion) {
        document.documentElement.classList.add('theme-transition');
        window.clearTimeout(setTheme.transitionTimer);
        setTheme.transitionTimer = window.setTimeout(() => {
          document.documentElement.classList.remove('theme-transition');
        }, 680);
      }
      document.documentElement.dataset.theme = theme;
      toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      if (text) text.textContent = theme === 'dark' ? 'Light' : 'Dark';
      try {
        localStorage.setItem('portfolio-theme', theme);
      } catch {}
    };

    setTheme(currentTheme());
    toggle.addEventListener('click', () => {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    cleanIndexUrl();
    markReady();
    setupHeaderState();
    setupThemeToggle();
    setupMobileMenu();
    setupMobileSubmenus();
    setupReveal();
    setupFeaturedCarousel();
    setupReportFilters();
    setupReportCardImageSizing();
    setupReportSearchToggle();
    setupPageTransitions();
    setupCachedPageReplay();
    setupLightbox();
  });
})();
