import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
// import { assignArray } from '../utils'
import { LineChart, XAxis, YAxis, Line, Tooltip, CartesianGrid, Legend } from 'recharts'
import LazyLoad from 'react-lazyload'
import produce from 'immer'

type Progresses = ReadonlyArray<
  Readonly<{
    variant: number | string
    metrics: ReadonlyArray<
      Readonly<{
        name: string
        values: ReadonlyArray<Readonly<{ epoch: number; [key: string]: number }>>
      }>
    >
    numEpochs: number | undefined
  }>
>

interface ProgressMessage {
  variant: number | string
  metrics: string
  value: number | { [key: string]: number }
  epoch: number
  n_epochs?: number
}

type Meta = Readonly<{ title: string }>

export const ProgressMonitor = () => {
  const [title, setTitle] = useState('Progress')
  const [progresses, setProgresses] = useState([] as Progresses)

  useEffect(() => {
    let ws = new WebSocket(`ws://${location.host}`)
    ws.addEventListener('message', (e) => {
      const data = JSON.parse(e.data)
      if (Array.isArray(data)) {
        setProgresses((progresses) => addProgresses(progresses, ...data))
      } else {
        const { title } = data as Meta
        setTitle(title)
        document.title = title
      }
    })
  }, [])

  return (
    <>
      <h1>{title}</h1>
      {progresses.map((p, i) => (
        <div key={i}>
          <h2>{p.variant}</h2>
          {p.metrics.map((m, j) => {
            const keys = Object.keys(m.values[0] || {}).filter((key) => key !== 'epoch')
            const multipleKeys = keys.length > 1
            const baseHeight = 200
            const legendHeight = multipleKeys ? 36 : 0
            const height = baseHeight + legendHeight
            const colors = keys.map((_, i) => color(i, keys.length))
            return (
              <div key={j}>
                <h3>{m.name}</h3>
                <LazyLoad height={height}>
                  <LineChart width={500} height={height} data={m.values as object[]}>
                    <XAxis
                      dataKey="epoch"
                      type="number"
                      domain={p.numEpochs != null ? [0, p.numEpochs] : undefined}
                    />
                    <YAxis domain={['auto', 'auto']} />
                    <CartesianGrid vertical={false} />
                    <Tooltip />
                    {multipleKeys && <Legend verticalAlign="top" height={legendHeight} />}
                    {keys.map((key, i) => (
                      <Line
                        key={key}
                        dataKey={key}
                        dot={false}
                        isAnimationActive={false}
                        stroke={colors[i]}
                      />
                    ))}
                  </LineChart>
                </LazyLoad>
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}

function addProgresses(progresses: Progresses, ...newProgresses: ProgressMessage[]): Progresses {
  return produce(progresses, (progresses) => {
    for (const p of newProgresses) {
      const lastProgress = progresses.length > 0 ? progresses[progresses.length - 1] : null
      const value = typeof p.value === 'number' ? { value: p.value } : p.value
      if (lastProgress != null && lastProgress.variant === p.variant) {
        const { metrics } = lastProgress
        const i = metrics.findIndex((m) => m.name === p.metrics)
        if (i !== -1) {
          metrics[i].values.push({ epoch: p.epoch, ...value })
        } else {
          metrics.push({ name: p.metrics, values: [{ epoch: p.epoch, ...value }] })
        }
      } else {
        progresses.push({
          variant: p.variant,
          numEpochs: p.n_epochs,
          metrics: [{ name: p.metrics, values: [{ epoch: p.epoch, ...value }] }]
        })
      }
    }
  })
}

function color(i: number, n: number): string {
  const h = Math.floor((360 * i) / n)
  return `hsl(${h},50%,50%)`
}

ReactDOM.render(<ProgressMonitor />, document.getElementById('app'))
