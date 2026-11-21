const CHAVE = "detalhes-pedidos";

export type ItemPedido = {
    nome: string;
    quantidade: number;
    preco: number;
};

function lerTodos(): Record<string, ItemPedido[]> {
    try {
        const texto = localStorage.getItem(CHAVE);
        const dados = texto ? JSON.parse(texto) as Record<string, ItemPedido[]> : {};
        return dados && typeof dados === "object" ? dados : {};
    } catch {
        return {};
    }
}

export function guardarDetalhePedido(id: number, itens: ItemPedido[]) {
    const atuais = lerTodos();
    atuais[id] = itens;
    localStorage.setItem(CHAVE, JSON.stringify(atuais));
}

export function lerDetalhePedido(id: number) {
    const itens = lerTodos()[id];
    return Array.isArray(itens) ? itens : null;
}
