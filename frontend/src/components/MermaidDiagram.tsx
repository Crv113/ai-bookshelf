import { useEffect, useRef, useId } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#E8D5B4',
    primaryTextColor: '#3B2A1A',
    primaryBorderColor: '#C4742A',
    lineColor: '#8B6340',
    secondaryColor: '#F5EDE8',
    tertiaryColor: '#F0EBE0',
    background: '#FAF7F2',
    mainBkg: '#E8D5B4',
    nodeBorder: '#C4742A',
    clusterBkg: '#F5EDE8',
    titleColor: '#3B2A1A',
    edgeLabelBackground: '#F5EDE8',
    actorBkg: '#E8D5B4',
    actorBorder: '#C4742A',
    actorTextColor: '#3B2A1A',
    actorLineColor: '#8B6340',
    signalColor: '#5C1B1B',
    signalTextColor: '#3B2A1A',
    labelBoxBkgColor: '#E8D5B4',
    labelBoxBorderColor: '#C4742A',
    labelTextColor: '#3B2A1A',
    loopTextColor: '#3B2A1A',
    noteBorderColor: '#C4742A',
    noteBkgColor: '#F5EDE8',
    noteTextColor: '#3B2A1A',
  },
})

interface MermaidDiagramProps {
  chart: string
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rawId = useId()
  const id = `mermaid-${rawId.replace(/:/g, '')}`

  useEffect(() => {
    if (!ref.current) return
    ref.current.removeAttribute('data-processed')
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg
      })
      .catch(() => {
        if (ref.current) {
          ref.current.innerHTML = `<pre style="font-size:12px;color:#6B5540">${chart}</pre>`
        }
      })
  }, [chart, id])

  return (
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto rounded-xl py-4"
      style={{ backgroundColor: '#FAF7F2' }}
    />
  )
}
