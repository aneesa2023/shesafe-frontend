import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import UserPage from './pages/UserPage_1'
import AdminPage from './pages/AdminPage'
import './styles.css'

function App() {
  return (
    <BrowserRouter>
      <nav className="flex justify-between p-4 bg-pink-600 text-white font-semibold">
        <Link to="/user">SheSafe User</Link>
        <Link to="/admin">SheSafe Admin</Link>
      </nav>
      <Routes>
        <Route path="/user" element={<UserPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<UserPage />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)