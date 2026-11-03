import type { ReactNode } from "react";

type AlertaProps = {
    tipo : "danger" | "success" | "warning" | "info";
    children : ReactNode;
};

export function Alerta({tipo, children} : AlertaProps) {
    return (
        <div className={`aviso-pagina ${tipo}`} role="status">
            {children}
        </div>
    )
}