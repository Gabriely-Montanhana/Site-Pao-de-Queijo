import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ItemCarrinho = {
    produtoId: number;
    nome: string;
    preco: number;
    imagem: string;
    quantidade: number;
    estoque: number;
};

type Entrada = Omit<ItemCarrinho, "quantidade">;

type CarrinhoValor = {
    itens: ItemCarrinho[];
    quantidade: number;
    total: number;
    adicionar: (item: Entrada) => void;
    alterar: (produtoId: number, quantidade: number) => void;
    remover: (produtoId: number) => void;
    limpar: () => void;
};

const CarrinhoContexto = createContext<CarrinhoValor | null>(null);
const CHAVE = "carrinho";

function lerGuardado(): ItemCarrinho[] {//lê o carrinho que ficou salvo no navegador e devolve a lista para a tela abrir já com esses itens.
    try {
        const texto = localStorage.getItem(CHAVE);
        const dados = texto ? JSON.parse(texto) as ItemCarrinho[] : [];
        return Array.isArray(dados) ? dados : [];
    } catch {
        return [];
    }
}

export function CarrinhoProvider({ children }: { children: ReactNode }) {
    const [itens, setItens] = useState<ItemCarrinho[]>(lerGuardado);

    useEffect(() => {
        localStorage.setItem(CHAVE, JSON.stringify(itens));
    }, [itens]);

    function adicionar(item: Entrada) {
        if (item.estoque <= 0) return;
        setItens((atual) => {
            const existe = atual.find((linha) => linha.produtoId === item.produtoId);
            if (!existe) return [...atual, { ...item, quantidade: 1 }];
            if (existe.quantidade >= item.estoque) return atual;
            return atual.map((linha) => linha.produtoId === item.produtoId
                ? { ...linha, quantidade: linha.quantidade + 1, estoque: item.estoque, preco: item.preco }
                : linha);
        });
    }

    function alterar(produtoId: number, quantidade: number) {
        setItens((atual) => atual.flatMap((linha) => {
            if (linha.produtoId !== produtoId) return [linha];
            if (quantidade <= 0) return [];
            return [{ ...linha, quantidade: Math.min(quantidade, linha.estoque) }];
        }));
    }

    function remover(produtoId: number) {
        setItens((atual) => atual.filter((linha) => linha.produtoId !== produtoId));
    }

    function limpar() {
        setItens([]);
    }

    const quantidade = itens.reduce((soma, linha) => soma + linha.quantidade, 0);
    const total = itens.reduce((soma, linha) => soma + linha.preco * linha.quantidade, 0);

    return (
        <CarrinhoContexto.Provider value={{ itens, quantidade, total, adicionar, alterar, remover, limpar }}>
            {children}
        </CarrinhoContexto.Provider>
    );
}

export function useCarrinho() {
    const contexto = useContext(CarrinhoContexto);
    if (!contexto) throw new Error("useCarrinho precisa ficar dentro do CarrinhoProvider.");
    return contexto;
}
