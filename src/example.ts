function logProgress(object: unknown) {
  console.log(JSON.stringify(object))
}

function startLogging(variants: string[], i: number = 0) {
  if (i >= variants.length) {
    return
  }
  const v = variants[i]

  let t = 0
  const timer = setInterval(() => {
    if (t < 100) {
      logProgress({
        variant: v,
        metrics: 'metric 1',
        value: Math.sin(t / 20) + 0.1 * (Math.random() * 2 - 1),
        epoch: t,
        n_epochs: 100
      })

      if (t % 2 === 0) {
        const val = Math.sqrt(t) + 0.1 * (Math.random() * 2 - 1)
        logProgress({
          variant: v,
          metrics: 'metric 2',
          value: { x1: val, x2: val * (0.9 + Math.random() * 0.05) },
          epoch: t,
          n_epochs: 100
        })
      }
    } else {
      clearInterval(timer)
      startLogging(variants, i + 1)
    }
    t++
  }, 300)
}

setTimeout(() => {
  startLogging(['variant A', 'variant B'])
}, 4000)
