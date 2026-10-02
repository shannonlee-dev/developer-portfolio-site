import { siteConfig } from '../config.js';
import { elements } from '../dom.js';
import { state } from '../state.js';

export function observeSections() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: siteConfig.observerThreshold },
  );

  elements.revealTargets.forEach((target) => observer.observe(target));
}

export function runTypingEffect() {
  const text = 'Shannon Lee';
  let index = 0;

  elements.typingText.textContent = '';

  const typing = window.setInterval(() => {
    elements.typingText.textContent = text.slice(0, index + 1);
    index += 1;

    if (index >= text.length) {
      window.clearInterval(typing);
    }
  }, 110);
}
