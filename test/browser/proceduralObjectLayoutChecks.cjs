const fs = require('fs');
const path = require('path');
const {createRequire}=require('module');
const root=path.resolve(__dirname, '../..');
const assert=require('node:assert/strict');
const req=createRequire(root+'/frontend/package.json');
const React=req('react');
const {renderToStaticMarkup}=req('react-dom/server');
const {ServerStyleSheet}=req('styled-components');
const esbuild=req('esbuild');
(async()=>{
const {outputFiles}=await esbuild.build({stdin:{contents:`export * from './components/OperationsQuickPeek/OperationsQuickPeek.styles'; export {default as Shape} from './components/InventoryObjectShape';`,resolveDir:root+'/frontend/src',loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',external:['react','styled-components']});
const m={exports:{}};new Function('require','module','exports',outputFiles[0].text)(id=>id==='styled-components'?Object.assign(req(id).default,req(id)):req(id),m,m.exports);
const S=m.exports;const h=React.createElement;const sheet=new ServerStyleSheet();
const markup=renderToStaticMarkup(sheet.collectStyles(h(S.ItemCarousel,{style:{height:'299px',width:'322px'}},h(S.ItemCarouselCard,{'data-card':true},h(S.ItemCarouselMedia,{'data-media':true},h(S.ItemCarouselImageFallback,{'data-fallback':true},h(S.Shape,{item:{name:'Solar Lights',quantity:12,description:'Ground staked Solar camping lights'}}))),h(S.ItemCarouselBody,{style:{height:'145px',boxSizing:'border-box'}},'Solar Lights')))));
const browser=await require(root+'/node_modules/puppeteer').launch({headless:true});const page=await browser.newPage();await page.setViewport({width:430,height:932});await page.setContent('<style>body{margin:8px;--dw-surface:#101b27;--dw-surface-raised:#192838;--box-primary:#ff767b;--box-secondary:#ffa68d;--box-primary-rgb:255,118,123}</style>'+sheet.getStyleTags()+markup);
for (const [width,height] of [[322,299],[430,260],[322,467],[600,240]]) {
  await page.evaluate(([width,height])=>{const canvas=document.querySelector('section');canvas.style.width=width+'px';canvas.style.height=height+'px';},[width,height]);
  const geometry=await page.evaluate(()=>{
    const media=document.querySelector('[data-media]').getBoundingClientRect();
    const fallback=document.querySelector('[data-fallback]').getBoundingClientRect();
    const parts=[...document.querySelectorAll('polygon')].map(e=>e.getBoundingClientRect());
    const shape={left:Math.min(...parts.map(r=>r.left)),right:Math.max(...parts.map(r=>r.right)),top:Math.min(...parts.map(r=>r.top)),bottom:Math.max(...parts.map(r=>r.bottom))};
    return {media:{left:media.left,right:media.right,top:media.top,bottom:media.bottom,height:media.height},fallbackHeight:fallback.height,shape};
  });
  assert.ok(Math.abs(geometry.media.height-geometry.fallbackHeight)<1);
  assert.ok(geometry.media.height>50);
  assert.ok(geometry.shape.left>geometry.media.left && geometry.shape.right<geometry.media.right);
  assert.ok(geometry.shape.top>geometry.media.top && geometry.shape.bottom<geometry.media.bottom);
  assert.ok(Math.abs((geometry.shape.top+geometry.shape.bottom-geometry.media.top-geometry.media.bottom)/2)<geometry.media.height*.15);
  console.log(`${width}x${height}: media ${geometry.media.height}px, full silhouette contained and centered`);
  await page.screenshot({path:`/tmp/disco-object-${width}x${height}.png`});
}
await browser.close();
})();
