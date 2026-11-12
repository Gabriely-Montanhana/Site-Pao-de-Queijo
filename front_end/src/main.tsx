import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.tsx'
import { CarrinhoProvider } from './components/carrinho'
import { Header } from './components/header'
import { Footer } from './components/footer'
import { CadastroPage } from './pages/cadastro'
import { Login } from './pages/login'
import { Sabores } from './pages/produtos'
import { CarrinhoPage } from './pages/carrinho'
import { Configuracoes } from './usuario/configuracoes.tsx'
import { Dashboard } from './admin/pages/dashboard'
import './css/index.css'
import './css/admin.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CarrinhoProvider>
        <header>
          <Header />
        </header>
        <main>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/produtos" element={<Sabores />} />
            <Route path="/carrinho" element={<CarrinhoPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <footer>
          <Footer />
        </footer>
      </CarrinhoProvider>
    </BrowserRouter>
  </StrictMode>,
)
