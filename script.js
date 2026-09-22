// Smooth scroll for the in-page nav links (Contact / Projects / Education).
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ---------------------------------------------------------
// Custom analytics events (Vercel Web Analytics is already
// loaded via window.va — this just tracks the interactions
// that actually matter for a portfolio: did the visitor try
// to make contact, and in which language did they read it.
// ---------------------------------------------------------
function track(name, data) {
  if (typeof window.va === 'function') {
    window.va('event', data ? { name, data } : { name });
  }
}

var emailLink = document.querySelector('a[href^="mailto:"]');
if (emailLink) emailLink.addEventListener('click', () => track('contact_email_click'));

var phoneLink = document.querySelector('a[href^="tel:"]');
if (phoneLink) phoneLink.addEventListener('click', () => track('contact_phone_click'));

document.querySelectorAll('.lang-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    track('language_switch', { lang: btn.getAttribute('data-lang') });
  });
});
