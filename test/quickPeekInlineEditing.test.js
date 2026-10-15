const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {createRequire}=require('node:module');
const frontend=path.resolve(__dirname,'../frontend'),req=createRequire(path.join(frontend,'package.json'));
const React=req('react');
async function load(file,hooks=React) {
  const {outputFiles}=await req('esbuild').build({entryPoints:[path.join(frontend,'src',file)],bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',mainFields:['module','main'],external:['react','react-dom','react-router-dom','styled-components'],logLevel:'silent'});
  const module={exports:{}};
  new Function('require','module','exports',outputFiles[0].text)(id=>id==='react'?hooks:id==='styled-components'?Object.assign(req(id).default,req(id)):req(id),module,module.exports);
  return module.exports;
}
function harness(toasts) {
  const slots=[];let cursor=0;
  const hooks={...React,useContext:()=>({showToast:t=>toasts.push(t)}),useEffect(){},useId:()=> 'fixture-tags',
    useRef:value=>{const i=cursor++;return slots[i] ||= {current:value};},
    useState:value=>{const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];}};
  return{hooks,render(Component,props){cursor=0;return Component(props);}};
}
function find(element,label) {
  if(!element||typeof element!=='object')return null;
  if(element.props?.['aria-label']===label)return element;
  for(const child of React.Children.toArray(element.props?.children)){const match=find(child,label);if(match)return match;}
  return null;
}

test('Quick Peek tag model deduplicates hashtags and preserves literal comma tags',async()=>{
  const {addQuickPeekTag,removeQuickPeekTag,quickPeekTagRows}=await load('components/OperationsQuickPeek/quickPeekTagModel.js');
  assert.equal(addQuickPeekTag(['Pokemon'],'#POKEMON'),null);
  assert.deepEqual(addQuickPeekTag(['pokemon'],' red,blue '),['pokemon','red,blue']);
  assert.deepEqual(removeQuickPeekTag(['Pokemon','toy'],'pokemon'),['toy']);
  assert.equal(quickPeekTagRows('Short description'),2);assert.equal(quickPeekTagRows('x'.repeat(161)),1);
});

test('inline tag add/remove saves arrays, leaves inventory quantity/home alone, and handles failure without losing input',async()=>{
  const toasts=[],runtime=harness(toasts),{default:Component}=await load('components/OperationsQuickPeek/QuickPeekItemTags.jsx',runtime.hooks);
  let item={_id:'fixture',name:'Toy',tags:['pokemon'],quantity:1,boxNumber:'001'};
  const writes=[],oldFetch=global.fetch;
  global.fetch=async(url,options)=>{assert.equal(options.method,'PATCH');writes.push(JSON.parse(options.body));return{ok:true,json:async()=>({data:{...item,...writes.at(-1)}})};};
  const props=()=>({item,tags:item.tags,name:item.name,description:'Short',onSaved:updated=>{item=updated;}});
  try {
    let view=runtime.render(Component,props());
    find(view,'Add item tag').props.onChange({target:{value:'red,blue'}});
    view=runtime.render(Component,props());await find(view,'Add tag').props.onClick();
    assert.deepEqual(writes,[{tags:['pokemon','red,blue']}]);assert.equal(item.quantity,1);assert.equal(item.boxNumber,'001');
    view=runtime.render(Component,props());find(view,'Toggle tag removal').props.onClick();
    view=runtime.render(Component,props());await view.props.children[0].props.onRemove('pokemon');
    assert.deepEqual(writes.at(-1),{tags:['red,blue']});assert.ok(toasts.some(t=>t.message==='Tag removed.'));
    global.fetch=async()=>({ok:false,status:500,text:async()=> 'fixture failure'});
    view=runtime.render(Component,props());find(view,'Add item tag').props.onChange({target:{value:'new-tag'}});
    view=runtime.render(Component,props());await find(view,'Add tag').props.onClick();
    view=runtime.render(Component,props());assert.equal(find(view,'Add item tag').props.value,'new-tag');
    assert.deepEqual(item.tags,['red,blue']);assert.equal(toasts.at(-1).timeoutMs,0);
  } finally {global.fetch=oldFetch;}
});

test('tag autocomplete Enter is left to native selection; submitting saves the selected value',async()=>{
  const runtime=harness([]),{default:Component}=await load('components/OperationsQuickPeek/QuickPeekItemTags.jsx',runtime.hooks);
  const oldFetch=global.fetch,writes=[];
  global.fetch=async(url,options)=>{writes.push(JSON.parse(options.body));return{ok:true,json:async()=>({data:{_id:'fixture',tags:writes.at(-1).tags}})};};
  try {
    const view=runtime.render(Component,{item:{_id:'fixture'},tags:['pokemon'],name:'Toy'});
    let prevented=false;
    find(view,'Add item tag').props.onKeyDown({key:'Enter',nativeEvent:{isComposing:false},preventDefault(){prevented=true;},stopPropagation(){}});
    assert.equal(prevented,false);assert.equal(writes.length,0);
    await view.props.children[1].props.onSubmit({preventDefault(){},currentTarget:{querySelector:()=>({value:'handheld'})}});
    assert.deepEqual(writes,[{tags:['pokemon','handheld']}]);
  } finally {global.fetch=oldFetch;}
});
