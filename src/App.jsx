import { useState, useEffect } from 'react'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/Home.jsx'
import UNESCOPage from './pages/UNESCO.jsx'
import FleetPage from './pages/Fleet.jsx'
import InformatiebPage from './pages/Informatieborden.jsx'
import TeamPage from './pages/Team.jsx'
import MediaPage from './pages/Media.jsx'
import BlogPage from './pages/Blog.jsx'

const PAGES = {
  home: HomePage,
  unesco: UNESCOPage,
  vloot: FleetPage,
  informatieborden: InformatiebPage,
  team: TeamPage,
  media: MediaPage,
  blog: BlogPage,
}

export default function App() {
  const [page, setPage] = useState(() => sessionStorage.getItem('sz_page') || 'home')

  const navigate = (p) => {
    setPage(p)
    sessionStorage.setItem('sz_page', p)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  // Update document title per page
  useEffect(() => {
    const titles = {
      home: 'Stichting Zeilschipper — Bruine Vloot · UNESCO-erfgoed',
      unesco: 'Road to UNESCO — Stichting Zeilschipper',
      vloot: 'De Vloot — Stichting Zeilschipper',
      informatieborden: 'Informatieborden — Stichting Zeilschipper',
      team: 'Team — Stichting Zeilschipper',
      media: 'Media & Bouwdozen — Stichting Zeilschipper',
      blog: 'Blog — Stichting Zeilschipper',
    }
    document.title = titles[page] || titles.home
  }, [page])

  const PageComponent = PAGES[page] || HomePage

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", background: '#f4ede1', color: '#0f2238', minHeight: '100vh' }}>
      <Nav currentPage={page} navigate={navigate} />
      <PageComponent navigate={navigate} />
      <Footer navigate={navigate} />
    </div>
  )
}
