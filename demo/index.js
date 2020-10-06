import {jobs$, printStatus$, startPrint} from '../lib'

window.addEventListener('load', () => {
    const specElt = document.getElementById('spec')
    const printBtn = document.getElementById('print')
    const statusElt = document.getElementById('status')

    printBtn.disabled = true

    printBtn.addEventListener('click', () => {
        startPrint(JSON.parse(specElt.value))
    })

    printStatus$.subscribe(ready => {
      if (ready) printBtn.disabled = false
    })

    jobs$.subscribe(jobs => {
      statusElt.innerHTML = `
Worker is operational. Jobs:<br>
<ul>
  ${jobs.map(job =>
        `<li>status: ${job.status} - progress: ${(job.progress * 100).toFixed(0)}% <canvas style="width: 200px"></canvas></li>`
      ).join('')}
  ${jobs.length === 0 ? 'No job found.' : ''}
</ul>`

      jobs
        .filter(job => !!job.imageData)
        .forEach((job, index) => {
          const canvas = statusElt.querySelectorAll('li > canvas')[index]
          const ctx = canvas.getContext('2d')
          canvas.width = job.imageData.width;
          canvas.height = job.imageData.height;
          ctx.drawImage(job.imageData, 0, 0)
        })
    })
})
