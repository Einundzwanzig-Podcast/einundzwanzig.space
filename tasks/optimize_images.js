const compress_images = require('compress-images')
const input = 'compress/*.{jpg,png,svg,gif}'
const output = 'compress/out/'

compress_images(input, output, { compress_force: true, statistic: true, autoupdate: false }, false,
  { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } },
  { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } },
  { svg: { engine: "svgo", command: "--multipass" } },
  { gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
  (error, completed, statistic) => {
    if (error) console.error(error)
    if (statistic) console.log(statistic)
  }
)
