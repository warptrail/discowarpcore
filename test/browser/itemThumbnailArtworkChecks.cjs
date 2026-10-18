// Browser-only fixture: data-URL photos, no API or production access.
const assert=require('node:assert/strict');
const path=require('node:path');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..');
const req=createRequire(path.join(root,'frontend/package.json'));
(async()=>{
 const {outputFiles}=await req('esbuild').build({stdin:{resolveDir:path.join(root,'frontend/src'),loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';
 import Media from './components/ItemThumbnailMedia';import RowThumbnail from './components/ItemRowThumbnail';import Shape from './components/InventoryObjectShape';
 import {getBoxTheme,getBoxThemeCssVars} from './util/inventoryColorTheme';
 const item={name:'Solar Lights',quantity:12,description:'Camping lights',tags:['camping'],box:{box_id:'401'}};
 const photo='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><rect width="30" height="30" fill="white"/></svg>');
 const broken='data:image/png;base64,broken';
 createRoot(document.getElementById('root')).render(<div style={getBoxThemeCssVars(getBoxTheme('401'))}>
 <div id="banner" style={{width:180,height:160}}><Shape item={item}/></div>
 <div style={{display:'flex',gap:20,alignItems:'center'}}>{[24,30,40,58].map(size=><span key={size} id={'thumb-'+size}><Media item={item} size={size}/></span>)}</div>
 <div id="full-row" style={{height:84}}><RowThumbnail item={item} sources={[]} name={item.name} boxId="401" quantityLabel="×12"/></div>
 <div id="photo"><Media item={item} size={40} sources={[photo]}/></div>
 <div id="broken"><Media item={item} size={40} sources={[broken]}/></div>
 <div id="retry"><Media item={item} size={40} sources={[broken,photo]}/></div>
 </div>);`},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},logLevel:'silent'});
 const browser=await require(path.join(root,'node_modules/puppeteer')).launch({headless:true});
 try{
 const page=await browser.newPage();await page.setViewport({width:430,height:600});
 await page.setContent('<style>body{margin:24px;background:#101b27;color:white}#banner svg{width:100%;height:100%}#photo,#broken,#retry{display:inline-block;margin:20px}</style><div id="root"></div>');
 await page.addScriptTag({content:outputFiles[0].text});await page.waitForSelector('#broken [data-inventory-object]');
 await page.waitForFunction(()=>document.querySelector('#retry img')?.naturalWidth>0);
 assert.ok(await page.$('#full-row svg'));
 assert.ok(await page.$eval('#full-row svg',svg=>{const frame=svg.getBoundingClientRect();return [...svg.querySelectorAll('polygon')].every(e=>{const r=e.getBoundingClientRect();return r.left>=frame.left&&r.right<=frame.right&&r.top>=frame.top&&r.bottom<=frame.bottom;});}));assert.ok((await page.$eval('#full-row',e=>e.textContent)).includes('×12'));
 assert.equal(await page.$('#photo svg'),null);assert.equal(await page.$('#retry svg'),null);
 const checks=await page.evaluate(()=>{
 const banner=[...document.querySelectorAll('#banner polygon')].map(e=>e.getAttribute('points')).join('|');
 return [24,30,40,58].map(size=>{
 const svg=document.querySelector('#thumb-'+size+' svg'),frame=svg.getBoundingClientRect();
 const parts=[...svg.querySelectorAll('polygon')];
 return {size,same:parts.map(e=>e.getAttribute('points')).join('|')===banner,fill:getComputedStyle(parts[0]).fill,bannerFill:getComputedStyle(document.querySelector('#banner polygon')).fill,contained:parts.every(e=>{const r=e.getBoundingClientRect();return r.left>=frame.left&&r.right<=frame.right&&r.top>=frame.top&&r.bottom<=frame.bottom;}),width:frame.width,height:frame.height};});});
 for(const check of checks){assert.ok(check.same&&check.contained);assert.equal(check.fill,check.bannerFill);assert.equal(check.width,check.size);assert.equal(check.height,check.size);}
 await page.screenshot({path:'/tmp/disco-item-thumbnail-artwork.png'});console.log('PASS: identical banner/thumbnail geometry and palette; 24/30/40/58px contained; real, broken and retried photos.');
 }finally{await browser.close();}
})();
