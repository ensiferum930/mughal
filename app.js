const opening=document.getElementById('opening'),main=document.getElementById('site'),open=document.getElementById('open');
open.addEventListener('click',()=>{opening.classList.add('out');main.classList.add('ready');main.setAttribute('aria-hidden','false');setTimeout(()=>opening.remove(),1300)});
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=(i%4)*90+'ms';io.observe(el)});
