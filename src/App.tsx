import { Routes, Route } from 'react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Editor from './pages/Editor'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  )
}
