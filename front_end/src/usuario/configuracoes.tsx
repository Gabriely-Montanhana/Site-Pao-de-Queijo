import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type UsuarioGuardado = {
    nome?: string;
    email?: string;
};

function lerUsuario(): UsuarioGuardado | null {
    const texto = localStorage.getItem("usuario");
    if (!texto) return null;
    try {
        return JSON.parse(texto) as UsuarioGuardado;
    } catch {
        return null;
    }
}

export function Configuracoes() {
    const navigate = useNavigate();
    const usuario = lerUsuario();

    useEffect(() => {
        if (!localStorage.getItem("token")) navigate("/login");
    }, [navigate]);

    return (
        <section className="configuracoes-form card rounded-4 p-4 p-md-5">
            <h2 className="fw-bold mb-4 text-center">Configurações</h2>
            <p className="mb-2"><strong>Nome:</strong> {usuario?.nome}</p>
            <p className="mb-0"><strong>E-mail:</strong> {usuario?.email}</p>
        </section>
    );
}
