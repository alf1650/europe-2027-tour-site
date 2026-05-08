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

  // ── Lightbox with Flipboard-style page turn ────────────
  let currentIndex = 0;
  let isAnimating = false;

  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.innerHTML = `
    <button id="lightboxClose" aria-label="Close">×</button>
    <div id="lbStage">
      <button id="lightboxPrev" aria-label="Previous">&#8592;</button>
      <div id="lbScene">
        <div id="lbCardA" class="lb-card"><img class="lb-img" src="" alt="" /></div>
        <div id="lbCardB" class="lb-card"><img class="lb-img" src="" alt="" /></div>
      </div>
      <button id="lightboxNext" aria-label="Next">&#8594;</button>
    </div>
    <div id="lbMeta">
      <p id="lightboxCaption"></p>
      <p id="lightboxCounter"></p>
    </div>
  `;
  document.body.appendChild(lb);

  // Which card is currently on top
  let activeCard = 'A';

  function getCard(id) { return document.getElementById('lbCard' + id); }
  function otherCard(id) { return id === 'A' ? 'B' : 'A'; }

  function setMeta(index) {
    const img = gallerySequence[index];
    document.getElementById('lightboxCaption').textContent = img.attribution || '';
    document.getElementById('lightboxCounter').textContent = `${index + 1} / ${gallerySequence.length}`;
    document.getElementById('lightboxPrev').style.opacity = index === 0 ? '0.2' : '1';
    document.getElementById('lightboxNext').style.opacity = index === gallerySequence.length - 1 ? '0.2' : '1';
  }

  function openLightbox(index) {
    currentIndex = index;
    activeCard = 'A';
    const cardA = getCard('A');
    const cardB = getCard('B');
    // Reset both cards
    cardA.className = 'lb-card lb-front';
    cardB.className = 'lb-card lb-back-right';
    cardA.querySelector('img').src = gallerySequence[index].imagePath;
    cardB.querySelector('img').src = '';
    setMeta(index);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function navigate(dir) {
    if (isAnimating) return;
    const next = currentIndex + dir;
    if (next < 0 || next >= gallerySequence.length) return;
    isAnimating = true;

    const incoming = otherCard(activeCard);
    const outgoing = activeCard;
    const cardIn  = getCard(incoming);
    const cardOut = getCard(outgoing);

    // Pre-load incoming image off-screen
    cardIn.querySelector('img').src = gallerySequence[next].imagePath;

    if (dir > 0) {
      // Going NEXT: outgoing flips away left, incoming flips in from right
      cardIn.className  = 'lb-card lb-hidden-right';
      void cardIn.offsetWidth;
      cardOut.className = 'lb-card lb-flip-out-left';
      setTimeout(() => {
        cardIn.className = 'lb-card lb-flip-in-right';
      }, 80);
    } else {
      // Going PREV: outgoing flips away right, incoming flips in from left
      cardIn.className  = 'lb-card lb-hidden-left';
      void cardIn.offsetWidth;
      cardOut.className = 'lb-card lb-flip-out-right';
      setTimeout(() => {
        cardIn.className = 'lb-card lb-flip-in-left';
      }, 80);
    }

    currentIndex = next;
    activeCard = incoming;
    setMeta(currentIndex);

    setTimeout(() => {
      // Settle: make incoming the stable front
      cardIn.className  = 'lb-card lb-front';
      cardOut.className = 'lb-card lb-back-right';
      isAnimating = false;
    }, 420);
  }

  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    isAnimating = false;
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

  // Touch swipe
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
