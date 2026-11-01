import { Route, Routes } from 'react-router-dom'
import { Header } from './components/header'
import { CadastroPage } from './pages/cadastro'
import { Home } from './pages/home'
import { Login } from './pages/login'

function App() {
  return (
    <div>
      <header>
        <Header />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
