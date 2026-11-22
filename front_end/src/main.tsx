import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.tsx'
import { CarrinhoProvider } from './components/carrinho'
import { UsuarioProvider } from './usuario/contextoUsuario.tsx'
import { Header } from './components/header'
import { Footer } from './components/footer'
import { CadastroPage } from './pages/cadastro'
import { Login } from './pages/login'
import { Sabores } from './pages/produtos'
import { CarrinhoPage } from './pages/carrinho'
import { CheckoutPage } from './pages/checkout'
import { Configuracoes } from './usuario/configuracoes.tsx'
import { EnderecosLista } from './usuario/enderecosLista.tsx'
import { EnderecoCadastro } from './usuario/enderecoCadastro.tsx'
import { Dashboard } from './admin/pages/dashboard'
import { AdminRota } from './admin/adminRota'
import { ProdutosLista } from './admin/pages/listagem/produtosLista.tsx'
import { ProdutoCadastro } from './admin/pages/cadastro/produtoCadastro.tsx'
import { CategoriasLista } from './admin/pages/listagem/categoriasLista.tsx'
import { CategoriaCadastro } from './admin/pages/cadastro/categoriaCadastro.tsx'
import { VendasLista } from './admin/pages/listagem/vendasLista.tsx'
import { VendaCadastro } from './admin/pages/cadastro/vendaCadastro.tsx'
import './css/index.css'
import './css/admin.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UsuarioProvider>
      <CarrinhoProvider>
        <header>
          <Header />
        </header>
        <main>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/produtos" element={<Sabores />} />
            <Route path="/carrinho" element={<CarrinhoPage />} />
            <Route path="/endereco" element={<CheckoutPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/configuracoes/enderecos/novo" element={<EnderecoCadastro />} />
            <Route path="/configuracoes/enderecos/:id/editar" element={<EnderecoCadastro />} />
            <Route path="/configuracoes/enderecos" element={<EnderecosLista />} />
            <Route element={<AdminRota />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/produtos/novo" element={<ProdutoCadastro />} />
            <Route path="/admin/produtos/:id/editar" element={<ProdutoCadastro />} />
            <Route path="/admin/produtos" element={<ProdutosLista />} />
            <Route path="/admin/categorias/novo" element={<CategoriaCadastro />} />
            <Route path="/admin/categorias/:id/editar" element={<CategoriaCadastro />} />
            <Route path="/admin/categorias" element={<CategoriasLista />} />
            <Route path="/admin/vendas/novo" element={<VendaCadastro />} />
            <Route path="/admin/vendas/:id/editar" element={<VendaCadastro />} />
            <Route path="/admin/vendas" element={<VendasLista />} />
            </Route>
          </Routes>

        </main>
        <footer>
          <Footer />
        </footer>
      </CarrinhoProvider>
      </UsuarioProvider>
    </BrowserRouter>
  </StrictMode>,
)
