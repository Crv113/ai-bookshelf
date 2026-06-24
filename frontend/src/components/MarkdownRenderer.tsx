import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import type { Components } from 'react-markdown'
import MermaidDiagram from './MermaidDiagram'

interface MarkdownRendererProps {
  content: string
}

const components: Components = {
  code({ className, children }) {
    const lang = /language-(\w+)/.exec(className ?? '')?.[1]
    if (lang === 'mermaid') {
      return <MermaidDiagram chart={String(children).trim()} />
    }
    return <code className={className}>{children}</code>
  },
  table({ children }) {
    return (
      <div className="-mx-4 lg:mx-0 overflow-x-auto">
        <div className="px-4 lg:px-0 inline-block min-w-full">
          <table>{children}</table>
        </div>
      </div>
    )
  },
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-stone max-w-none px-4 py-4 lg:px-0 lg:py-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
