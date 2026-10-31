// FALTA COLOCAR OS LINK 
export function Header() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-warning shadow-sm">
            <div className="container">
                <a className="navbar-brand" href="">
                    <img src="/img/logo.png" alt="Banepane Foods"></img>
                </a>
                <button className="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#menu">
                    <span className="navbar-toggler-icon">
                    </span>
                </button>
                <div className="collapse navbar-collapse" id="menu">
                    <div className="navbar-nav ms-auto">
                        <a className="nav-link text-dark" href="">Home</a>
                        <a className="nav-link text-dark" href="">Produtos</a>
                        <a className="nav-link text-dark" href="">
                            <img src="/img/logoCarrinho.svg" alt="Carrinho" width="17" height="17"></img>
                        </a>
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                               <img src="/img/logoUsuario.svg" alt="Usuario" width="20" height="20"></img>
                            </a>
                            <ul className="dropdown-menu">
                                <li><a className="dropdown-item" href="#">Entrar</a></li>
                                <li><a className="dropdown-item" href="#">Criar</a></li>
                            </ul>
                        </li>
                    </div>
                </div>
            </div>
        </nav>
    )
}