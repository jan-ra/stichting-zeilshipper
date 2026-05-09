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
}

export default function App() {
  const [page, setPage] = useState(() => sessionStorage.getItem('sz_page') || 'home')
  const [blogSlug, setBlogSlug] = useState(() => sessionStorage.getItem('sz_blog_slug') || null)
  const [mediaItemId, setMediaItemId] = useState(() => {
    const saved = sessionStorage.getItem('sz_media_item_id')
    return saved ? Number(saved) : null
  })
  const { t, lang } = useLanguage()

  const navigate = (p, param = null) => {
    setPage(p)
    sessionStorage.setItem('sz_page', p)
    if (p === 'media-detail' && param !== null) {
      setMediaItemId(param)
      sessionStorage.setItem('sz_media_item_id', param)
    } else if (param !== null) {
      setBlogSlug(param)
      sessionStorage.setItem('sz_blog_slug', param)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

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
