// Interactive directory fixture; no app server or data writes.
const assert=require('node:assert/strict');
const path=require('node:path');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..');const req=createRequire(path.join(root,'frontend/package.json'));
(async()=>{
 const {outputFiles}=await req('esbuild').build({stdin:{resolveDir:path.join(root,'frontend/src'),loader:'jsx',contents:`
 import React,{useEffect,useState} from 'react';import {createRoot} from 'react-dom/client';
 import {MemoryRouter,useLocation} from 'react-router-dom';import {CompactBranch} from './components/BoxList';
 const node={_id:'fixture',box_id:'122',label:'Random Festival Stuff with a long folder label that wraps on mobile',items:[{_id:'light',name:'Light-up inflatable decoration',description:'Festival lights',tags:['camping','lights']}],childBoxes:[{_id:'child',box_id:'123',label:'Box of Lights',items:[{_id:'spare',name:'Spare Lights',tags:['spare','lights']}],childBoxes:[]}]};
 function Fixture(){const [query,setQuery]=useState('LiGhT');window.setFixtureQuery=setQuery;const location=useLocation();useEffect(()=>{window.fixturePath=location.pathname+location.search},[location]);return <CompactBranch node={node} searchQuery={query}/>;}
 createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/operations?q=lights']}><Fixture/></MemoryRouter>);`},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},loader:{'.csv':'text','.webp':'dataurl'},logLevel:'silent'});
 const browser=await require(path.join(root,'node_modules/puppeteer')).launch({headless:true});
 try{const page=await browser.newPage();await page.setViewport({width:430,height:932});
 await page.setContent('<style>*{box-sizing:border-box}body{margin:12px;background:#101b27;color:#edf2ff;--dw-font-ui:Arial;--dw-font-data:monospace;--dw-text:#edf2ff;--dw-text-secondary:#a9b7cb;--dw-surface:#101b27;--dw-surface-raised:#192838}</style><div id="root"></div>');
 await page.addScriptTag({content:outputFiles[0].text});await page.waitForSelector('h3[data-box-address="122"]');
 assert.equal(await page.$('button[data-box-address="122"]'),null);
 await page.click('h3[data-box-address="122"]');assert.equal(await page.evaluate(()=>window.fixturePath),'/operations?q=lights');
 assert.equal(await page.$('a[href="/tag/camping"]'),null);assert.equal(await page.$('a[href="/tag/spare"]'),null);assert.ok(await page.$('a[href="/tag/lights"]'));
 assert.ok(await page.evaluate(()=>{const header=document.querySelector('h3').getBoundingClientRect(),list=document.querySelector('ul').getBoundingClientRect();return list.left>header.left&&document.documentElement.scrollWidth<=430;}));
 const headings=await page.$$eval('h3',nodes=>nodes.map(node=>{const title=node.firstElementChild.children[1],style=getComputedStyle(title);return {weight:style.fontWeight,size:parseFloat(style.fontSize),spacing:parseFloat(style.letterSpacing),width:title.getBoundingClientRect().width,height:title.getBoundingClientRect().height};}));
 assert.ok(headings.every(heading=>heading.weight==='300'&&heading.size>=15&&heading.spacing>1.5));
 assert.ok(headings[0].height>headings[1].height, 'long headings wrap while short headings remain compact');
 await page.screenshot({path:'/tmp/disco-terminal-directory.png'});
 await page.evaluate(()=>window.setFixtureQuery(''));await page.waitForFunction(()=>!document.querySelector('[data-tag-chip]'));assert.equal((await page.$$('a[aria-controls="operations-box-quick-peek"]')).length,2);
 await page.evaluate(()=>window.setFixtureQuery('light'));await page.waitForSelector('a[href="/tag/lights"]');
 await page.click('a[aria-label="Quick peek at Light-up inflatable decoration"]');await page.waitForFunction(()=>window.fixturePath.includes('peek=122')&&window.fixturePath.includes('item=light'));
 console.log('PASS: passive box heading, item Quick Peek link, matching-only tags, nested indentation and no mobile horizontal overflow.');
 }finally{await browser.close();}
})();
