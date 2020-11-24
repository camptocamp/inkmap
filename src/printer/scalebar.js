export function writeScaletoCanvas (ctx) {
  // TODO: get position from spec
  var line1 = 6
  var xOffset = 10
  var yOffset = 40
  var fontsize1 = 12
  var font1 = fontsize1 + 'px Arial'
  // how big should the scale be (original css-width multiplied)
  var multiplier = 1 // 2

  // FIXME: get values from ol control (commented below)
  var scalewidth = 50
  var scale = "Test scale"
  var scalenumber = 10
  var scaleunit = "m"

  // var scalewidth = parseInt(olscale.css('width'), 10) * multiplier
  // var scale = olscale.text()
  // var scalenumber = parseInt(scale, 10) * multiplier
  // var scaleunit = scale.match(/[Aa-zZ]{1,}/g)

  ctx.save()
  ctx.globalAlpha = 0.8

  // Scale Text
  ctx.beginPath()
  ctx.textAlign = 'left'
  ctx.strokeStyle = '#ffffff'
  ctx.fillStyle = '#000000'
  ctx.lineWidth = 5
  ctx.font = font1
  ctx.strokeText([scalenumber + ' ' + scaleunit], xOffset + fontsize1 / 2, ctx.canvas.height - yOffset - fontsize1 / 2)
  ctx.fillText([scalenumber + ' ' + scaleunit], xOffset + fontsize1 / 2, ctx.canvas.height - yOffset - fontsize1 / 2)

  // Scale Dimensions
  let xzero = scalewidth + xOffset
  let yzero = ctx.canvas.height - yOffset
  let xfirst = xOffset + scalewidth * 1 / 4
  let xsecond = xfirst + scalewidth * 1 / 4
  let xthird = xsecond + scalewidth * 1 / 4
  let xfourth = xthird + scalewidth * 1 / 4

  // Stroke
  ctx.beginPath()
  ctx.lineWidth = line1 + 2
  ctx.strokeStyle = '#000000'
  ctx.fillStyle = '#ffffff'
  ctx.moveTo(xOffset, yzero)
  ctx.lineTo(xzero + 1, yzero)
  ctx.stroke()

  // sections black/white
  ctx.beginPath()
  ctx.lineWidth = line1
  ctx.strokeStyle = '#000000'
  ctx.moveTo(xOffset, yzero)
  ctx.lineTo(xfirst, yzero)
  ctx.stroke()

  ctx.beginPath()
  ctx.lineWidth = line1
  ctx.strokeStyle = '#FFFFFF'
  ctx.moveTo(xfirst, yzero)
  ctx.lineTo(xsecond, yzero)
  ctx.stroke()

  ctx.beginPath()
  ctx.lineWidth = line1
  ctx.strokeStyle = '#000000'
  ctx.moveTo(xsecond, yzero)
  ctx.lineTo(xthird, yzero)
  ctx.stroke()

  ctx.beginPath()
  ctx.lineWidth = line1
  ctx.strokeStyle = '#FFFFFF'
  ctx.moveTo(xthird, yzero)
  ctx.lineTo(xfourth, yzero)
  ctx.stroke()

  ctx.restore()
}