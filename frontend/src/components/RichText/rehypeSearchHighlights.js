import { getSearchTerms, splitSearchHighlights } from '../../util/searchHighlight';

// Highlight text nodes, not Markdown syntax, link destinations or raw HTML.
export default function rehypeSearchHighlights({ query = '' } = {}) {
  const terms = getSearchTerms(query);
  const visit = (node) => {
    if (!node.children) return;
    node.children = node.children.flatMap((child) => {
      if (child.type !== 'text') { visit(child); return [child]; }
      return splitSearchHighlights(child.value, terms).map(({ text, match }) => match
        ? { type: 'element', tagName: 'mark', properties: {}, children: [{ type: 'text', value: text }] }
        : { type: 'text', value: text });
    });
  };
  return (tree) => { if (terms.length) visit(tree); };
}
