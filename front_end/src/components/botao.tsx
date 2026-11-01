import type { ReactNode } from "react";

type BotaoProps = {
    children : ReactNode;
    type?: "button" | "submit";
    onClick?: () => void;
    disabled?: boolean;
};

export function Botao({children, type = "button", onClick, disabled} : BotaoProps) {
    return (
        <button type={type} className="btn" onClick={onClick} disabled={disabled}>
            {children}  
        </button>
    )
}