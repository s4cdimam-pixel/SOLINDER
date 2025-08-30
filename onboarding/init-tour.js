
document.addEventListener('DOMContentLoaded', () => {
  if (window.__tourInitRan) return;
  window.__tourInitRan = true;

  const steps = [
    // {
    //   target: '#card-stack',
    //   title: 'Profile Card',
    //   content: 'Swipe the card to interact: <br><b>← left</b> — NOPE, <b>→ right</b> — LIKE, <b>↑ up</b> — opens <b>How to Buy</b>.<br><br><i>You can try it now.</i>',
    //   placement: 'bottom',
    //   padding: 16
    // },
    {
      target: '#card-stack',
      title: 'Swipe Left — NOPE',
      content: 'Move the card to the left to skip a profile.',
      placement: 'bottom',
      padding: 16
    },
    {
      target: '#card-stack',
      title: 'Swipe Right — LIKE',
      content: 'Move the card to the right to like a profile.',
      placement: 'bottom',
      padding: 16
    },
    {
      target: '#card-stack',
      title: 'Swipe Up — How to Buy',
      content: 'Move the card up to open the <b>How to Buy</b>',
      placement: 'bottom',
      padding: 16
    },
    { target: '#btn-rewind',    title: 'Tokenomics', content: 'The first button opens <b>Tokenomics</b>', placement: 'top' },
    // { target: '#btn-nope',      title: 'NOPE',      content: 'The second button quickly skips the current profile.',  placement: 'top' },
    // { target: '#btn-like',      title: 'LIKE',      content: 'The third button likes the profile.',                 placement: 'top' },
    { target: '#btn-superlike', title: 'Buy',       content: 'The fourth button with the cart icon opens <b>How to Buy</b> so you can purchase the token.', placement: 'top' }
  ];

  window.__tourSteps = steps;

  const start = () => startSiteTour(steps, {
    storageKey: 'siteTour:v1.4.0', // bumped to force showing again
    runOnce: false,
    interactive: true,
    padding: 12,
    locale: { next: 'Next', back: 'Back', finish: 'Finish', skip: 'Skip' },
    onStart: () => console.log('[tour] started'),
    onEnd: () => console.log('[tour] finished')
  });

 
  try { start(); } catch(e) { console.warn('[tour] start failed, will retry', e); }


  setTimeout(() => {
    if (!document.querySelector('.tour-overlay')) {
      try { start(); } catch(e) {}
    }
  }, 500);
});