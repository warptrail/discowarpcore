import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSearchHighlights from './rehypeSearchHighlights';
import { Content } from './MarkdownContent.styles';

const remarkPlugins = [remarkGfm];
const components = {
  a: ({ href, title, children }) => href
    ? <a href={href} title={title} target="_blank" rel="noopener noreferrer">{children}</a>
    : <span>{children}</span>,
  // Notes never silently download remote images or execute embedded HTML.
  img: ({ alt }) => <span className="note-image">[Image{alt ? `: ${alt}` : ''}]</span>,
  table: ({ children }) => <div className="note-table"><table>{children}</table></div>,
};

export default function MarkdownContent({ text, query = '' }) {
  return <Content>
    <Markdown remarkPlugins={remarkPlugins} rehypePlugins={[[rehypeSearchHighlights, { query }]]} components={components}>
      {String(text ?? '')}
    </Markdown>
  </Content>;
}
