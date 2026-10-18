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
const {outputFiles}=await esbuild.build({stdin:{contents:`export {default as Carousel} from './components/OperationsQuickPeek/QuickPeekItemCarousel';`,resolveDir:root+'/frontend/src',loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',external:['react','react-dom','react-router-dom','styled-components'],define:{'import.meta.env':'{}'}});
const m={exports:{}};new Function('require','module','exports',outputFiles[0].text)(id=>id==='styled-components'?Object.assign(req(id).default,req(id)):req(id),m,m.exports);
const S=m.exports;const h=React.createElement;const sheet=new ServerStyleSheet();
const item={_id:'6a35b8801356bc312a3123f9',name:'Solar Lights',quantity:12,category:'miscellaneous',description:'Ground staked Solar camping lights. Long description with useful placement and setup details that should remain fully readable without hiding text behind a small preview clamp.'};
const markup=renderToStaticMarkup(sheet.collectStyles(h('div',{style:{height:'360px',width:'402px'}},h(S.Carousel,{item,position:1,total:1}))));
const browser=await require(root+'/node_modules/puppeteer').launch({headless:true});const page=await browser.newPage();await page.setViewport({width:430,height:932});await page.setContent('<style>body{margin:8px;font-family:Arial;font-size:14px;color:#edf2ff;--dw-font-ui:Arial;--dw-font-data:monospace;--dw-surface:#101b27;--dw-surface-raised:#192838;--box-primary:#ff767b;--box-secondary:#ffa68d;--box-primary-rgb:255,118,123}</style>'+sheet.getStyleTags()+markup);
const metrics=await page.evaluate(()=>{
const quantity=document.querySelector('[data-item-field="quantity"]'); const meta=quantity.parentElement.parentElement;const desc=document.querySelector('button[aria-label="Edit Description"]');const label=desc.parentElement.previousElementSibling;
return {metaHeight:meta.getBoundingClientRect().height,descriptionTop:label.getBoundingClientRect().top,descriptionWidth:desc.getBoundingClientRect().width,quantityHeight:quantity.getBoundingClientRect().height,categoryHeight:document.querySelector('[role="combobox"]').getBoundingClientRect().height,descriptionHeight:desc.getBoundingClientRect().height,descriptionClamp:getComputedStyle(desc).webkitLineClamp,factBackground:getComputedStyle(quantity.parentElement).backgroundColor,categoryBorder:getComputedStyle(document.querySelector('[role="combobox"]')).borderTopWidth};});
assert.ok(metrics.metaHeight<60);assert.equal(metrics.quantityHeight,44);assert.equal(metrics.categoryHeight,44);assert.equal(metrics.factBackground,'rgba(0, 0, 0, 0)');assert.equal(metrics.categoryBorder,'0px');assert.equal(metrics.descriptionClamp,'none');assert.ok(metrics.descriptionWidth>370);console.log(metrics);await page.screenshot({path:process.env.DETAILS_SCREENSHOT||'/tmp/disco-details-layout.png'});await browser.close();
})();
