// Actual touch pointer sequence in desktop Chromium mobile emulation; no iOS keyboard.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/zephyr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const blocked=[];await context.route('**/*',r=>{const q=r.request(),u=new URL(q.url());if(!['GET','HEAD'].includes(q.method())||!['127.0.0.1','localhost'].includes(u.hostname)){blocked.push({method:q.method(),path:u.pathname});return r.abort()}return r.continue()});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:7611/operations?q=cable&peek=117');
 await page.locator('#operations-box-quick-peek').waitFor();await page.waitForTimeout(1000);
 await page.getByRole('button',{name:'Expand box quick peek',exact:true}).tap();await page.waitForTimeout(350);
 const expanded=await page.evaluate(()=>({expanded:document.querySelector('#operations-box-quick-peek').dataset.peekExpanded,body:document.body.style.position}));
 assert.equal(expanded.expanded,'true');assert.equal(expanded.body,'fixed');
 await page.getByRole('button',{name:'Collapse box quick peek',exact:true}).tap();await page.waitForTimeout(900);
 const collapsed=await page.evaluate(()=>({expanded:document.querySelector('#operations-box-quick-peek').dataset.peekExpanded,body:document.body.style.position}));
 assert.equal(collapsed.expanded,'false');assert.equal(collapsed.body,'');
 await page.getByRole('button',{name:'Toggle Quick Peek item search',exact:true}).tap();
 const input=page.locator('#operations-box-quick-peek input[type="search"]');await input.waitFor();await input.pressSequentially('cable');await page.waitForTimeout(300);
 const sample=()=>page.evaluate(()=>{const input=document.querySelector('#operations-box-quick-peek input[type="search"]'),region=document.querySelector('[data-quick-peek-scroll-region]');return{y:scrollY,active:document.activeElement===input,fontSize:getComputedStyle(input).fontSize,value:input.value,selection:[input.selectionStart,input.selectionEnd],touchAction:getComputedStyle(input.parentElement).touchAction,ancestorTouchActions:(()=>{const values=[];for(let p=input;p;p=p.parentElement)values.push(getComputedStyle(p).touchAction);return values;})(),region:{top:region.scrollTop,height:region.clientHeight,total:region.scrollHeight},viewport:{height:innerHeight,vvHeight:visualViewport.height,offsetTop:visualViewport.offsetTop,scale:visualViewport.scale}}});
 await page.evaluate(()=>{window.__touch=[];for(const type of ['pointerdown','pointermove','pointerup','gotpointercapture','lostpointercapture'])document.addEventListener(type,e=>{if(!e.target.closest?.('[role="search"]'))return;setTimeout(()=>window.__touch.push({type,pointerType:e.pointerType,target:e.target.tagName,defaultPrevented:e.defaultPrevented,regionTop:document.querySelector('[data-quick-peek-scroll-region]').scrollTop}),0)},true)});
 const box=await input.boundingBox(),before=await sample(),client=await context.newCDPSession(page);
 const x=box.x+55,y=box.y+box.height/2;
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
 for(let i=1;i<=5;i++){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*10,id:1}]});await page.waitForTimeout(40)}
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);
 const after=await sample(),touch=await page.evaluate(()=>window.__touch);
 await page.screenshot({path:path.join(__dirname,'06-quick-peek-input-touch-drag.png')});
 // A swipe in the results should scroll only the inner region.
 const region=await page.locator('[data-quick-peek-scroll-region]').boundingBox();
 const resultsBefore=await sample(),rx=region.x+region.width/2,ry=Math.min(780,region.y+region.height-25);
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rx,y:ry,id:2}]});
 for(let i=1;i<=5;i++){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rx,y:ry-i*20,id:2}]});await page.waitForTimeout(50)}
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(250);
 const resultsAfter=await sample();
 await page.getByRole('button',{name:'Close Quick Peek item search',exact:true}).tap();
 await page.getByRole('button',{name:'Open full box',exact:true}).tap();await page.waitForURL('**/boxes/117');await page.waitForTimeout(500);
 const fullBox={path:new URL(page.url()).pathname};
 await page.locator('[data-box-finder-trigger]').tap();const boxInput=page.locator('section[aria-label^="Search box"] input');await boxInput.pressSequentially('a');
 const boxBefore=await page.evaluate(()=>scrollY);
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:730,id:3}]});
 for(let i=1;i<=6;i++){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:730-i*20,id:3}]});await page.waitForTimeout(50)}
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);
 const fullBoxSwipe=await boxInput.evaluate(x=>({visible:!!x.getClientRects().length,focused:document.activeElement===x,value:x.value,y:scrollY}));
 assert.equal(fullBoxSwipe.visible,true);assert.equal(fullBoxSwipe.focused,true);assert.equal(fullBoxSwipe.value,'a');assert.ok(fullBoxSwipe.y>boxBefore);
 await page.screenshot({path:path.join(__dirname,'07-full-box-after-touch-swipe.png')});
 await page.goBack();await page.locator('#operations-main-search').waitFor();await page.waitForTimeout(1000);
 const returned=await page.evaluate(()=>({path:location.pathname,search:location.search,query:document.querySelector('#operations-main-search').value,peek:!!document.querySelector('#operations-box-quick-peek')}));
 assert.equal(after.region.top,before.region.top,'input-origin drags must not scroll results');
 assert.equal(after.y,before.y,'an input-origin vertical drag must not pan the background');
 assert.equal(touch.some(e=>e.defaultPrevented),false,'native editing pointer moves must not be cancelled');
 assert.notEqual(after.touchAction,'none'); assert.equal(after.ancestorTouchActions.includes('none'),false); assert.ok(resultsAfter.region.top>resultsBefore.region.top,'results still support touch scrolling');
 assert.equal(returned.query,'cable'); assert.equal(returned.peek,true); assert.deepEqual(blocked,[]);assert.deepEqual(errors,[]);
 const out={status:'passed',testedAt:new Date().toISOString(),engine:'Desktop Chromium '+browser.version()+' touch emulation; NO iOS keyboard',before,after,touch,resultsSwipe:{before:resultsBefore,after:resultsAfter},panelTransitions:{expanded,collapsed},navigation:{fullBox,fullBoxSwipe,returned},blocked,errors};
 fs.writeFileSync(path.join(__dirname,'touch-drag-results.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
