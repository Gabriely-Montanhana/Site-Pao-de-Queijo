import { Navigate, Outlet } from "react-router-dom";
import { useUsuario } from "../usuario/contextoUsuario";

export function AdminRota() {
    const { usuario } = useUsuario();

    if (!localStorage.getItem("token") || !usuario) {
        return <Navigate to="/login" replace />;
    }

    if (usuario.perfil !== "admin") {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
