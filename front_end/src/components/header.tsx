import { Link, useLocation, useNavigate } from "react-router-dom";

export function Header() {
    const navigate = useNavigate();
    useLocation();
    const logado = Boolean(localStorage.getItem("token"));

    function sair() {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        navigate("/");
    }

    return (
        <nav className="navbar navbar-expand-lg shadow">
            <div className="container">
                <Link className="navbar-brand" to="/home">
                    <img src="/img/logo.png" alt="Banepane Foods"></img>
                </Link>
                <button className="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#menu">
                    <span className="navbar-toggler-icon">
                    </span>
                </button>
                <div className="collapse navbar-collapse" id="menu">
                    <div className="navbar-nav ms-auto">
                        <Link className="nav-link" to="/">Home</Link>
                        <Link className="nav-link" to="/produtos">Produtos</Link>
                        {logado && <Link className="nav-link" to="/admin/dashboard">Admin</Link>}
                        <Link className="nav-link" to="/carrinho">
                            <img src="/img/logoCarrinho.svg" alt="Carrinho" width="17" height="17"></img>
                        </Link>
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                               <img src="/img/logoUsuario.svg" alt="Usuario" width="20" height="20"></img>
                            </a>
                            <ul className="dropdown-menu">
                                {logado ? (
                                    <>
                                        <li><Link className="dropdown-item" to="/configuracoes">Configurações</Link></li>
                                        <li><button className="dropdown-item" type="button" onClick={sair}>Sair</button></li>
                                    </>
                                ) : (
                                    <>
                                        <li><Link className="dropdown-item" to="/login">Entrar</Link></li>
                                        <li><Link className="dropdown-item" to="/cadastro">Cadastro</Link></li>
                                    </>
                                )}
                            </ul>
                        </li>
                    </div>
                </div>
            </div>
        </nav>
    )
}