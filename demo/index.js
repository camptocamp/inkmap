import {print, downloadBlob} from '../src'

document.querySelectorAll('.print-unit').forEach(unit => {
  const specElt = unit.querySelector('.spec')
  const startBtn = unit.querySelector('.start-btn')
  const waitBtn = unit.querySelector('.wait-btn')
  const progressBar = unit.querySelector('.progress')
  const progressBarInner = progressBar.children.item(0)

  startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none'
    waitBtn.style.display = null
    progressBar.style.display = null
    progressBarInner.style.width = '0'

    print(JSON.parse(specElt.value)).subscribe(job => {
      progressBarInner.style.width = Math.round(job.progress * 100) + '%'

      console.log(job)

      if (job.status === 'finished' && job.imageBlob) {
        downloadBlob(job.imageBlob, `inkmap-${new Date().toISOString().substr(0, 10)}.png`)
      }
    }, null, () => {
      startBtn.style.display = null
      waitBtn.style.display = 'none'
      progressBar.style.display = 'none'
    })
  })
})
