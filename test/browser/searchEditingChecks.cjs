// Isolated UI regressions: real components/hooks, synthetic inventory, no backend.
// Uses an already installed Playwright; set PLAYWRIGHT_MODULE for another location.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const req = createRequire(path.join(root, 'frontend/package.json'));
const playwright = require(process.env.PLAYWRIGHT_MODULE || '/Users/zephyr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const evidence = path.join(root, 'docs/ux/2026-10-19-space-boxes-iphone');

(async () => {
  const { outputFiles } = await req('esbuild').build({
    stdin: { resolveDir: path.join(root, 'frontend/src'), loader: 'jsx', contents: `
      import React,{useEffect,useRef,useState} from 'react';
      import {createRoot} from 'react-dom/client'; import {MemoryRouter} from 'react-router-dom';
      import GlobalStyles from './styles/globalStyles';
      import usePeek from './components/OperationsQuickPeek/useOperationsQuickPeek';
      import Header from './components/OperationsQuickPeek/QuickPeekBoxHeader';
      import BoxSearch from './components/BoxDetailView/BoxSearchOverlay';
      import useBoxSearch from './components/BoxDetailView/useBoxWorkspaceSearch';
      const box={_id:'fixture-box',box_id:'117',label:'Fixture box',items:[]};
      const boxes=[box]; const items=[{_id:'fixture-one',name:'Cable'},{_id:'fixture-two',name:'Lamp'}];
      function PeekPanel({peek}) {
        const panel=useRef(null);const [searchOpen,setSearchOpen]=useState(false),[query,setQuery]=useState('cable');
        useEffect(()=>{panel.current?.focus({preventScroll:true});},[]);
        return <aside id="operations-box-quick-peek" ref={panel} tabIndex={-1} style={{marginTop:16,background:'#182331'}}>
          <Header box={box} onClose={peek.close} searchOpen={searchOpen} searchQuery={query} onSearchChange={setQuery} onSearchClose={()=>setSearchOpen(false)}/>
          <button id="open-quick-search" onClick={()=>setSearchOpen(true)}>Search this box</button>
          <button id="close-peek" onClick={peek.close}>Close panel</button>
          <div data-quick-peek-scroll-region style={{height:100,overflow:'auto'}}><div style={{height:800}}>Fixture results</div></div>
        </aside>;
      }
      function Fixture(){
        const peek=usePeek(boxes), search=useBoxSearch({shortId:'117',items});
        return <><GlobalStyles/><header style={{height:64,position:'sticky',top:0,zIndex:200,background:'#101923'}}>Fixture header <button data-box-finder-trigger id="open-box-search" onClick={search.toggle}>Search full box</button></header>
          <button id="box-trigger" onClick={e=>peek.openBox(box,e.currentTarget)}>Open box</button>
          <input id="primary-search" defaultValue="cable" onPointerDown={()=>peek.close()}/>
          <button id="other-control" onPointerDown={()=>peek.close()}>Another control</button>
          {peek.selectedBox?<PeekPanel peek={peek}/>:null}
          <BoxSearch mode={search.mode} shortId="117" query={search.query} onQueryChange={search.setQuery}
            sortMode={search.sortMode} onSortChange={search.setSortMode} sortDirection={search.sortDirection}
            onSortDirectionChange={search.setSortDirection} matchCount={search.matchCount} onMinimize={search.minimize}
            onClear={search.clear} onCommit={search.minimize}/>
          <output id="box-search-state" hidden>{JSON.stringify({mode:search.mode,query:search.query,sort:search.sortMode,count:search.matchCount})}</output>
          <div style={{height:2400}}/><button id="outside-result" style={{position:'fixed',bottom:12,left:12,zIndex:1}}>Outside result</button></>;
      }
      createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/operations']}><Fixture/></MemoryRouter>);
    ` },
    bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},logLevel:'silent',
  });
  const results=[];
  for (const engine of (process.env.UX_ENGINES || 'webkit,chromium').split(',')) {
    const browser=await playwright[engine].launch({headless:true});
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const network=[],errors=[];
    await context.route('**/*',r=>{network.push(r.request().url());return r.abort();});
    const page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
    const check=async(name,fn)=>{try{await fn();results.push({engine,name,status:'passed'});console.log(engine+' PASS '+name);}catch(e){results.push({engine,name,status:'failed',error:e.message}); const diagnostics=await page.evaluate(()=>{const x=document.querySelector('#outside-result'),r=x.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;return {rect:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight},hit:document.elementsFromPoint(cx,cy).slice(0,4).map(e=>e.outerHTML.slice(0,400))};}); console.log(JSON.stringify(diagnostics));await page.screenshot({path:path.join(evidence,'fixture-failure-'+engine+'.png')});throw e;}};
    try {
      await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>');
      await page.addScriptTag({content:outputFiles[0].text});
      await page.locator('#box-trigger').waitFor();
      await check('main search keeps focus and a middle caret throughout delayed close',async()=>{
        await page.locator('#box-trigger').tap();await page.locator('#operations-box-quick-peek').waitFor();
        await page.locator('#primary-search').tap();await page.locator('#primary-search').press('ArrowLeft');
        await page.locator('#primary-search').press('ArrowLeft');
        const before=await page.locator('#primary-search').evaluate(x=>[x.selectionStart,x.selectionEnd]);
        await page.evaluate(()=>{window.__focusLosses=0;document.querySelector('#primary-search').addEventListener('blur',()=>window.__focusLosses++);});
        await page.locator('#operations-box-quick-peek').waitFor({state:'hidden'});
        assert.equal(await page.evaluate(()=>window.__focusLosses),0);
        assert.equal(await page.evaluate(()=>document.activeElement.id),'primary-search');
        assert.deepEqual(await page.locator('#primary-search').evaluate(x=>[x.selectionStart,x.selectionEnd]),before);
      });
      await check('explicit Close restores the box trigger',async()=>{
        await page.locator('#box-trigger').tap();await page.locator('#close-peek').tap();
        await page.locator('#operations-box-quick-peek').waitFor({state:'hidden'});
        assert.equal(await page.evaluate(()=>document.activeElement.id),'box-trigger');
      });
      await check('closing never overrides another deliberately focused control',async()=>{
        await page.locator('#box-trigger').tap();await page.locator('#other-control').tap();await page.locator('#other-control').focus();
        await page.locator('#operations-box-quick-peek').waitFor({state:'hidden'});
        assert.equal(await page.evaluate(()=>document.activeElement.id),'other-control');
      });
      await check('touch selection events stay uncancelled under Quick Peek scroll lock',async()=>{
        await page.locator('#box-trigger').tap();await page.locator('#open-quick-search').tap();
        const input=page.locator('#operations-box-quick-peek input');
        await input.waitFor();
        const cancelled=await input.evaluate(x=>!x.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,cancelable:true})));
        assert.equal(cancelled,false);
        assert.equal(await input.evaluate(x=>{for(let p=x;p;p=p.parentElement)if(getComputedStyle(p).touchAction==='none')return false;return true;}),true,'no ancestor may disable native input touch gestures');
        assert.equal(await input.evaluate(x=>(getComputedStyle(x).userSelect||getComputedStyle(x).webkitUserSelect)),'text');
        await input.press('ArrowLeft');await input.pressSequentially('x');assert.equal(await input.inputValue(),'cablxe');
        await input.press('Meta+A');await input.press('Backspace');await input.pressSequentially('replacement');assert.equal(await input.inputValue(),'replacement');
        await page.locator('#close-peek').tap();await page.locator('#operations-box-quick-peek').waitFor({state:'hidden'});
      });
      await check('full-box search survives scroll and height changes with focus and node intact',async()=>{
        await page.locator('#open-box-search').tap();const input=page.locator('section[aria-label="Search box 117"] input');
        await input.pressSequentially('ca');await page.evaluate(()=>{window.__boxInput=document.activeElement;scrollBy(0,25)});
        await page.waitForTimeout(120);await page.setViewportSize({width:390,height:500});
        assert.equal(await input.inputValue(),'ca');
        assert.equal(await input.evaluate(x=>x===window.__boxInput&&x===document.activeElement),true);
        await page.setViewportSize({width:390,height:844});
      });
      await check('touch Clear retains focus, replacement works, and sort stays usable',async()=>{
        const input=page.locator('section[aria-label="Search box 117"] input');
        await page.getByRole('button',{name:'Clear',exact:true}).tap();await page.waitForFunction(()=>document.querySelector('section[aria-label="Search box 117"] input')?.value==='');
        assert.equal(await input.evaluate(x=>x===document.activeElement),true);
        await input.pressSequentially('no such item');assert.equal(await page.locator('#box-search-state').evaluate(x=>JSON.parse(x.textContent).count),0);
        await page.getByRole('button',{name:'Clear',exact:true}).tap();await input.pressSequentially('cable');
        await page.getByRole('combobox',{name:'Sort box search results'}).tap();await page.getByRole('option',{name:'Name',exact:true}).tap();
        assert.equal(await input.isVisible(),true);assert.equal(await page.locator('#box-search-state').evaluate(x=>JSON.parse(x.textContent).sort),'name');
      });
      await check('Escape, Enter, toggle and outside tap still dismiss search',async()=>{
        const input=page.locator('section[aria-label="Search box 117"] input');
        await input.press('Escape');await input.waitFor({state:'hidden'});
        await page.locator('#open-box-search').tap();assert.equal(await input.inputValue(),'cable');await input.press('Enter');await input.waitFor({state:'hidden'});
        await page.locator('#open-box-search').tap();await page.locator('#open-box-search').tap();await input.waitFor({state:'hidden'});
        await page.locator('#open-box-search').tap();await page.locator('#outside-result').tap();await input.waitFor({state:'hidden'});
      });
      await check('reduced-motion dismissal retains the main finder focus',async()=>{
        await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#box-trigger').tap();await page.locator('#primary-search').tap();
        await page.locator('#operations-box-quick-peek').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.activeElement.id),'primary-search');
      });
      assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
    } finally { await browser.close();fs.writeFileSync(path.join(evidence,'isolated-regression-results.json'),JSON.stringify({scope:'Isolated desktop engines. No actual iOS keyboard. No backend requests.',results},null,2)); }
  }
  console.log(results.length+' isolated UI regressions passed. No backend requests.');
})().catch(e=>{console.error(e);process.exitCode=1;});
