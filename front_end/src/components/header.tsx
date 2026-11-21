import { Link, useNavigate } from "react-router-dom";
import { useUsuario } from "../usuario/contextoUsuario";

export function Header() {
    const navigate = useNavigate();
    const { usuario, sair: encerrar } = useUsuario();
    const logado = Boolean(usuario);

    function sair() {
        encerrar();
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
                            <a className="nav-link dropdown-toggle nav-conta" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                               {usuario?.nome ? (
                                   <span className="nav-avatar" aria-hidden="true">{usuario.nome.trim().charAt(0).toUpperCase()}</span>
                               ) : (
                                   <img src="/img/logoUsuario.svg" alt="Usuario" width="20" height="20"></img>
                               )}
                               {usuario?.nome && <span className="nav-usuario">{usuario.nome}</span>}
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