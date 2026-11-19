import { readFile, writeFile } from 'node:fs/promises'
import sharp, { type Create } from 'sharp'
import type screenshotManifest from '../src/data/screenshots.json'

const root = new URL('../', import.meta.url)
const screenshotImages: typeof screenshotManifest = JSON.parse(
  await readFile(new URL('src/data/screenshots.json', root), 'utf8'),
)
const collection = screenshotImages['library-collections']

const canvas = {
  width: 1173,
  height: 920,
  channels: 4,
  background: { r: 0, g: 0, b: 0, alpha: 0 },
} satisfies Create
const screenBleed = 3

// Screen bounds and corner radii use the source frame’s pixel coordinates.
const devices = [
  {
    kind: 'tablet',
    frame: 'ipad-a16-silver-landscape.png',
    left: -28,
    top: -28,
    width: 1096,
    screen: { left: 200, top: 200, width: 2360, height: 1640, radius: 40 },
  },
  {
    kind: 'phone',
    frame: 'iphone-18-pro-silver-portrait.png',
    left: 773,
    top: 104,
    width: 400,
    screen: { left: 72, top: 69, width: 1206, height: 2622, radius: 180 },
  },
] as const

type Device = (typeof devices)[number]

interface RenderedDevice {
  input: Buffer
  left: number
  top: number
}

async function renderDevice(
  device: Device,
  screenshot: { src: string },
): Promise<RenderedDevice> {
  const frame = await readFile(
    new URL('assets/hero-frames/' + device.frame, root),
  )
  const frameSize = await sharp(frame).metadata()
  const scale = device.width / frameSize.width
  const screen = {
    left: Math.round(device.screen.left * scale),
    top: Math.round(device.screen.top * scale),
    width: Math.round(device.screen.width * scale),
    height: Math.round(device.screen.height * scale),
  }

  const placement = {
    left: screen.left - screenBleed,
    top: screen.top - screenBleed,
  }
  const radius = device.screen.radius * scale + screenBleed
  const screenMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${screen.width + 2 * screenBleed}" height="${screen.height + 2 * screenBleed}">
      <rect width="100%" height="100%" rx="${radius}" fill="#000" />
    </svg>`,
  )

  const frameImage = sharp(frame).resize(device.width)
  if (device.kind === 'tablet') {
    // Blacken the iPad’s inner rim while preserving the frame’s alpha.
    frameImage.composite([{ input: screenMask, ...placement, blend: 'atop' }])
  }

  const [screenImage, resizedFrame] = await Promise.all([
    sharp(await readFile(new URL('public' + screenshot.src, root)))
      .resize(screen.width, screen.height, { fit: 'cover' })
      .extend({
        top: screenBleed,
        bottom: screenBleed,
        left: screenBleed,
        right: screenBleed,
        extendWith: 'copy',
      })
      .composite([{ input: screenMask, blend: 'dest-in' }])
      .png()
      .toBuffer(),
    frameImage.png().toBuffer({ resolveWithObject: true }),
  ])

  const input = await sharp({
    create: {
      ...canvas,
      width: resizedFrame.info.width,
      height: resizedFrame.info.height,
    },
  })
    .composite([
      { input: screenImage, ...placement },
      { input: resizedFrame.data },
    ])
    .png()
    .toBuffer()
  return { input, left: device.left, top: device.top }
}

const images = await Promise.all(
  (['light', 'dark'] as const).map(async (theme) => {
    const layers = await Promise.all(
      devices.map((device) =>
        renderDevice(device, collection[device.kind][theme]),
      ),
    )

    const image = await sharp({ create: canvas })
      .composite(layers)
      .webp({ quality: 88, alphaQuality: 100, effort: 5, smartSubsample: true })
      .toBuffer()

    return { theme, image }
  }),
)

for (const { theme, image } of images) {
  const path = 'public/screenshots/hero-' + theme + '.webp'
  await writeFile(new URL(path, root), image)
  console.log('Generated ' + path)
}
