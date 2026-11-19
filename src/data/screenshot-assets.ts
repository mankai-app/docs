import screenshotImages from './screenshots.json'

export const screenshotDevices = [
  { kind: 'phone', name: 'iPhone' },
  { kind: 'tablet', name: 'iPad' },
  { kind: 'duo', name: 'Duo' },
] as const

export type ScreenshotScene = keyof typeof screenshotImages

type Device = (typeof screenshotDevices)[number]['kind']
type Appearance = 'light' | 'dark'

interface ScreenshotAsset {
  src: string
  width: number
  height: number
}

type ScreenshotVariants = Partial<
  Record<Device, Partial<Record<Appearance, ScreenshotAsset>>>
>

export const screenshots: Record<ScreenshotScene, ScreenshotVariants> =
  screenshotImages
