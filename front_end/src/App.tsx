import { Route, Routes } from 'react-router-dom'
import { Header } from './components/header'
import { CadastroPage } from './pages/cadastro'
import { Home } from './pages/home'
import { Login } from './pages/login'
import { Footer } from './components/footer'
import { Sabores } from './pages/produtos'
import { CarrinhoPage } from './pages/carrinho'

function App() {
  return (
    <div>
      <header>
        <Header />
      </header>
      <main>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/produtos" element={<Sabores />} />
          <Route path="/carrinho" element={<CarrinhoPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      <footer>
        <Footer />
      </footer>
    </div>
  )
}

export default App
