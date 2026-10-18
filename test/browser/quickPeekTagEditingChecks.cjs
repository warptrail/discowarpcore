// Isolated interactive component fixture. Every API is stubbed; no server/data writes.
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const req = createRequire(path.join(root, 'frontend/package.json'));
(async () => {
  const { outputFiles } = await req('esbuild').build({
    stdin: { resolveDir:path.join(root,'frontend/src'), loader:'jsx', contents:`
      import React,{useState} from 'react'; import {createRoot} from 'react-dom/client';
      import {MemoryRouter} from 'react-router-dom';
      import Tags from './components/OperationsQuickPeek/QuickPeekItemTags';
      import {ToastContext} from './components/Toast';
      window.saves=[];window.failSave=false;
      function Fixture(){const [item,setItem]=useState({_id:'fixture',name:'Solar Lights',tags:['camping']});
        return <MemoryRouter><ToastContext.Provider value={{showToast:()=>{}}}>
          <Tags item={item} tags={item.tags} name={item.name} description="" onSaved={setItem}/>
          <button id="outside">Outside</button>
        </ToastContext.Provider></MemoryRouter>;}
      createRoot(document.getElementById('root')).render(<Fixture/>);` },
    bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},
    plugins:[{name:'fixture-apis',setup(build){
      build.onLoad({filter:/\/api\/editItem\.js$/},()=>({contents:`export async function editItem(id,payload){window.saves.push(payload);if(window.failSave)throw new Error('Fixture save failed');return {_id:id,name:'Solar Lights',...payload};}`,loader:'js'}));
      build.onLoad({filter:/\/api\/retrieval\.js$/},()=>({contents:`export async function fetchRetrievalItemsPage(){return {filters:{tags:[]}}} export const fetchRetrievalBoxesPage=fetchRetrievalItemsPage;`,loader:'js'}));
    }}],logLevel:'silent',
  });
  const browser = await require(path.join(root,'node_modules/puppeteer')).launch({headless:true});
  try {
    const page = await browser.newPage();await page.setViewport({width:430,height:932});
    await page.setContent('<style>body{padding:12px;background:#101b27;color:#edf2ff;--box-primary:#ff767b;--box-primary-rgb:255,118,123;--dw-text:#edf2ff;--dw-background:#101b27;--dw-font-ui:Arial}</style><div id="root"></div>');
    await page.addScriptTag({content:outputFiles[0].text});
    await page.waitForSelector('button[aria-label="Edit item tags"]');
    assert.equal(await page.$('input[aria-label="Add item tag"]'),null);
    assert.equal(await page.$('button[aria-label="Add tag"]'),null);
    assert.ok(await page.$('a[href="/tag/camping"]'));
    await page.click('button[aria-label="Edit item tags"]');
    await page.waitForSelector('input[aria-label="Add item tag"]');
    assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Add item tag');
    assert.ok(await page.$('button[aria-label="Remove camping tag"]'));
    await page.type('input','lights');await page.keyboard.press('Enter');
    await page.waitForSelector('a[href="/tag/lights"]');
    assert.equal(await page.$eval('input',e=>e.value),'');
    await page.evaluate(()=>{window.failSave=true;});
    await page.type('input','spare');await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.body.textContent.includes('Fixture save failed'));
    assert.equal(await page.$eval('input',e=>e.value),'spare');
    await page.click('#outside');assert.equal(await page.evaluate(()=>window.saves.length),2);
    await page.focus('input');await page.keyboard.press('Escape');
    assert.equal(await page.$('input[aria-label="Add item tag"]'),null);
    assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Edit item tags');
    await page.click('button[aria-label="Edit item tags"]');
    assert.equal(await page.$eval('input',e=>e.value),'');
    await page.evaluate(()=>{window.failSave=false;});
    await page.click('button[aria-label="Remove camping tag"]');
    await page.waitForFunction(()=>!document.querySelector('a[href="/tag/camping"]'));
    await page.click('button[aria-label="Finish editing item tags"]');
    assert.equal(await page.$('input[aria-label="Add item tag"]'),null);
    await page.screenshot({path:'/tmp/disco-tags-read-mode.png'});
    console.log('PASS: default closed, pencil toggles/focuses, Enter adds, failure retains draft, blur does not save, Escape cancels/restores focus, removal works.');
  } finally { await browser.close(); }
})();
