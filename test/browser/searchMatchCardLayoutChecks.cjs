// Real component fixture, no server/API access or production data.
const assert=require('node:assert/strict');const path=require('node:path');const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),req=createRequire(path.join(root,'frontend/package.json'));
(async()=>{
 const {outputFiles}=await req('esbuild').build({stdin:{resolveDir:path.join(root,'frontend/src'),loader:'jsx',contents:`
 import React,{useState,useEffect} from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,useLocation} from 'react-router-dom';
 import Matches from './components/InventorySearchMatches';
 const items=[
 {_id:'end',name:'Solar Lights',quantity:12,description:'Earlier storage context. '.repeat(30)+'Special lights at the end.'},
 {_id:'tags',name:'Pocket Lights',quantity:1,tags:['camping','lights','festival','spare','outdoor','very-long-tag-name-that-tests-overflow']},
 {_id:'empty',name:'Small Lights',quantity:1},
 {_id:'title',name:'An exceptionally long Lights item title with a great many useful distinguishing details that must stay bounded',quantity:3,description:'Lights near the start. '+ 'Extra description. '.repeat(30),tags:['lights']},
 {_id:'middle',name:'Camping Lights',quantity:2,description:'Before. '.repeat(25)+'lights '+'After. '.repeat(25),tags:['camping']}
 ];
 window.parentClicks=0;function Fixture(){const [compact,setCompact]=useState(false);window.fixtureDensity=setCompact;const location=useLocation();useEffect(()=>{window.fixturePath=location.pathname+location.search},[location]);return <div onClick={()=>window.parentClicks++}><Matches items={items} query="lights" label="Matching items in box 401" boxId="401" compact={compact}/></div>}
 createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/operations?q=lights']}><Fixture/></MemoryRouter>);`},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},logLevel:'silent'});
 const browser=await require(path.join(root,'node_modules/puppeteer')).launch({headless:true});
 try{const page=await browser.newPage();await page.setViewport({width:430,height:932});
 await page.setContent('<style>*{box-sizing:border-box}body{margin:12px;background:#101b27;--dw-font-ui:Arial;--dw-font-data:monospace;--dw-text:#edf2ff;--dw-text-secondary:#a9b7cb;--dw-surface:#101b27;--dw-surface-raised:#192838;--dw-border-soft:#304255;--dw-violet:#b4a0df;--dw-cyan:#80dfff;--box-primary:#ff767b;--box-primary-rgb:255,118,123;--box-secondary:#ffa68d}</style><div id="root"></div>');
 await page.addScriptTag({content:outputFiles[0].text});await page.waitForSelector('[data-item-match-card]');
 for(const compact of [false,true]){
 await page.evaluate(value=>window.fixtureDensity(value),compact);await page.waitForFunction((height)=>document.querySelector('[data-item-match-card]').getBoundingClientRect().height===height,{},144);
 const metrics=await page.evaluate(()=>[...document.querySelectorAll('[data-item-match-card]')].map(card=>{
 const r=card.getBoundingClientRect(),footer=card.querySelector('[data-card-tag-footer]').getBoundingClientRect(),link=card.querySelector('a[aria-controls]'),excerpt=link.children[1],hit=excerpt.querySelector('mark'),hr=hit?.getBoundingClientRect(),er=excerpt.getBoundingClientRect();
 const quantity=card.querySelector('[aria-label^="Quantity:"]')?.getBoundingClientRect(),tagSlot=card.querySelector('[data-card-tag-footer] > div').getBoundingClientRect();
 return {height:r.height,footerInside:footer.left>=r.left&&footer.right<=r.right&&footer.bottom<=r.bottom,hitVisible:!hit||(hr.top>=er.top&&hr.bottom<=er.bottom+1),quantityClear:!quantity||quantity.left>=tagSlot.right,tagsInside:[...card.querySelectorAll('[data-tag-chip]')].filter(e=>e.getBoundingClientRect().width&&getComputedStyle(e).visibility!=='hidden').every(e=>{const t=e.getBoundingClientRect();return t.left>=r.left&&t.right<=r.right&&t.top>=r.top&&t.bottom<=r.bottom;}),nestedLinks:!!card.querySelector('a a'),tags:!!card.querySelector('[aria-label="Tags"]')};}));
 assert.ok(metrics.every(m=>m.height===(144)&&m.footerInside&&m.hitVisible&&m.quantityClear&&m.tagsInside&&!m.nestedLinks));assert.ok(metrics[1].tags&&metrics[4].tags&&!metrics[0].tags);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=430));
 console.log(`${compact?'compact':'standard'}: five equal ${metrics[0].height}px cards; contained tag footers, visible keyword hits, no quantity overlap or nested links`);
 if(!compact)await page.screenshot({path:'/tmp/disco-equal-search-cards.png',fullPage:true});
 }
 await page.evaluate(()=>window.fixtureDensity(false));await page.click('a[aria-label="Quick peek at Solar Lights"]');await page.waitForFunction(()=>window.fixturePath.includes('peek=401')&&window.fixturePath.includes('item=end'));assert.equal(await page.evaluate(()=>window.parentClicks),0);
 }finally{await browser.close();}
})();
