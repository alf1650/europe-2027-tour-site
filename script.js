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
  // Flat list of all gallery images in display order, for lightbox navigation
  const gallerySequence = [];

  function buildGallery(containerId, city) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const imgs = allImages.filter(img => img.city === city);
    if (!imgs.length) {
      container.innerHTML = '<p style="padding:2rem;color:rgba(240,236,228,0.3);text-align:center;font-size:0.85rem;letter-spacing:0.1em">No photos loaded — run the downloader script.</p>';
      return;
    }
    imgs.forEach(img => {
      const index = gallerySequence.length;
      gallerySequence.push(img);
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
      card.addEventListener('click', () => openLightbox(index));
      container.appendChild(card);
    });
  }

  buildGallery('brusselsGallery', 'Brussels');
  buildGallery('sloveniaGallery', 'Slovenia');
  buildGallery('londonGallery', 'London');

  // ── Lightbox with prev/next ────────────────────────────
  let currentIndex = 0;

  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.innerHTML = `
    <button id="lightboxClose" aria-label="Close">×</button>
    <button id="lightboxPrev" aria-label="Previous">&#8592;</button>
    <div id="lightboxImgWrap">
      <img id="lightboxImg" src="" alt="" />
    </div>
    <button id="lightboxNext" aria-label="Next">&#8594;</button>
    <p id="lightboxCaption"></p>
    <p id="lightboxCounter"></p>
  `;
  document.body.appendChild(lb);

  function showImage(index) {
    const img = gallerySequence[index];
    const el = document.getElementById('lightboxImg');
    el.classList.remove('lb-slide-in-left', 'lb-slide-in-right');
    void el.offsetWidth; // reflow to restart animation
    el.src = img.imagePath;
    el.alt = img.title || '';
    document.getElementById('lightboxCaption').textContent = img.attribution || '';
    document.getElementById('lightboxCounter').textContent = `${index + 1} / ${gallerySequence.length}`;
    document.getElementById('lightboxPrev').style.opacity = index === 0 ? '0.25' : '1';
    document.getElementById('lightboxNext').style.opacity = index === gallerySequence.length - 1 ? '0.25' : '1';
  }

  function openLightbox(index) {
    currentIndex = index;
    showImage(currentIndex);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function navigate(dir) {
    const next = currentIndex + dir;
    if (next < 0 || next >= gallerySequence.length) return;
    const el = document.getElementById('lightboxImg');
    el.classList.add(dir > 0 ? 'lb-slide-in-right' : 'lb-slide-in-left');
    currentIndex = next;
    showImage(currentIndex);
  }

  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', e => { e.stopPropagation(); navigate(-1); });
  document.getElementById('lightboxNext').addEventListener('click', e => { e.stopPropagation(); navigate(1); });
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  // Touch swipe support
  let touchStartX = 0;
  lb.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
  }, { passive: true });

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
