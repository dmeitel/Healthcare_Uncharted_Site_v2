// SVG LABEL COLLISION. The type floor says a label is big enough; it says
// nothing about whether two labels now sit on top of each other. Counter-scaling
// the laws page produced "ROUGHLY FLATHEOGETHER SPLITS FROM THE VOLUME" and
// every numeric check passed it.
const { chromium } = require('playwright');
const http=require('http'); const fs=require('fs'); const path=require('path');
const SITE='C:/Users/david/Documents/Healthcare_Uncharted_Site/_site';
// Git Bash rewrites a leading-slash arg into a Windows path before node sees
// it, so take the path slashless and put the slash back here.
const PAGE='/'+String(process.argv[2]).replace(/^[A-Za-z]:[\/](?:.*?[\/])?Git[\/]/,'').replace(/^\/+/,'');
const OUT=process.argv[3];
const T={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon','.txt':'text/plain','.xml':'application/xml','.csv':'text/csv','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html';
  const f=path.join(SITE,p); if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end();}
  s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(s);});
(async()=>{
  await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:360,height:900},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const pg=await ctx.newPage();
  await pg.goto('http://localhost:'+port+PAGE,{waitUntil:'networkidle',timeout:45000});
  await pg.evaluate(()=>{document.querySelectorAll('.lp-panel').forEach(p=>p.classList.add('active'));});
  await pg.waitForTimeout(1200);
  const r=await pg.evaluate(()=>{
    const hits=[];
    document.querySelectorAll('svg').forEach(svg=>{
      const ts=[...svg.querySelectorAll('text')].filter(t=>(t.textContent||'').trim());
      for(let i=0;i<ts.length;i++) for(let j=i+1;j<ts.length;j++){
        const a=ts[i].getBoundingClientRect(), c=ts[j].getBoundingClientRect();
        if(!a.width||!c.width) continue;
        const ox=Math.min(a.right,c.right)-Math.max(a.left,c.left);
        const oy=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top);
        if(ox>4&&oy>4){
          const area=ox*oy, small=Math.min(a.width*a.height,c.width*c.height);
          if(area/small>0.18) hits.push({a:ts[i].textContent.trim().slice(0,26),b:ts[j].textContent.trim().slice(0,26),pct:Math.round(area/small*100)});
        }
      }
    });
    return hits;
  });
  console.log(PAGE+' : '+(r.length?r.length+' COLLIDING label pair(s)':'no colliding labels'));
  for(const h of r.slice(0,8)) console.log('   '+h.pct+'% overlap: "'+h.a+'"  x  "'+h.b+'"');
  if(OUT){ await pg.evaluate(()=>{const s=document.querySelectorAll('svg.lpv')[0]; if(s) window.scrollTo(0, s.getBoundingClientRect().top+scrollY-120);});
    await pg.waitForTimeout(400); await pg.screenshot({path:OUT+'/collide.png'}); }
  await b.close(); srv.close();
})();
