(async function () {
  // ── Load gallery manifest ──────────────────────────────
  let allImages = [];
  try {
    const res = await fetch('data/local_gallery.json');
    const data = await res.json();
    allImages = data.images || [];
  } catch (e) {
    console.warn('Could not load local_gallery.json', e);
  }

  // ── Hero background ────────────────────────────────────
  const heroImages = allImages.filter(img =>
    img.city === 'Slovenia' || img.city === 'Brussels'
  );
  if (heroImages.length) {
    const pick = heroImages[Math.floor(Math.random() * heroImages.length)];
    const heroBg = document.getElementById('heroBg');
    heroBg.style.backgroundImage = `url('${pick.imagePath}')`;
    setTimeout(() => heroBg.classList.add('loaded'), 100);
  }

  // ── Sticky nav ─────────────────────────────────────────
  const nav = document.querySelector('.hero-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });

  // ── Build galleries ────────────────────────────────────
  function buildGallery(containerId, city) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const imgs = allImages.filter(img => img.city === city);
    if (!imgs.length) {
      container.innerHTML = '<p style="padding:2rem;color:rgba(240,236,228,0.3);text-align:center;font-size:0.85rem;letter-spacing:0.1em">No photos loaded — run the downloader script.</p>';
      return;
    }
    imgs.forEach(img => {
      const card = document.createElement('div');
      card.className = 'gcard';
      const el = document.createElement('img');
      el.src = img.imagePath;
      el.alt = img.title || city;
      el.loading = 'lazy';
      const cap = document.createElement('div');
      cap.className = 'gcard-caption';
      cap.textContent = img.attribution || `Photo by ${img.artist || 'Unsplash'}`;
      card.appendChild(el);
      card.appendChild(cap);
      card.addEventListener('click', () => openLightbox(img));
      container.appendChild(card);
    });
  }

  buildGallery('brusselsGallery', 'Brussels');
  buildGallery('sloveniaGallery', 'Slovenia');
  buildGallery('londonGallery', 'London');

  // ── Lightbox ───────────────────────────────────────────
  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.innerHTML = `
    <button id="lightboxClose" aria-label="Close">×</button>
    <img id="lightboxImg" src="" alt="" />
    <p id="lightboxCaption"></p>
  `;
  document.body.appendChild(lb);

  function openLightbox(img) {
    document.getElementById('lightboxImg').src = img.imagePath;
    document.getElementById('lightboxImg').alt = img.title || '';
    document.getElementById('lightboxCaption').textContent = img.attribution || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  // ── Flight Timeline ────────────────────────────────────
  let legs = [];
  try {
    const res = await fetch('data/itinerary.json');
    const data = await res.json();
    legs = data.legs || [];
  } catch (e) {
    console.warn('Could not load itinerary.json', e);
  }

  const timeline = document.getElementById('timeline');
  legs.forEach(leg => {
    const item = document.createElement('div');
    item.className = `tl-item type-${leg.type}`;
    const airports = leg.from && leg.to
      ? `<div class="tl-airports">
           <span class="iata">${leg.from}</span>
           <span class="arrow">→</span>
           <span class="iata">${leg.to}</span>
         </div>`
      : '';
    item.innerHTML = `
      <p class="tl-date">${leg.date} · ${leg.day}</p>
      <p class="tl-title">${leg.title}</p>
      <p class="tl-detail">${leg.detail}</p>
      ${airports}
    `;
    timeline.appendChild(item);
  });
})();
