import { Fragment, useCallback, useEffect } from 'react';
import OperationsTreeInspector from './OperationsTreeInspector';
import { getNestedToggleId, getNestedTrayId, getTreeNodeKey } from './operationsTreeLayout';

export default function OperationsDesktopTree({ nodes, inspectorTarget, occupied, onInspect, onEditBoxField, onShowTree, expandedKeys, isSearchExpanded, onToggle, renderBox, consoleState, setConsoleState }) {
  const { activeKey, dismissed } = consoleState;
  const roots = nodes.filter((node) => node.childBoxes?.length &&
    (expandedKeys.has(getTreeNodeKey(node)) || isSearchExpanded(node)));
  const activeRoot = roots.find((node) => getTreeNodeKey(node) === activeKey) || roots[0];
  useEffect(() => {
    const match = nodes.find(isSearchExpanded);
    if (match) setConsoleState({ dismissed: false, activeKey: getTreeNodeKey(match) });
  }, [isSearchExpanded, nodes, setConsoleState]);
  const open = !dismissed && Boolean(activeRoot);
  const activate = (node) => {
    onShowTree();
    setConsoleState({ activeKey: getTreeNodeKey(node), dismissed: false });
    if (!expandedKeys.has(getTreeNodeKey(node))) onToggle(node);
  };
  const close = useCallback(() => {
    setConsoleState((current) => ({ ...current, dismissed: true }));
    document.getElementById(getNestedToggleId(activeRoot))?.focus({ preventScroll: true });
  }, [activeRoot, setConsoleState]);
  return (
    <>
      {nodes.map((node) => <Fragment key={`box-${getTreeNodeKey(node)}`}>
        {renderBox(node, {
          depth: 0, expanded: open && !occupied && getTreeNodeKey(node) === getTreeNodeKey(activeRoot),
          searchExpanded: false, presentation: 'inspector',
          trayId: getNestedTrayId(node), toggleId: getNestedToggleId(node),
          onToggle: () => {
            if (open && !occupied && getTreeNodeKey(node) === getTreeNodeKey(activeRoot)) close();
            else activate(node);
          },
        })}
      </Fragment>)}
      <OperationsTreeInspector target={inspectorTarget} occupied={occupied} onInspect={onInspect} onEditBoxField={onEditBoxField} open={open} roots={roots} activeRoot={activeRoot}
        onActivate={activate} onClose={close} expandedKeys={expandedKeys}
        isSearchExpanded={isSearchExpanded} onToggle={onToggle} />
    </>
  );
}
