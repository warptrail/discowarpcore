/* Read-only Space Boxes UX tests. Existing desktop WebKit only: no iOS OSK.
 * Run: node docs/ux/2026-10-19-space-boxes-iphone/run-ux-checks.cjs
 * Override PLAYWRIGHT_MODULE if the installed package lives elsewhere.
 * Network guard blocks all non-GET/HEAD and non-local requests.
 */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const { webkit } = require(process.env.PLAYWRIGHT_MODULE || '/Users/zephyr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
 const browser=await webkit.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const blocked=[], errors=[], results=[]; let page;
 await context.route('**/*', route=>{
  const req=route.request(), url=new URL(req.url());
  if (!['GET','HEAD'].includes(req.method()) || !['127.0.0.1','localhost'].includes(url.hostname)) {
   blocked.push({method:req.method(),path:url.pathname}); return route.abort();
  }
  return route.continue();
 });
 await context.addInitScript(()=>{
  window.__uxEvents=[];
  const id=x=>x?.id || x?.getAttribute?.('aria-label')?.replace(/(?:box|for) .*/,'[inventory control]') || x?.tagName;
  const log=(type,extra={})=>{if(window.__uxEvents.length<3500)window.__uxEvents.push({t:Math.round(performance.now()),type,y:scrollY,active:id(document.activeElement),...extra});};
  const orig=window.scrollTo; window.scrollTo=function(...args){log('scrollTo',{args,stack:new Error().stack?.split('\n').slice(1,5)});return orig.apply(this,args);};
  const focus=HTMLElement.prototype.focus; HTMLElement.prototype.focus=function(...args){log('focus-call',{target:id(this),stack:new Error().stack?.split('\n').slice(1,5)}); return focus.apply(this,args);};
  for(const event of ['focusin','focusout','input','pointerdown','pointermove','pointerup']) document.addEventListener(event,e=>{
   if(event.startsWith('pointer')&&!e.target.closest?.('input,[role="search"]'))return;
   log(event,{target:id(e.target),pointerType:e.pointerType,defaultPrevented:e.defaultPrevented});
  },true);
  window.addEventListener('scroll',()=>log('scroll'),{passive:true});
  for(const event of ['resize','scroll'])visualViewport?.addEventListener(event,()=>log('visualViewport-'+event,{height:visualViewport.height,offsetTop:visualViewport.offsetTop,scale:visualViewport.scale}));
 });
 page=await context.newPage(); page.setDefaultTimeout(8000);
 page.on('pageerror',e=>errors.push(e.message));
 const wait=ms=>page.waitForTimeout(ms);
 const state=()=>page.evaluate(()=>{
  const rect=x=>{const r=x?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,height:r.height,width:r.width}:null};
  const input=document.querySelector('#operations-main-search,#retrieval-main-search,section[aria-label^="Search box"] input');
  const quick=document.querySelector('#operations-box-quick-peek');
  return {path:location.pathname,search:location.search,y:scrollY,height:document.documentElement.scrollHeight,viewport:{width:innerWidth,height:innerHeight,vvHeight:visualViewport?.height,vvTop:visualViewport?.offsetTop,scale:visualViewport?.scale},active:document.activeElement?.id||document.activeElement?.tagName,input:input?{id:input.id,value:input.value,selection:[input.selectionStart,input.selectionEnd],fontSize:getComputedStyle(input).fontSize,rect:rect(input)}:null,header:rect(document.querySelector('#root header')),quick:rect(quick),quickSearch:!!quick?.querySelector('input[type="search"]'),boxSearch:!!document.querySelector('section[aria-label^="Search box"]'),bodyPosition:document.body.style.position,bodyOverflow:document.body.style.overflow,results:document.querySelectorAll('[data-operations-box-preview-trigger],[data-retrieval-box-result],[aria-label^="Open item panel for"]').length};
 });
 const run=async(name,fn)=>{try{const details=await fn();results.push({name,status:'passed',details}); console.log(name+': passed');}catch(e){results.push({name,status:'failed',error:e.message.slice(0,900),state:await state().catch(()=>null)}); console.log(name+': FAILED '+e.message.slice(0,160));}};
 const events=()=>page.evaluate(()=>window.__uxEvents.splice(0));
 const screenshot=name=>page.screenshot({path:path.join(__dirname,name+'.png')});
 const search=()=>page.locator('#operations-main-search');
 let boxId;
 await page.goto('http://127.0.0.1:7611/operations'); await search().waitFor({state:'visible'}); await wait(1000);
 await run('operations-type-edit-clear-replace',async()=>{
  await page.evaluate(()=>{window.__originalSearch=document.querySelector('#operations-main-search');});
  await search().tap(); await search().pressSequentially('cable',{delay:100}); await wait(400); const typed=await state();
  await search().press('ArrowLeft'); await search().press('ArrowLeft'); await search().press('ArrowLeft'); await search().pressSequentially('x'); const middleEdit=await state();
  await search().press('Meta+A'); await search().press('Backspace'); const cleared=await state();
  await search().pressSequentially('cable',{delay:80}); await wait(400); const replaced=await state();
  const sameNode=await page.evaluate(()=>window.__originalSearch===document.querySelector('#operations-main-search'));
  assert.equal(typed.input.value,'cable'); assert.equal(middleEdit.input.value,'caxble'); assert.equal(cleared.input.value,'');
  assert.equal(replaced.input.value,'cable'); assert.equal(replaced.active,'operations-main-search'); assert.equal(sameNode,true);
  return {typed,middleEdit,cleared,replaced,sameNode,events:await events()};
 });
 await run('operations-scroll-results-with-input-focused',async()=>{
  const before=await state(); await page.evaluate(()=>window.scrollBy(0,280)); await wait(500); const down=await state();
  await page.evaluate(()=>window.scrollBy(0,-280)); await wait(500); const up=await state(); assert.equal(down.active,'operations-main-search'); assert.equal(up.input.value,'cable'); return {before,down,up,events:await events()};
 });
 await run('operations-open-box-then-retap-primary-search',async()=>{
  const card=page.locator('[data-operations-box-preview-trigger]').first(); boxId=await card.getAttribute('data-box-address');
  await card.tap({position:{x:190,y:24}}); await page.locator('#operations-box-quick-peek').waitFor(); await wait(950);
  const opened=await state(); await screenshot('01-operations-quick-peek'); await events();
  await search().tap(); const immediate=await state(); await wait(850); const settled=await state();
  const focusEvents=await events();
  assert.equal(settled.active,'operations-main-search'); assert.equal(settled.quick,null);
  assert.equal(focusEvents.filter(x=>x.type==='focusout'&&x.target==='operations-main-search').length,0,'closing Quick Peek must not steal main-search focus');
  return {boxId,opened,immediate,settled,events:focusEvents};
 });
 await run('quick-peek-search-edit-scroll-close-and-back',async()=>{
  const card=page.locator('[data-operations-box-preview-trigger]').first(); await card.tap({position:{x:190,y:24}}); await page.locator('#operations-box-quick-peek').waitFor(); await wait(850);
  const controls=await page.locator('header button').evaluateAll(xs=>xs.map(x=>({id:x.id,label:x.getAttribute('aria-label')})).filter(x=>x.id||/search|finder/i.test(x.label)));
  // The header's existing button routes search into the open Quick Peek.
  await page.getByRole('button',{name:'Toggle Quick Peek item search',exact:true}).tap();
  const quickInput=page.locator('#operations-box-quick-peek input[type="search"]'); await quickInput.waitFor(); await quickInput.pressSequentially('a');
  await wait(400); const searchOpened=await state();
  await quickInput.press('ArrowLeft'); await quickInput.pressSequentially('c'); const edited=await quickInput.inputValue();
  await quickInput.press('Meta+A'); await quickInput.press('Backspace'); await quickInput.pressSequentially('a');
  const scroll=page.locator('[data-quick-peek-scroll-region]'); const beforeScroll=await scroll.evaluate(x=>({top:x.scrollTop,height:x.clientHeight,total:x.scrollHeight}));
  await scroll.evaluate(x=>x.scrollTop+=100); const afterScroll=await scroll.evaluate(x=>({top:x.scrollTop,height:x.clientHeight,total:x.scrollHeight}));
  await screenshot('02-quick-peek-search');
  await page.getByRole('button',{name:'Close Quick Peek item search',exact:true}).tap(); const searchClosed=await state();
  await page.goBack(); await wait(400); const afterBack=await state(); assert.equal(edited,'ca'); assert.equal(searchClosed.quickSearch,false); assert.equal(afterBack.quick,null); assert.equal(afterBack.input.value,'cable');
  assert.ok(afterScroll.top>beforeScroll.top); return {controls,searchOpened,edited,beforeScroll,afterScroll,searchClosed,afterBack,events:await events()};
 });
 await run('full-box-search-scroll-and-clear',async()=>{
  await page.goto('http://127.0.0.1:7611/boxes/'+(boxId||'001')); await page.locator('[data-box-finder-trigger]').waitFor(); await wait(500);
  await page.locator('[data-box-finder-trigger]').tap(); const input=page.locator('section[aria-label^="Search box"] input'); await input.waitFor();
  await input.pressSequentially('a'); await wait(250); const typed=await state();
  await input.press('ArrowLeft'); await input.pressSequentially('c'); const edit=await state();
  await input.press('Meta+A'); await input.press('Backspace'); await input.pressSequentially('a');
  await screenshot('03-full-box-search-before-scroll');
  // Deliberately move the page by 25px, modelling a browser/page scroll event, not an iOS keyboard.
  const before=await state(); await page.evaluate(()=>scrollBy(0,25)); await wait(350); const after=await state(); await screenshot('04-full-box-search-after-scroll');
  assert.equal(after.boxSearch,true,'a 25px page scroll must keep the box search open'); assert.equal(after.active,'INPUT'); assert.equal(after.input.value,'a');
  await page.getByRole('button',{name:'Clear',exact:true}).tap(); const afterClear=await state();
  assert.equal(afterClear.boxSearch,true); assert.equal(afterClear.input.value,''); assert.equal(afterClear.active,'INPUT');
  await input.pressSequentially('cable'); const replacement=await state(); assert.equal(replacement.input.value,'cable');
  return {typed,edit,before,after,afterClear,replacement,events:await events()};
 });
 await run('retrieval-type-edit-clear-replace-scroll',async()=>{
  await page.goto('http://127.0.0.1:7611/retrieval'); const input=page.locator('#retrieval-main-search');
  if(!await input.isVisible())await page.locator('#retrieval-finder-toggle').tap(); await input.waitFor(); await wait(900);
  await page.evaluate(()=>window.__originalSearch=document.querySelector('#retrieval-main-search'));
  await input.tap(); await input.pressSequentially('cable',{delay:80}); await wait(500); const typed=await state();
  await input.press('ArrowLeft'); await input.press('ArrowLeft'); await input.press('ArrowLeft'); await input.pressSequentially('x'); const edit=await state();
  await input.press('Meta+A'); await input.press('Backspace'); const cleared=await state(); await input.pressSequentially('cable'); await wait(500); const replaced=await state();
  const sameNode=await page.evaluate(()=>window.__originalSearch===document.querySelector('#retrieval-main-search'));
  await page.evaluate(()=>scrollBy(0,260));await wait(450); const scrolled=await state(); await screenshot('05-retrieval-search-scrolled');
  assert.equal(edit.input.value,'caxble'); assert.equal(cleared.input.value,''); assert.equal(replaced.input.value,'cable'); assert.equal(sameNode,true); assert.equal(scrolled.active,'retrieval-main-search');
  return {typed,edit,cleared,replaced,sameNode,scrolled,events:await events()};
 });
 await run('retrieval-open-close-item-panel',async()=>{
  const trigger=page.locator('[aria-label^="Open item panel for"]').first(); await trigger.tap();await page.locator('[role="dialog"][aria-modal="true"]').waitFor();await wait(500);
  const opened=await state(); const dialog=page.locator('[role="dialog"][aria-modal="true"]').last();
  const close=dialog.locator('button[aria-label*="Close"]').first(); await close.tap(); await dialog.waitFor({state:'hidden'});await wait(250);
  const closed=await state(); assert.equal(closed.bodyOverflow,''); assert.equal(closed.input.value,'cable'); return {opened,closed,events:await events()};
 });
 await run('desktop-height-resize-with-search-focused-no-ios-keyboard',async()=>{
  if(!await page.locator('#retrieval-main-search').isVisible()) await page.locator('#retrieval-finder-toggle').tap();
  await page.locator('#retrieval-main-search').tap();const before=await state();await page.setViewportSize({width:390,height:500});await wait(400);const shorter=await state();
  await page.setViewportSize({width:390,height:844});await wait(400);const restored=await state(); assert.equal(shorter.active,'retrieval-main-search'); assert.equal(restored.active,'retrieval-main-search'); assert.deepEqual(restored.input.selection,before.input.selection);return{before,shorter,restored,events:await events()};
 });
 const report={testedAt:new Date().toISOString(),engine:'Playwright desktop WebKit '+browser.version(),scope:'390x844 / 390x500 mobile viewport + touch emulation. NO iOS software keyboard.',results,errors,blocked};
 fs.writeFileSync(path.join(__dirname,'runtime-results.json'),JSON.stringify(report,null,2));
 await browser.close(); console.log(JSON.stringify({passed:results.filter(x=>x.status==='passed').length,total:results.length,errors,blocked}));
 if(results.some(x=>x.status==='failed')||errors.length||blocked.length) process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
