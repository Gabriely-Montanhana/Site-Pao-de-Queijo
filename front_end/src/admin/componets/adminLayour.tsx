import { NavLink } from "react-router-dom";

// Menu reutilizado nas telas de produtos, categorias e vendas.
export function AdminLayout() {
    return (
        <aside className="admin-menu">
            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "ativo" : undefined}>
                <i className="bi bi-speedometer2"></i> Dashboard
            </NavLink>
            <NavLink to="/admin/produtos" className={({ isActive }) => isActive ? "ativo" : undefined}>
                <i className="bi bi-box-seam"></i> Produtos
            </NavLink>
            <NavLink to="/admin/categorias" className={({ isActive }) => isActive ? "ativo" : undefined}>
                <i className="bi bi-tags"></i> Categorias
            </NavLink>
            <NavLink to="/admin/vendas" className={({ isActive }) => isActive ? "ativo" : undefined}>
                <i className="bi bi-receipt"></i> Vendas
            </NavLink>
        </aside>
    )
}
