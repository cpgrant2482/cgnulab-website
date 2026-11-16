/* Original animated particle field. Decorative, not measured neutrino event data.
   Uses deterministic seeds so first frames are stable. Respects reduced motion. */
(() => {
  const canvases = document.querySelectorAll('canvas[data-particle-field]');
  if (!canvases.length) return;
  const motionDisabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x,a,b) => Math.max(a, Math.min(b,x));
  function rng(seed) {return function(){seed|=0;seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296}}
  canvases.forEach((canvas, index) => {
    const ctx = canvas.getContext('2d', {alpha:true}); if (!ctx) return;
    const random = rng(183772 + index*121);
    let W=1,H=1,DPR=1,points=[],frame=0,req=0;
    const count = Math.round(clamp(window.innerWidth*1.03,480,1500) * Number(canvas.dataset.density||1));
    const colors=['#c0eaff','#c0eaff','#ffffff','#ffffff','#53b6f2','#4a9cc6','#f96f77'];
    function init(){
      points = Array.from({length:count},()=>({
        angle:random()*Math.PI*2,
        radius:Math.sqrt(random())*(random()<.84 ? .77 : 1.6),
        z:random()*1.15+.22,
        size:random()*1.65+.48,
        speed:(random()*.17+.03)*(random()>.5?1:-1),
        wave:random()*Math.PI*2,
        color:colors[Math.floor(random()*colors.length)],
        alpha:.25+random()*.73
      }));
    }
    function resize(){
      const b=canvas.getBoundingClientRect(); W=Math.max(1,b.width); H=Math.max(1,b.height); DPR=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.round(W*DPR); canvas.height=Math.round(H*DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    function draw(time){
      ctx.clearRect(0,0,W,H);
      const t=time/1000;
      const cx=W*.53, cy=H*.45;
      const scale=Math.min(W*.32,H*.51);
      for(let i=0;i<points.length;i++){
        const p=points[i];
        const a=p.angle+t*p.speed;
        const perspective=(.74+p.z*.66);
        const spiral=p.radius*scale*perspective;
        const x=cx+Math.cos(a)*spiral+Math.sin(a*2.4+p.wave)*12;
        const y=cy+Math.sin(a)*spiral*.72+Math.cos(a*1.5+p.wave)*11;
        if(x<-20||x>W+20||y<-20||y>H+20)continue;
        const rad=clamp(p.size*perspective*(W<700?.75:1),.45,3.8);
        ctx.globalAlpha=p.alpha*(.72+.28*Math.sin(t*.5+p.wave));
        ctx.fillStyle=p.color;
        if(rad>1.8 && i%4===0){ctx.globalAlpha*=.11;ctx.beginPath();ctx.arc(x,y,rad*4.8,0,7);ctx.fill();ctx.globalAlpha=p.alpha;}
        ctx.beginPath(); ctx.arc(x,y,rad,0,7);ctx.fill();
      }
      ctx.globalAlpha=1;
    }
    function loop(ms){frame++;draw(ms);req=requestAnimationFrame(loop)}
    init();resize(); draw(0);
    if(!motionDisabled && !document.hidden) req=requestAnimationFrame(loop);
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){cancelAnimationFrame(req);req=0;}
      else if(!motionDisabled && !req)req=requestAnimationFrame(loop);
    });
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{resize();draw(performance.now())}).observe(canvas);
    else window.addEventListener('resize',()=>{resize();draw(performance.now())});
  });
})();
