import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";


export type Usuario = {
    id?: number;
    nome: string;
    email: string;
    cpf?: string;
    perfil?: "admin" | "cliente";
};


type UsuarioValor = {
    usuario: Usuario | null;
    entrar: (token: string, usuario: Usuario) => void;
    atualizar: (usuario: Usuario) => void;
    sair: () => void;
};

const UsuarioContexto = createContext<UsuarioValor | null>(null);

function lerUsuario(): Usuario | null {
    if (!localStorage.getItem("token")) return null;
    try {
        const texto = localStorage.getItem("usuario");
        const dados = texto ? JSON.parse(texto) as Usuario : null;
        if (!dados?.email) return null;
        return dados;
    } catch {
        return null;
    }
}

export function UsuarioProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(lerUsuario);

    const entrar = useCallback((token: string, proximo: Usuario) => {
        localStorage.setItem("token", token);
        localStorage.setItem("usuario", JSON.stringify(proximo));
        setUsuario(proximo);
    }, []);

    const atualizar = useCallback((proximo: Usuario) => {
        localStorage.setItem("usuario", JSON.stringify(proximo));
        setUsuario(proximo);
    }, []);

    const sair = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setUsuario(null);
    }, []);

    const valor = useMemo(() => ({ usuario, entrar, atualizar, sair }), [usuario, entrar, atualizar, sair]);

    return (
        <UsuarioContexto.Provider value={valor}>
            {children}
        </UsuarioContexto.Provider>
    );
}

export function useUsuario() {
    const contexto = useContext(UsuarioContexto);
    if (!contexto) throw new Error("useUsuario precisa ficar dentro do UsuarioProvider.");
    return contexto;
}
