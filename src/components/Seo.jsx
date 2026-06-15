import { Head } from 'vite-react-ssg'
import { useLocation } from 'react-router-dom'
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  OG_IMAGE,
} from '../config.js'

/**
 * Per-page <head> tags: title, description, canonical, Open Graph, Twitter,
 * plus optional JSON-LD. Uses vite-react-ssg's <Head> (a React Helmet wrapper)
 * so the tags are baked into the prerendered HTML and also update on client nav.
 */
export default function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const location = useLocation()
  const pathname = path || location.pathname || '/'
  const canonical =
    SITE_URL + (pathname === '/' ? '/' : `/${pathname.replace(/^\/+|\/+$/g, '')}`)
  const pageTitle = title || DEFAULT_TITLE
  const desc = description || DEFAULT_DESCRIPTION
  const ogImage = image || OG_IMAGE

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_GH" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Head>
  )
}
