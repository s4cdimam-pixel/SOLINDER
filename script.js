
const profiles = [
  {
    name: "Zoe", age: 21, distance: "5 km away",
    img: "./assets/img/foxybeach.png"
  },
  {
    name: "Margo", age: 24, distance: "9 km away",
    img: "./assets/img/chocolate21.png"
  },
  {
    name: "MrFox", age: 22, distance: "2 km away",
    img: "./assets/img/mrfox.png"
  },
  {
    name: "MrPee", age: 26, distance: "7 km away",
    img: "./assets/img/pepe65.png"
  },

  {
    name: "Leo", age: 26, distance: "22 km away",
    img: "./assets/img/skatty24.png"
  },

  {
    name: "Icy", age: 19, distance: "100 m away",
    img: "./assets/img/cute-pepe.jpeg"
  },

  {
    name: "Megan", age: 43, distance: "331 m away",
    img: "./assets/img/cute-fox.jpeg"
  },

  {
    name: "Hussler", age: 18, distance: "10 km away",
    img: "./assets/img/husller-dog.jpeg"
  },

  {
    name: "Cardi", age: 32, distance: "1 m away",
    img: "./assets/img/cute-black-pepe.jpeg"
  },

  {
    name: "Pepasler", age: 20, distance: "300 km away",
    img: "./assets/img/hussler-pepe.jpeg"
  },

  {
    name: "Mady", age: 30, distance: "1 km away",
    img: "./assets/img/mad-hussler.jpeg"
  }
];

const stackEl = document.getElementById('card-stack');
const template = document.getElementById('card-template');
const historyStack = []; 


const SWIPE_THRESHOLD = 120;     
const ROTATION_ANGLE = 20;       

let nextIndex = 0;               


addNextCard();
addNextCard();
addNextCard();
wireButtons();


function addNextCard() {
  const data = profiles[nextIndex % profiles.length];
  nextIndex++;

  const card = template.content.firstElementChild.cloneNode(true);
  const photo = card.querySelector('.card-photo');
  const name = card.querySelector('.name');
  const distance = card.querySelector('.distance');

  photo.src = data.img;
  photo.alt = `${data.name}`;
  name.textContent = `${data.name} ${data.age}`;
  distance.textContent = data.distance;

 
  stackEl.prepend(card);

  
  Array.from(stackEl.children).forEach((el, i, arr) => {
    el.style.zIndex = String(1000 + i); 
  });

  attachDragHandlers(card);
}

function attachDragHandlers(card){
  let startX = 0, startY = 0;
  let currentX = 0, currentY = 0;
  let dragging = false;

   
    
    const vThreshold = Math.max(160, stackEl.clientHeight * 0.25);
    const hThreshold = stackEl.clientWidth * 0.5;
    if (currentY < -vThreshold && Math.abs(currentX) < hThreshold) {
      try { openHowToBuy(); } catch(e) {}
      const likeBadge = card.querySelector('.badge.like');
      likeBadge.textContent = 'SUPER';
      likeBadge.style.opacity = 1;

      card.classList.add('fly-away');
      card.style.transition = 'transform .35s ease, opacity .35s ease';
      card.style.transform = `translate(0, -130vh) rotate(0deg)`;
      card.style.opacity = '0';

      card.addEventListener('transitionend', () => {
        likeBadge.textContent = 'LIKE';
        card.remove();
        addNextCard();
      }, {once:true});
      return;
    }

  const likeBadge = card.querySelector('.badge.like');
  const nopeBadge = card.querySelector('.badge.nope');

  const onPointerDown = (e) => {
    dragging = true;
    card.classList.remove('fly-away');
    startX = (e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0);
    startY = (e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0);
    if (e.pointerId) card.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if(!dragging) return;
    const pageX = (e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0);
    const pageY = (e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0);
    const x = pageX - startX;
    const y = pageY - startY;
    currentX = x; currentY = y;

    const rot = (x / stackEl.clientWidth) * ROTATION_ANGLE;
    card.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;

    
    const opacity = Math.min(Math.abs(x) / SWIPE_THRESHOLD, 1);
    if(x > 0){ likeBadge.style.opacity = opacity; nopeBadge.style.opacity = 0; }
    else { nopeBadge.style.opacity = opacity; likeBadge.style.opacity = 0; }
  };

  const onPointerUp = () => {
    if(!dragging) return;
    dragging = false;

     
    const vThreshold = Math.max(160, stackEl.clientHeight * 0.25);
    const hThreshold = stackEl.clientWidth * 0.5;
    if (currentY < -vThreshold && Math.abs(currentX) < hThreshold) {
      try { openHowToBuy(); } catch(e) {}
      const likeBadge = card.querySelector('.badge.like');
      likeBadge.textContent = 'SUPER';
      likeBadge.style.opacity = 1;

      card.classList.add('fly-away');
      card.style.transition = 'transform .35s ease, opacity .35s ease';
      card.style.transform = `translate(0, -130vh) rotate(0deg)`;
      card.style.opacity = '0';

      card.addEventListener('transitionend', () => {
        likeBadge.textContent = 'LIKE';
        card.remove();
        addNextCard();
      }, {once:true});
      return;
    }

    
    if(Math.abs(currentX) > SWIPE_THRESHOLD){
      const direction = currentX > 0 ? 1 : -1;
      swipeAway(card, direction);
    }else{
      
      card.style.transition = 'transform .25s ease';
      card.style.transform = 'translate(0, 0) rotate(0deg)';
      card.addEventListener('transitionend', () => {
        card.style.transition = '';
        likeBadge.style.opacity = 0;
        nopeBadge.style.opacity = 0;
      }, {once:true});
    }
  };

 
  card.addEventListener('pointerdown', onPointerDown);
  card.addEventListener('pointermove', onPointerMove);
  card.addEventListener('pointerup', onPointerUp);
  card.addEventListener('pointercancel', onPointerUp);

  
  card.addEventListener('touchmove', (e) => {
    if (dragging) e.preventDefault();
  }, {passive:false});
}

function swipeAway(card, direction){

  historyStack.push(card.outerHTML);

  const likeBadge = card.querySelector('.badge.like');
  const nopeBadge = card.querySelector('.badge.nope');
  likeBadge.style.opacity = direction > 0 ? 1 : 0;
  nopeBadge.style.opacity = direction < 0 ? 1 : 0;

  
  const endX = direction * (window.innerWidth * 1.2);
  const endRot = direction * ROTATION_ANGLE;
  card.classList.add('fly-away');
  card.style.transition = 'transform .35s ease, opacity .35s ease';
  card.style.transform = `translate(${endX}px, -40px) rotate(${endRot}deg)`;
  card.style.opacity = '0';

  card.addEventListener('transitionend', () => {
    card.remove();
    addNextCard();
  }, {once:true});
}


function wireButtons(){
  const btnNope = document.getElementById('btn-nope');
  const btnLike = document.getElementById('btn-like');
  const btnSuper = document.getElementById('btn-superlike');
  const btnRewind = document.getElementById('btn-rewind');

  btnNope.addEventListener('click', () => programmaticSwipe(-1));
  btnLike.addEventListener('click', () => programmaticSwipe(1));
  btnSuper.addEventListener('click', () => superLike());
  btnRewind.addEventListener('click', () => { openTokenomics(); rewind(); });
}

function topCard(){
  return stackEl.lastElementChild; 
}

function programmaticSwipe(direction){
  const card = topCard();
  if(!card) return;
  
  card.style.transform = `translate(${direction*30}px, -10px) rotate(${direction*5}deg)`;
  requestAnimationFrame(() => swipeAway(card, direction));
}

function superLike(){
  try{ openHowToBuy(); }catch(e){}
  const card = topCard();
  if(!card) return;
  
  const likeBadge = card.querySelector('.badge.like');
  likeBadge.textContent = 'SUPER';
  likeBadge.style.opacity = 1;

  card.classList.add('fly-away');
  card.style.transition = 'transform .35s ease, opacity .35s ease';
  card.style.transform = `translate(0, -130vh) rotate(0deg)`;
  card.style.opacity = '0';

  card.addEventListener('transitionend', () => {
    likeBadge.textContent = 'LIKE';
    card.remove();
    addNextCard();
  }, {once:true});
}

function rewind(){
  if(historyStack.length === 0) return;
  const html = historyStack.pop();
  const temp = document.createElement('div');
  temp.innerHTML = html.trim();
  const card = temp.firstElementChild;

  
  card.style.transform = 'scale(.96)';
  card.style.opacity = '0';

  stackEl.append(card);
  attachDragHandlers(card);

  requestAnimationFrame(()=>{
    card.style.transition = 'transform .25s ease, opacity .25s ease';
    card.style.transform = '';
    card.style.opacity = '1';
  });
}


function openHowToBuy(){
  const el = document.getElementById('how-to-buy');
  if(!el) return;
  el.classList.remove('hidden');
  el.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}
function closeHowToBuy(){
  const el = document.getElementById('how-to-buy');
  if(!el) return;
  el.classList.add('hidden');
  el.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}
function wireHowToBuyClose(){
  const el = document.getElementById('how-to-buy');
  if(!el) return;
  el.querySelectorAll('[data-htb-close]').forEach(n => n.addEventListener('click', closeHowToBuy));
}
document.addEventListener('DOMContentLoaded', wireHowToBuyClose);


function openTokenomics(){
  const el = document.getElementById('tokenomics');
  if(!el) return;
  el.classList.remove('hidden');
  el.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}
function closeTokenomics(){
  const el = document.getElementById('tokenomics');
  if(!el) return;
  el.classList.add('hidden');
  el.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}
function wireTokenomicsClose(){
  const el = document.getElementById('tokenomics');
  if(!el) return;
  el.querySelectorAll('[data-tk-close]').forEach(n => n.addEventListener('click', closeTokenomics));
}
document.addEventListener('DOMContentLoaded', wireTokenomicsClose);





// Copy Contract Address (non-intrusive)
document.addEventListener('click', async (ev) => {
  const copyBtn = ev.target.closest('.ca-copy');
  if (!copyBtn) return;
  const wrap = copyBtn.closest('.contract-address');
  if (!wrap) return;
  const valueEl = wrap.querySelector('.ca-value');
  let text = (valueEl ? valueEl.textContent : wrap.textContent) || '';
  // Remove the "Contract :" label and trim
  text = text.replace(/\bContract\s*:?/i, '').trim();
  // If address has trailing UI words, clean common ones
  text = text.replace(/Copied!?$/i, '').trim();
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  }
  copyBtn.classList.add('copied');
  setTimeout(() => copyBtn.classList.remove('copied'), 1200);
});

