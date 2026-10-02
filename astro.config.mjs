// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import starlightThemeRapide from 'starlight-theme-rapide'

/**
 * @param {string} ja
 * @param {string} cn
 * @param {string} tw
 */
const translations = (ja, cn, tw) => ({ ja, 'zh-CN': cn, 'zh-TW': tw })

export default defineConfig({
  site: process.env.SITE_URL || undefined,
  integrations: [
    starlight({
      title: 'Mankai',
      description:
        'Get started with Mankai, organize your books, and read across your devices.',
      logo: {
        src: './public/icon.png',
        alt: '',
        replacesTitle: false,
      },
      favicon: '/favicon.png',
      plugins: [starlightThemeRapide()],
      locales: {
        root: { label: 'English', lang: 'en' },
        ja: { label: '日本語', lang: 'ja' },
        'zh-cn': { label: '简体中文', lang: 'zh-CN' },
        'zh-tw': { label: '繁體中文', lang: 'zh-TW' },
      },
      social: [
        {
          icon: 'github',
          label: 'Mankai on GitHub',
          href: 'https://github.com/mankai-app/mankai',
        },
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Guides',
          translations: translations('使い方ガイド', '使用指南', '使用指南'),
          items: [
            { slug: 'guides/installation' },
            { slug: 'guides/quick-start' },
            { slug: 'guides/sources' },
            { slug: 'guides/library' },
            { slug: 'guides/reading' },
            { slug: 'guides/image-processing' },
            { slug: 'guides/sync' },
            { slug: 'guides/troubleshooting' },
          ],
        },
        {
          label: 'Screenshot gallery',
          translations: translations(
            'スクリーンショット一覧',
            '截图预览',
            '螢幕截圖預覽',
          ),
          link: '/screenshots/',
        },
        {
          label: 'API',
          collapsed: true,
          items: [
            { slug: 'api/overview' },
            { slug: 'api/javascript-plugins' },
            { slug: 'api/http-api' },
            { slug: 'api/editor-api' },
            { slug: 'api/image-processors' },
            { slug: 'api/mma-format' },
          ],
        },
      ],
    }),
  ],
})
