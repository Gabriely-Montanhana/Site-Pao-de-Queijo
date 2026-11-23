import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUsuario } from "../usuario/contextoUsuario";

// Componente reutilizado em todas as telas. O menu é React, sem JavaScript injetado.
export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { usuario, sair: encerrar } = useUsuario();
    const logado = Boolean(usuario);
    const [menuAberto, setMenuAberto] = useState(false);
    const [contaAberta, setContaAberta] = useState(false);
    const contaRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        setMenuAberto(false);
        setContaAberta(false);
    }, [location.pathname]);

    useEffect(() => {
        function fecharAoClicarFora(evento: MouseEvent) {
            if (!contaRef.current?.contains(evento.target as Node)) {
                setContaAberta(false);
            }
        }

        document.addEventListener("mousedown", fecharAoClicarFora);
        return () => document.removeEventListener("mousedown", fecharAoClicarFora);
    }, []);

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
                <button
                    className="navbar-toggler"
                    type="button"
                    aria-expanded={menuAberto}
                    aria-controls="menu"
                    onClick={() => setMenuAberto((aberto) => !aberto)}
                >
                    <span className="navbar-toggler-icon">
                    </span>
                </button>
                <div className={`collapse navbar-collapse${menuAberto ? " show" : ""}`} id="menu">
                    <div className="navbar-nav ms-auto">
                        <Link className="nav-link" to="/">Home</Link>
                        <Link className="nav-link" to="/produtos">Produtos</Link>
                        {usuario?.perfil === "admin" && <Link className="nav-link" to="/admin/dashboard">Admin</Link>}
                        <Link className="nav-link" to="/carrinho">
                            <img src="/img/logoCarrinho.svg" alt="Carrinho" width="17" height="17"></img>
                        </Link>
                        <li className="nav-item dropdown" ref={contaRef}>
                            <button
                                className="nav-link dropdown-toggle nav-conta"
                                type="button"
                                aria-expanded={contaAberta}
                                onClick={() => setContaAberta((aberta) => !aberta)}
                            >
                               {usuario?.nome ? (
                                   <span className="nav-avatar" aria-hidden="true">{usuario.nome.trim().charAt(0).toUpperCase()}</span>
                               ) : (
                                   <img src="/img/logoUsuario.svg" alt="Usuario" width="20" height="20"></img>
                               )}
                               {usuario?.nome && <span className="nav-usuario">{usuario.nome}</span>}
                            </button>
                            <ul className={`dropdown-menu${contaAberta ? " show" : ""}`}>
                                {logado ? (
                                    <>
                                        <li><Link className="dropdown-item" to="/configuracoes">Meu Perfil</Link></li>
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
