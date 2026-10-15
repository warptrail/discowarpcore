const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const { filterRetrievalBoxes } = require('../backend/services/retrievalService');
const frontend = path.resolve(__dirname, '../frontend');
const requireFrontend = createRequire(path.join(frontend, 'package.json'));
async function load(file) {
  const { outputFiles } = await requireFrontend('esbuild').build({
    entryPoints: [path.join(frontend, 'src', file)], bundle: true, write: false,
    format: 'cjs', platform: 'node', jsx: 'automatic', mainFields: ['module','main'],
    external: ['react','react-dom','react-router-dom','styled-components'], logLevel:'silent',
  });
  const module = { exports: {} };
  new Function('require','module','exports',outputFiles[0].text)(id => id === 'styled-components'
    ? Object.assign(requireFrontend(id).default,requireFrontend(id)) : requireFrontend(id),module,module.exports);
  return module.exports;
}

test('tag links canonicalize hashtags and encode spaces, slashes, commas and unicode as one tag', async () => {
  const { getTagHref, normalizeTagName } = await load('util/tagNavigation.js');
  assert.equal(getTagHref(' #Camping '), '/tag/camping');
  for (const tag of ['travel kit','usb/c','red,blue','café']) {
    assert.equal(decodeURIComponent(getTagHref(tag).slice(5)), tag);
  }
  assert.equal(normalizeTagName({value:' Portable '}),'portable');
  assert.equal(getTagHref(''),'/retrieval');
});

test('shared tags are individual links rather than editor buttons and deduplicate legacy case variants', async () => {
  const React=requireFrontend('react'), {renderToStaticMarkup}=requireFrontend('react-dom/server');
  const {MemoryRouter}=requireFrontend('react-router-dom');
  const {default: Tags}=await load('components/TagLinks.jsx');
  const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,
    React.createElement(Tags,{tags:['Camping','camping','usb/c']})));
  assert.equal((html.match(/href=/g)||[]).length,2);
  assert.match(html,/href="\/tag\/camping"/);
  assert.match(html,/#camping/);
  assert.match(html,/href="\/tag\/usb%2Fc"/);
  assert.ok(!html.includes('<button'));
});

test('tag-box mode matches the boxes own tags while ordinary Retrieval retains contained-item tag filtering', () => {
  const records=[
    {id:'own',tags:['camping'],tagKeys:['tools']},
    {id:'contents',tags:['storage'],tagKeys:['camping']},
    {id:'empty',tags:['Camping'],tagKeys:[]},
  ];
  const own=filterRetrievalBoxes(records,{tagFilters:['camping'],tagSource:'box'});
  assert.deepEqual(own.map(row=>row.id),['own','empty']);
  assert.deepEqual(filterRetrievalBoxes(records,{tagFilters:['camping']}).map(row=>row.id),['contents']);
  assert.deepEqual(filterRetrievalBoxes(records,{tagFilters:['cam'],tagSource:'box'}),[]);
});

test('Retrieval API preserves an exact punctuation-bearing tag and requests direct box tags explicitly', async () => {
  const api=await load('api/retrieval.js');
  const oldFetch=global.fetch;const urls=[];
  global.fetch=async url=>{urls.push(new URL(url,'http://fixture'));return {ok:true,json:async()=>({items:[],boxes:[]})};};
  try {
    await api.fetchRetrievalItemsPage({tags:['red,blue'],exactTag:'red,blue'});
    await api.fetchRetrievalBoxesPage({tags:['red,blue'],exactTag:'red,blue',tagSource:'box'});
    assert.equal(urls[0].searchParams.get('exactTag'),'red,blue');
    assert.equal(urls[1].searchParams.get('exactTag'),'red,blue');
    assert.equal(urls[1].searchParams.get('tagSource'),'box');
  } finally {global.fetch=oldFetch;}
});

test('tag return captures the exact URL, history entry, fixed-body scroll and expanded Operations peek', async () => {
  const {rememberTagSource, readTagSource, tagReturnDistance}=await load('util/tagReturnNavigation.js');
  const location={key:'origin',pathname:'/operations',search:'?missing=1&peek=043&item=abc',hash:'#operations-box-043',state:{draft:'keep'}};
  const source=rememberTagSource(location,{history:{state:{idx:8}},scrollY:0,
    document:{body:{style:{top:'-642px'}},querySelector:()=>({getAttribute:()=> 'true'})},
    sessionStorage:{setItem(){}}});
  assert.equal(source.url,'/operations?missing=1&peek=043&item=abc#operations-box-043');
  assert.equal(source.scrollY,642);assert.equal(source.peekExpanded,true);
  assert.deepEqual(source.state,{draft:'keep'});assert.deepEqual(readTagSource('origin'),source);
  assert.equal(tagReturnDistance(source,11),3);
  for(const index of [8,7,undefined]) assert.equal(tagReturnDistance(source,index),0);
  assert.equal(tagReturnDistance(null,10),0);
});

test('tag console has one dominant permalink and an origin-specific return link', async () => {
  const React=requireFrontend('react'),{renderToStaticMarkup}=requireFrontend('react-dom/server');
  const {MemoryRouter}=requireFrontend('react-router-dom');
  const {RetrievalConsoleControls}=await load('components/Retrieval/RetrievalConsoleControls.jsx');
  const html=renderToStaticMarkup(React.createElement(MemoryRouter,{initialEntries:[{pathname:'/tag/blanket',state:{tagReturn:{url:'/operations?peek=043#operations-box-043',index:2}}}]},
    React.createElement(RetrievalConsoleControls,{scope:{key:'blanket',label:'blanket'},shown:10,total:10})));
  assert.equal((html.match(/Tag: #blanket/g)||[]).length,1);
  assert.match(html,/href="\/tag\/blanket"/);
  assert.match(html,/href="\/operations\?peek=043#operations-box-043"/);
  assert.match(html,/Return to Operations/);
  assert.ok(!html.includes('Tag //'));
});

test('tag collection URLs round-trip arrays and operators without splitting comma-bearing tags', async () => {
  const {readTagCollection,getTagCollectionHref}=await load('util/tagCollection.js');
  const href=getTagCollectionHref(['Glass','pendant','red,blue','glass'],'and','?peek=keep');
  const url=new URL(href,'http://fixture');
  assert.equal(url.pathname,'/tag/glass');
  assert.deepEqual(url.searchParams.getAll('tag'),['pendant','red,blue']);
  assert.equal(url.searchParams.get('peek'),'keep');
  assert.deepEqual(readTagCollection('glass',url.search),{tags:['glass','pendant','red,blue'],operator:'and'});
  assert.equal(getTagCollectionHref([]),null);
  assert.deepEqual(readTagCollection('glass','?match=bogus'),{tags:['glass'],operator:'or'});
});

test('exact arrays preserve literal tags and AND/OR work for items and direct box tags', () => {
  const {normalizeExactTags,matchesTagFilters}=require('../backend/services/retrievalService');
  assert.deepEqual(normalizeExactTags(['Glass','red,blue','glass']),['glass','red,blue']);
  assert.equal(matchesTagFilters(['glass'],['glass','pendant'],'and'),false);
  assert.equal(matchesTagFilters(['glass'],['glass','pendant'],'or'),true);
  const records=[{id:'both',tags:['glass','pendant'],tagKeys:[]},{id:'one',tags:['glass'],tagKeys:[]}];
  assert.deepEqual(filterRetrievalBoxes(records,{tagSource:'box',tagFilters:['glass','pendant'],tagOperator:'and'}).map(r=>r.id),['both']);
  assert.deepEqual(filterRetrievalBoxes(records,{tagSource:'box',tagFilters:['glass','pendant'],tagOperator:'or'}).map(r=>r.id),['both','one']);
});

test('API encodes exact tag arrays as repeated parameters for both collections', async () => {
  const api=await load('api/retrieval.js'),oldFetch=global.fetch,urls=[];
  global.fetch=async url=>{urls.push(new URL(url,'http://fixture'));return {ok:true,json:async()=>({items:[],boxes:[]})};};
  try {
    await api.fetchRetrievalItemsPage({tags:['glass','red,blue'],exactTag:['glass','red,blue'],tagOperator:'and'});
    await api.fetchRetrievalBoxesPage({tags:['glass','red,blue'],exactTag:['glass','red,blue'],tagOperator:'or',tagSource:'box'});
    urls.forEach(url=>assert.deepEqual(url.searchParams.getAll('exactTag'),['glass','red,blue']));
    assert.equal(urls[0].searchParams.get('tagOperator'),'and');
    assert.equal(urls[1].searchParams.get('tagSource'),'box');
  } finally {global.fetch=oldFetch;}
});

test('box collection tag picker uses physical box tags while ordinary Retrieval keeps item-tag options', () => {
  const {collectBoxFilterOptions}=require('../backend/services/retrievalService');
  const fixture=[{tags:['box-only'],itemTags:['item-only']}];
  assert.deepEqual(collectBoxFilterOptions(fixture,[],'box').tags.map(t=>t.key),['box-only']);
  assert.deepEqual(collectBoxFilterOptions(fixture).tags.map(t=>t.key),['item-only']);
});

test('combined collection exposes its matching toggle and separate hashtag links with editor closed', async () => {
  const React=requireFrontend('react'),{renderToStaticMarkup}=requireFrontend('react-dom/server');
  const {MemoryRouter}=requireFrontend('react-router-dom');
  const {default:Bar}=await load('components/Retrieval/RetrievalTagScopeBar.jsx');
  const render=operator=>renderToStaticMarkup(React.createElement(MemoryRouter,null,
    React.createElement(Bar,{scope:{key:'glass',tags:['glass','pendant'],operator,onChange(){}}})));
  const html=render('and');
  assert.match(html,/href="\/tag\/glass"/);assert.match(html,/href="\/tag\/pendant"/);
  assert.match(html,/Match all tags \(AND\). Switch to OR./);assert.match(html,/aria-pressed="true"/);
  assert.ok(!html.includes('id="tag-collection-editor"'));
  assert.match(render('or'),/Match any tag \(OR\). Switch to AND./);
});

test('tag bubbles stay six pixels from their trigger and fit phone edges above or below', async () => {
  const {getTagBubblePlacement}=await load('components/Tags/tagBubblePlacement.js');
  const below=getTagBubblePlacement({top:120,bottom:148,right:80},100,{width:320,height:843});
  assert.equal(below.top,154);assert.equal(below.left,12);assert.equal(below.width,280);
  const above=getTagBubblePlacement({top:800,bottom:828,right:310},100,{width:320,height:843});
  assert.equal(above.top+100,794);assert.equal(above.left+above.width,308);
  const tall=getTagBubblePlacement({top:210,bottom:238,right:600},800,{width:678,height:759});
  assert.equal(tall.maxHeight,340);assert.ok(tall.top+tall.maxHeight<=747);
});

test('shared compact tag row carries physical-box colors and preserves all full tag links in its bubble', async () => {
  const React=requireFrontend('react'),{renderToStaticMarkup}=requireFrontend('react-dom/server');
  const {MemoryRouter}=requireFrontend('react-router-dom');
  const {default:Row}=await load('components/Tags/CompactTagRow.jsx');
  const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,
    React.createElement(Row,{tags:['blankets','soft things','plushies','wicker'],name:'Wicker Blanket Trunk',boxId:'100'})));
  assert.match(html,/--box-primary:#E8B15C/);
  assert.match(html,/popover="auto"/);assert.match(html,/All tags for Wicker Blanket Trunk/);
  for(const tag of ['blankets','soft%20things','plushies','wicker']) assert.match(html,new RegExp('href="/tag/'+tag+'"'));
});

test('Declutter review cards reuse the compact tag bubble without changing decision actions', async () => {
  const React=requireFrontend('react'),{renderToStaticMarkup}=requireFrontend('react-dom/server');
  const {MemoryRouter}=requireFrontend('react-router-dom');
  const {default:Card}=await load('components/Declutter/DeclutterReviewCard.jsx');
  let decisions=0;
  const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,
    React.createElement(Card,{sessionItem:{item:{_id:'fixture',name:'Fixture blanket',quantity:1,
      tags:['blanket','wicker','soft things','long tag name'],box:{box_id:'100',label:'Trunk'}}},onDecision(){decisions++;}})));
  assert.match(html,/--box-primary:#E8B15C/);
  assert.match(html,/All tags for Fixture blanket/);assert.match(html,/popover="auto"/);
  assert.match(html,/href="\/tag\/soft%20things"/);
  assert.equal(decisions,0);
});

test('popup return snapshots preserve item tab, popup scroll, focused tag and Declutter draft', async () => {
  const {rememberTagSource,getTagReturnSnapshot}=await load('util/tagReturnNavigation.js');
  const review={getAttribute:()=> 'candidate-2',querySelector:()=>({value:'Unsaved notes'})};
  const popup={getAttribute:()=> 'declutter:candidate-2',scrollTop:64,closest:()=>review};
  const location={key:'popup-origin',pathname:'/declutter',search:'?mode=deck',hash:'',state:null};
  const source=rememberTagSource(location,{history:{state:{idx:4}},scrollY:420,sessionStorage:{setItem(){}},
    document:{body:{style:{}},activeElement:{closest:()=>({getAttribute:()=>'/tag/wicker'})},querySelector:selector=>
      selector.includes('popover-open')?popup:selector.includes('item-page-section')?{getAttribute:()=> 'fields'}:null}});
  assert.equal(source.tagPopupKey,'declutter:candidate-2');assert.equal(source.tagPopupScrollTop,64);
  assert.equal(source.tagPopupFocusHref,'/tag/wicker');assert.equal(source.itemSection,'fields');
  assert.equal(source.declutterCandidateId,'candidate-2');assert.equal(source.declutterNotesDraft,'Unsaved notes');
  assert.equal(source.scrollY,420);assert.deepEqual(getTagReturnSnapshot(location,'POP'),source);
  assert.equal(getTagReturnSnapshot({...location,pathname:'/items/other'},'POP'),null);
  assert.deepEqual(getTagReturnSnapshot({...location,state:{tagRestore:source}},'PUSH'),source);
});

test('Declutter return restores the same pending card across queue reorder without pinning Skip or completed cards', async () => {
  const {selectReviewCandidate}=await load('components/Declutter/declutterTagReturn.js');
  const candidates=[{id:'first',needsMyVote:true},{id:'origin',needsMyVote:true}];
  assert.equal(selectReviewCandidate(candidates,'origin').id,'origin');
  assert.equal(selectReviewCandidate(candidates,'').id,'first');
  assert.equal(selectReviewCandidate([{id:'origin',needsMyVote:false},candidates[0]],'origin').id,'first');
});

test('Operations and box return captures the open item, browse settings and internal scroller', async () => {
  const {rememberTagSource}=await load('util/tagReturnNavigation.js');
  const parent={id:'quick-peek-view',scrollTop:146,getAttribute:()=> 'operations-peek-content',parentElement:null};
  const popup={getAttribute:()=> 'item-tags',scrollTop:12,parentElement:parent};
  const browse={boxId:'100',openItemId:'item-2',treeViewMode:'condensed',search:{query:'blanket',sortMode:'name',sortDirection:'desc',mode:'expanded'}};
  const location={key:'box-return',pathname:'/boxes/100',search:'?tab=tree&compartment=A',hash:'',state:null};
  const source=rememberTagSource(location,{scrollY:260,history:{state:{idx:2}},sessionStorage:{setItem(){}},document:{body:{style:{}},querySelector:selector=>
    selector.includes('popover-open')?popup:selector.includes('box-browse-state')?{getAttribute:()=>JSON.stringify(browse)}:null}});
  assert.deepEqual(source.boxBrowseState,browse);
  assert.deepEqual(source.scrollContainers,[{key:'operations-peek-content',top:146}]);
  assert.equal(source.url,'/boxes/100?tab=tree&compartment=A');assert.equal(source.scrollY,260);
});

test('adding tags, switching AND/OR and promoting a tag preserve the original snapshot and a single Back step', async () => {
  const {getTagCollectionNavigation}=await load('util/tagCollection.js');
  const {createMemoryRouter}=requireFrontend('react-router-dom');
  const source={key:'original',url:'/operations?peek=001&item=item-2#operations-box-001',index:0,
    scrollY:412,peekExpanded:true,tagPopupKey:'operations-item:item-2',scrollContainers:[{key:'operations-peek-item',top:88}],tagPopupScrollTop:32};
  const router=createMemoryRouter([{path:'*',element:null}],{initialEntries:[
    {pathname:'/operations',search:'?peek=001&item=item-2',hash:'#operations-box-001',key:'original'},
    {pathname:'/tag/glass',state:{tagReturn:source,custom:'keep'}}],initialIndex:1});
  try {
    for(const [tags,operator] of [[['glass','pendant'],'or'],[['glass','pendant'],'and'],[['pendant','toy'],'or']]) {
      const change=getTagCollectionNavigation(tags,operator,router.state.location);
      assert.equal(change.options.replace,true);
      await router.navigate(change.to,change.options);
      assert.deepEqual(router.state.location.state.tagReturn,source);
      assert.equal(router.state.location.state.custom,'keep');
    }
    assert.equal(router.state.location.pathname,'/tag/pendant');
    await router.navigate(-1);
    const location=router.state.location;
    assert.equal(location.pathname+location.search+location.hash,source.url);
    assert.equal(location.key,'original');
  } finally {router.dispose();}
});

test('collection edits also preserve item-page and box-page return snapshots', async () => {
  const {getTagCollectionNavigation}=await load('util/tagCollection.js');
  const {createMemoryRouter}=requireFrontend('react-router-dom');
  for (const url of ['/items/item-1?view=fields','/boxes/100?tab=tree&compartment=A']) {
    const parsed=new URL(url,'http://fixture');
    const source={key:'origin',url,index:0,scrollY:831,tagPopupKey:'same-popup',
      itemSection:'fields',boxBrowseState:{boxId:'100',openItemId:'item-1'}};
    const router=createMemoryRouter([{path:'*',element:null}],{initialEntries:[
      {pathname:parsed.pathname,search:parsed.search,key:'origin'},
      {pathname:'/tag/glass',state:{tagReturn:source}}],initialIndex:1});
    try {
      for(const operator of ['and','or']) {
        const change=getTagCollectionNavigation(['glass','pendant','toy'],operator,router.state.location);
        await router.navigate(change.to,change.options);
        assert.deepEqual(router.state.location.state.tagReturn,source);
      }
      await router.navigate(-1);
      assert.equal(router.state.location.pathname+router.state.location.search,url);
      assert.equal(router.state.location.key,'origin');
    } finally {router.dispose();}
  }
});

test('a fresh JavaScript session recovers the complete original popup snapshot after a tag-page reload', async () => {
  const storage=new Map();
  const {rememberTagSource}=await load('util/tagReturnNavigation.js');
  const location={key:'reload-origin',pathname:'/operations',search:'?peek=001&item=item-2',hash:'#operations-box-001',state:{entry:'keep'}};
  const popup={getAttribute:()=> 'operations-item:item-2',scrollTop:17};
  const browser={history:{state:{idx:3}},scrollY:413,sessionStorage:{setItem:(key,value)=>storage.set(key,value),getItem:key=>storage.get(key)},
    document:{body:{style:{}},activeElement:{closest:()=>({getAttribute:()=>'/tag/electronic'})},querySelector:selector=>
      selector.includes('popover-open')?popup:selector.includes('peek-expanded')?{getAttribute:()=> 'true'}:null}};
  const saved=rememberTagSource(location,browser);
  const cold=await load('util/tagReturnNavigation.js');
  assert.deepEqual(cold.readTagSource(location.key,browser),JSON.parse(JSON.stringify(saved)));
  const restored=cold.readTagSource(location.key,browser);
  assert.equal(restored.url,location.pathname+location.search+location.hash);
  assert.equal(restored.scrollY,413);assert.equal(restored.peekExpanded,true);
  assert.equal(restored.tagPopupKey,'operations-item:item-2');assert.equal(restored.tagPopupScrollTop,17);
  assert.equal(restored.tagPopupFocusHref,'/tag/electronic');assert.equal(cold.tagReturnDistance(restored,4),1);
});
