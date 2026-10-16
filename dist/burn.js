'use strict';
(() => {
  const section = document.querySelector('.film-burn');
  const canvas = document.querySelector('#film-burn-frame');
  const context = canvas.getContext('2d', {alpha:true});
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const site = document.querySelector('.site');
  const header = site.querySelector('.header');
  const headerSpace = document.createElement('div');
  headerSpace.style.display = 'none'; header.before(headerSpace);
  const spacer = document.createElement('div');
  site.before(spacer); spacer.append(site);
  let pinStart = 0, burnStart = 0, siteTop = 0, siteLeft = 0, siteWidth = 0, pinned = false;
  function release() {
    site.style.position = site.style.top = site.style.left = site.style.width = site.style.margin = '';
    header.style.position = header.style.top = header.style.left = header.style.width = '';
    headerSpace.style.display = 'none';
    pinned = false;
  }
  function measurePin() {
    release(); spacer.style.height = '';
    const rect = site.getBoundingClientRect();
    siteTop = scrollY + rect.top; siteLeft = rect.left; siteWidth = rect.width;
    const footerRect = document.querySelector('footer').getBoundingClientRect();
    const previousStart = scrollY + footerRect.top - innerHeight * .90;
    // Pin once the full footer is comfortably visible. Consume the reading
    // interval while pinned, then advance the unchanged burn/fade range.
    const footerClearance = Math.min(72, innerHeight * .08);
    const readingTravel = Math.min(64, innerHeight * .08);
    pinStart = scrollY + footerRect.bottom - innerHeight + footerClearance;
    burnStart = pinStart + readingTravel;
    spacer.style.height = `${site.offsetHeight}px`;
    // Retain the existing physical expansion distance: the former 82% burn
    // phase becomes 75% of a slightly longer finale, including the ending.
    section.style.height = '';
    if (!reduced.matches) {
      const baseHeight = section.offsetHeight;
      const oldTravel = Math.max(1,document.documentElement.scrollHeight-innerHeight-previousStart);
      const extraTravel = oldTravel * (.82/.75 - 1);
      // Shift the entire existing burn/fade range later without compressing
      // or lengthening any of its phases.
      section.style.height = `${baseHeight+extraTravel+(burnStart-previousStart)}px`;
    }
  }
  function updatePin() {
    if (reduced.matches || scrollY <= pinStart) { if(pinned) release(); return; }
    if (pinned) return;
    const padding = parseFloat(getComputedStyle(site).paddingLeft);
    headerSpace.style.height = `${header.offsetHeight}px`;
    headerSpace.style.display = 'block';
    // Keep a same-height placeholder in document flow. Fix the original,
    // live content at its exact threshold coordinates: no clone or screenshot.
    site.style.position = 'fixed'; site.style.top = `${siteTop-pinStart}px`;
    site.style.left = `${siteLeft}px`; site.style.width = `${siteWidth}px`; site.style.margin = '0';
    // Preserve the navigation's already-sticky screen position as well.
    header.style.position = 'fixed'; header.style.top = '0';
    header.style.left = `${siteLeft+padding}px`; header.style.width = `${siteWidth-padding*2}px`;
    pinned = true;
  }
  let arrival, texture, frame, pending = false, previous = -1;
  const mix = (a,b,t) => a + (b-a)*t;
  const clamp = x => Math.max(0,Math.min(1,x));
  function hash(x,y) { const v=Math.sin(x*127.1+y*311.7)*43758.5453; return v-Math.floor(v); }
  function noise(x,y) {
    const ix=Math.floor(x), iy=Math.floor(y), fx=x-ix, fy=y-iy;
    const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
    return mix(mix(hash(ix,iy),hash(ix+1,iy),u),mix(hash(ix,iy+1),hash(ix+1,iy+1),u),v);
  }
  function fbm(x,y) { return noise(x,y)*.55+noise(x*2.07,y*2.07)*.27+noise(x*4.13,y*4.13)*.13+noise(x*8.1,y*8.1)*.05; }
  function resize() {
    measurePin();
    // Compute a deterministic heat-arrival map only on resize. Pixel work
    // is capped around 150k pixels, independently of mobile device DPI.
    canvas.width=Math.max(1,Math.floor(Math.min(480,innerWidth,Math.sqrt(150000*innerWidth/innerHeight))));
    canvas.height=Math.round(canvas.width*innerHeight/innerWidth);
    const total=canvas.width*canvas.height;
    arrival=new Float32Array(total); texture=new Float32Array(total);
    frame=context.createImageData(canvas.width,canvas.height);
    let maximum=0;
    for(let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++) {
      const u=x/canvas.width,v=y/canvas.height,index=y*canvas.width+x;
      const rough=fbm(u*9+3,v*9+8);
      const wx=u+(fbm(u*4,v*4)-.5)*.22;
      const wy=v+(fbm(u*4+17,v*4+9)-.5)*.22;
      // Bottom-right ignition plus delayed secondary melt pockets. Domain
      // distortion and multiscale noise tear the fronts into uneven lobes.
      let heat=Math.hypot((1.01-wx)*.86,(1.02-wy)*1.06)+rough*.18;
      for(const [sx,sy,delay] of [[.76,.76,.23],[.93,.46,.42],[.52,.82,.44],[.63,.38,.67],[.24,.53,.89]]) {
        heat=Math.min(heat,Math.hypot((wx-sx)*1.2,(wy-sy)*1.25)+delay+rough*.14);
      }
      arrival[index]=heat; maximum=Math.max(maximum,heat);
      texture[index]=fbm(u*5+40,v*5+70)*.8+rough*.2;
    }
    for(let i=0;i<total;i++) arrival[i]/=maximum;
    previous=-1; schedule();
  }
  function render() {
    pending=false;
    updatePin();
    if(reduced.matches) {context.clearRect(0,0,canvas.width,canvas.height);return;}
    const start=burnStart;
    const end=document.documentElement.scrollHeight-innerHeight;
    const travel=Math.max(1,end-start);
    const position=clamp((scrollY-start)/travel);
    // 75% expansion, 5% luminous hold, 20% smooth fade to opaque black.
    // Scroll alone controls all phases, including exact reverse playback.
    const progress=clamp(position/.75);
    const fade=clamp((position-.80)/.20);
    const brightness=1-fade*fade*(3-2*fade);
    if(position===previous) return;
    previous=position;
    if(progress===0) {context.clearRect(0,0,canvas.width,canvas.height);return;}
    const threshold=progress*1.10;
    const pixels=frame.data;
    for(let i=0;i<arrival.length;i++) {
      const distance=threshold-arrival[i],tone=texture[i],offset=i*4;
      let r,g,b,alpha;
      if(distance<-.046) {alpha=0;r=g=b=0;}
      else if(distance<0) {
        const edge=clamp((distance+.046)/.046);
        r=255;g=mix(38,190,edge*edge);b=mix(3,38,edge);alpha=edge*.85;
      } else {
        const rim=Math.exp(-distance*75);
        const white=clamp((tone-.28)*2.5+rim*.8);
        r=255;g=mix(115,255,white);b=mix(12,242,white*white);
        alpha=1; // Consumed film is opaque: no underlying scratches leak.
      }
      pixels[offset]=Math.round(r*brightness);pixels[offset+1]=Math.round(g*brightness);pixels[offset+2]=Math.round(b*brightness);pixels[offset+3]=Math.round(alpha*255);
    }
    context.putImageData(frame,0,0);
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(render);}}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',resize,{passive:true});
  reduced.addEventListener('change',()=>{measurePin();previous=-1;schedule();});
  addEventListener('load',()=>{measurePin();previous=-1;schedule();});
  resize();
})();

