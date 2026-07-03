import { useState, useEffect } from 'react'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/Home.jsx'
import UNESCOPage from './pages/UNESCO.jsx'
import FleetPage from './pages/Fleet.jsx'
import InformatiebPage from './pages/Informatieborden.jsx'
import TeamPage from './pages/Team.jsx'
import MediaPage from './pages/Media.jsx'
import MediaDetailPage from './pages/MediaDetail.jsx'
import BlogPage from './pages/Blog.jsx'
import BlogDetailPage from './pages/BlogDetail.jsx'
import SupportLetterPage from './pages/SupportLetter.jsx'
import PrivacyPage from './pages/Privacy.jsx'
import PhotoAttributionsPage from './pages/PhotoAttributions.jsx'
import { useLanguage } from './context/LanguageContext.jsx'

const PAGES = {
  home: HomePage,
  unesco: UNESCOPage,
  vloot: FleetPage,
  informatieborden: InformatiebPage,
  team: TeamPage,
  media: MediaPage,
  'media-detail': MediaDetailPage,
  blog: BlogPage,
  'blog-detail': BlogDetailPage,
  support: SupportLetterPage,
  privacy: PrivacyPage,
  'photo-credits': PhotoAttributionsPage,
}

// URL path → { page, param }
function parsePath(pathname) {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean)
  const root = parts[0] || ''
  switch (root) {
    case '':             return { page: 'home',             param: null }
    case 'vloot':        return { page: 'vloot',            param: null }
    case 'informatieborden': return { page: 'informatieborden', param: null }
    case 'unesco':       return { page: 'unesco',           param: null }
    case 'team':         return { page: 'team',             param: null }
    case 'media':
      return parts[1]
        ? { page: 'media-detail', param: Number(parts[1]) }
        : { page: 'media',        param: null }
    case 'blog':
      return parts[1]
        ? { page: 'blog-detail', param: parts[1] }
        : { page: 'blog',        param: null }
    case 'support':       return { page: 'support',       param: null }
    case 'privacy':       return { page: 'privacy',       param: null }
    case 'photo-credits': return { page: 'photo-credits', param: null }
    default:              return { page: 'home',           param: null }
  }
}

// { page, param } → URL path
function buildPath(page, param) {
  switch (page) {
    case 'home':             return '/'
    case 'vloot':            return '/vloot'
    case 'informatieborden': return '/informatieborden'
    case 'unesco':           return '/unesco'
    case 'team':             return '/team'
    case 'media':            return '/media'
    case 'media-detail':     return param !== null ? `/media/${param}` : '/media'
    case 'blog':             return '/blog'
    case 'blog-detail':      return param ? `/blog/${param}` : '/blog'
    case 'support':          return '/support'
    case 'privacy':          return '/privacy'
    case 'photo-credits':    return '/photo-credits'
    default:                 return '/'
  }
}

export default function App() {
  const initial = parsePath(window.location.pathname)

  const [page, setPage] = useState(initial.page)
  const [blogSlug, setBlogSlug] = useState(
    initial.page === 'blog-detail' ? initial.param : null
  )
  const [mediaItemId, setMediaItemId] = useState(
    initial.page === 'media-detail' ? initial.param : null
  )

  const { t, lang } = useLanguage()

  const navigate = (p, param = null) => {
    const path = buildPath(p, param)
    window.history.pushState({ page: p, param }, '', path)

    setPage(p)
    if (p === 'media-detail') setMediaItemId(param)
    else if (p === 'blog-detail') setBlogSlug(param)

    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  // Browser back / forward
  useEffect(() => {
    const onPop = (e) => {
      const { page: p, param } = e.state ?? parsePath(window.location.pathname)
      setPage(p)
      if (p === 'media-detail') setMediaItemId(param)
      else if (p === 'blog-detail') setBlogSlug(param)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Replace the initial history entry so popstate has state on first back
  useEffect(() => {
    window.history.replaceState(
      { page: initial.page, param: initial.param },
      '',
      window.location.pathname + window.location.search
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = t(`pageTitles.${page}`) || t('pageTitles.home')
  }, [page, lang, t])

  const PageComponent = PAGES[page] || HomePage

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", background: '#f4ede1', color: '#0f2238', minHeight: '100vh' }}>
      <Nav currentPage={page} navigate={navigate} />
      <PageComponent navigate={navigate} blogSlug={blogSlug} mediaItemId={mediaItemId} />
      <Footer navigate={navigate} />
    </div>
  )
}
