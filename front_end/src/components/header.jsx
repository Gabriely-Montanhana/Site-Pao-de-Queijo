// FALTA COLOCAR OS LINK 
export function Header() {
    return (
        <nav class="navbar navbar-expand-lg navbar-dark bg-warning shadow-sm">
            <div class="container">
                <a class="navbar-brand" href="">
                    <img src="/img/logo.png" alt="Banepane Foods"></img>
                </a>
                <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#menu">
                    <span class="navbar-toggler-icon">
                    </span>
                </button>
                <div class="collapse navbar-collapse" id="menu">
                    <div class="navbar-nav ms-auto">
                        <a class="nav-link text-dark" href="/home">Home</a>
                        <a class="nav-link text-dark" href="">Produtos</a>
                        <a class="nav-link text-dark" href="">
                            <img src="/img/logoCarrinho.svg" alt="Carrinho" width="17" height="17"></img>
                        </a>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                               <img src="/img/logoUsuario.svg" alt="Usuario" width="20" height="20"></img>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#">Entrar</a></li>
                                <li><a class="dropdown-item" href="#">Login</a></li>
                            </ul>
                        </li>
                    </div>
                </div>
            </div>
        </nav>
    )
}