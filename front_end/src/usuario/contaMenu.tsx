import { Link } from "react-router-dom";
import { useUsuario } from "./contextoUsuario";

type AbaConta = "dados" | "enderecos" | "pedidos";

// Mostra o nome e o e-mail que estão no contexto, em todas as telas da conta.
export function ContaMenu({ ativo }: { ativo: AbaConta }) {
    const { usuario } = useUsuario();
    const inicial = (usuario?.nome || "U").trim().charAt(0).toUpperCase();

    return (
        <aside className="ml-menu">
            <div className="ml-perfil">
                <span className="ml-avatar" aria-hidden="true">{inicial}</span>
                <div>
                    <strong>{usuario?.nome || "Minha conta"}</strong>
                    <small>{usuario?.email}</small>
                </div>
            </div>
            <nav>
                <Link className={ativo === "dados" ? "ativo" : undefined} to="/configuracoes">Meus dados</Link>
                <Link className={ativo === "enderecos" ? "ativo" : undefined} to="/configuracoes/enderecos">Endereços</Link>
                <Link className={ativo === "pedidos" ? "ativo" : undefined} to="/configuracoes?aba=pedidos">Pedidos</Link>
            </nav>
        </aside>
    );
}
