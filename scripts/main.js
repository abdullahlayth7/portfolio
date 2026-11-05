// Navigation and chapter state
const rail = document.querySelector('.page-rail');
const hero = document.querySelector('#signal');
const links = Array.from(document.querySelectorAll('.rail-links a'));
const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const menu = document.querySelector('.mobile-menu');
const current = document.querySelector('.mobile-current');
const textSelector = '.section-kicker, h2, h3, .about-name, .about-role';
const textNodeFilter = NodeFilter.SHOW_TEXT;
const revealThreshold = 0.88;
const activeThreshold = 0.45;
const particleCanvases = Array.from(document.querySelectorAll('.ambient-particles'));

const setActiveSection = (section) => {
  const active = links.find((link) => link.getAttribute('href') === `#${section.id}`);
  if (!active) return;

  links.forEach((link) => {
    const isActive = link === active;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  current.textContent = `${active.querySelector('b').textContent} / ${active.querySelector('span').textContent}`;
};

// Split display text only once, preserving an accessible label on the source element.
const animateText = (section) => {
  const targets = section.querySelectorAll(textSelector);

  targets.forEach((target, targetIndex) => {
    if (target.dataset.animated === 'true') return;

    target.dataset.animated = 'true';
    target.setAttribute('aria-label', target.textContent.trim());

    const walker = document.createTreeWalker(target, textNodeFilter);
    const nodes = [];
    let node = walker.nextNode();
    while (node) {
      nodes.push(node);
      node = walker.nextNode();
    }

    let letterIndex = 0;
    nodes.forEach((textNode) => {
      const fragment = document.createDocumentFragment();
      let word = null;

      const appendWord = () => {
        if (word) fragment.appendChild(word);
        word = null;
      };

      textNode.nodeValue.split('').forEach((character) => {
        if (/\s/.test(character)) {
          appendWord();
          fragment.appendChild(document.createTextNode(character));
          return;
        }

        if (!word) {
          word = document.createElement('span');
          word.className = 'text-word';
        }
        const letter = document.createElement('span');
        letter.className = 'text-letter';
        letter.setAttribute('aria-hidden', 'true');
        letter.textContent = character;
        letter.style.animationDelay = `${Math.min(80 + (letterIndex * 18), 780) + (targetIndex * 70)}ms`;
        word.appendChild(letter);
        letterIndex += 1;
      });
      appendWord();
      textNode.parentNode.replaceChild(fragment, textNode);
    });
  });
};

const revealSection = (section) => {
  if (!section || section === hero || section.dataset.revealed === 'true') return;

  section.dataset.revealed = 'true';
  section.classList.add('chapter-enter');
  animateText(section);
};

const updatePage = () => {
  const marker = window.innerHeight * activeThreshold;
  let activeSection = hero;

  sections.forEach((section) => {
    const bounds = section.getBoundingClientRect();
    if (bounds.top <= marker) activeSection = section;
    if (section !== hero && bounds.top < window.innerHeight * revealThreshold && bounds.bottom > 0) revealSection(section);
  });

  setActiveSection(activeSection);
  rail.classList.toggle('is-visible', window.scrollY > hero.offsetHeight * 0.72);
};

const closeMenu = (returnFocus) => {
  rail.classList.remove('is-menu-open');
  menu.setAttribute('aria-expanded', 'false');
  menu.querySelector('span').textContent = '+';
  if (returnFocus) menu.focus();
};

const openMenu = () => {
  rail.classList.add('is-menu-open');
  menu.setAttribute('aria-expanded', 'true');
  menu.querySelector('span').textContent = '×';
  if (links[0]) requestAnimationFrame(() => links[0].focus());
};

window.addEventListener('scroll', updatePage, { passive:true });
window.addEventListener('resize', updatePage);
updatePage();

// Optional ambient canvas: enabled only on larger screens that allow motion.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reducedMotion && particleCanvases.length) {
  const particleSystems = particleCanvases.map((canvas) => {
    const context = canvas.getContext('2d');
    return { canvas, context, kind: canvas.parentElement.id, particles: [], targets: [], lastFrame: 0 };
  });

  const pointIn = (rect, canvasRect, x, y) => ({
    x: rect.left - canvasRect.left + rect.width * x,
    y: rect.top - canvasRect.top + rect.height * y,
  });

  const buildTargets = (system, canvasRect) => {
    const host = system.canvas.parentElement;

    if (system.kind === 'signal') {
      return Array.from({ length: 14 }, (_, index) => ({
        x: canvasRect.width * (.54 + (index % 7) * .06),
        y: canvasRect.height * (.2 + Math.floor(index / 7) * .53 + Math.sin(index * 1.7) * .06),
      }));
    }

    return Array.from(host.querySelectorAll('.contact-icons a')).flatMap((icon) => {
      const rect = icon.getBoundingClientRect();
      return [[.5, .5], [.16, .5], [.84, .5], [.5, .16], [.5, .84]].map(([x, y]) => pointIn(rect, canvasRect, x, y));
    });
  };

  const resizeParticles = (system) => {
    const rect = system.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    system.canvas.width = Math.round(rect.width * ratio);
    system.canvas.height = Math.round(rect.height * ratio);
    system.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    system.targets = buildTargets(system, rect);
    const isCompact = window.matchMedia('(max-width: 760px)').matches;
    const count = isCompact ? Math.min(10, Math.max(8, system.targets.length)) : Math.min(24, Math.max(15, system.targets.length));
    system.particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      targetIndex: index % system.targets.length,
      phase: Math.random() * Math.PI * 2,
      size: Math.random() * 1.4 + 0.6,
    }));
  };

  const drawParticles = (system, timestamp) => {
    const rect = system.canvas.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight || timestamp - system.lastFrame < 33) return;
    system.lastFrame = timestamp;
    const { context, particles, targets } = system;
    context.clearRect(0, 0, rect.width, rect.height);

    particles.forEach((particle) => {
      const target = targets[particle.targetIndex];
      const orbit = system.kind === 'contact' ? 9 : system.kind === 'signal' ? 3.5 : 1.2;
      const targetX = target.x + Math.cos(timestamp * 0.0002 + particle.phase) * orbit;
      const targetY = target.y + Math.sin(timestamp * 0.0002 + particle.phase) * orbit;
      particle.x += (targetX - particle.x) * 0.035;
      particle.y += (targetY - particle.y) * 0.035;
      context.beginPath();
      context.fillStyle = 'rgba(151, 154, 158, 0.7)';
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });
  };

  particleSystems.forEach(resizeParticles);
  window.addEventListener('resize', () => particleSystems.forEach(resizeParticles));

  const animateParticles = (timestamp) => {
    particleSystems.forEach((system) => drawParticles(system, timestamp));
    window.requestAnimationFrame(animateParticles);
  };
  window.requestAnimationFrame(animateParticles);
}

menu.addEventListener('click', () => {
  if (rail.classList.contains('is-menu-open')) closeMenu(false);
  else openMenu();
});

links.forEach((link) => link.addEventListener('click', () => closeMenu(false)));

document.addEventListener('keydown', (event) => {
  if (!rail.classList.contains('is-menu-open')) return;

  if (event.key === 'Escape') {
    closeMenu(true);
    return;
  }

  if (event.key !== 'Tab') return;
  const menuItems = [menu].concat(links);
  const index = menuItems.indexOf(document.activeElement);

  if (event.shiftKey && (index <= 0 || index === -1)) {
    event.preventDefault();
    links[links.length - 1].focus();
  } else if (!event.shiftKey && index === menuItems.length - 1) {
    event.preventDefault();
    menu.focus();
  }
});
