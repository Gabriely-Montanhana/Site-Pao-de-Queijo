import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alerta } from "../components/alerta";
// import { useEffect } from "react";
// import { api, mensagemDaApi } from "../api/axios";

type ItemExemplo = {
    produtoId: number;
    nome: string;
    preco: number;
    imagem: string;
    estoque: number;
    quantidade: number;
};

const ITENS_EXEMPLO: ItemExemplo[] = [
    { produtoId: 1, nome: "Pão de Queijo Tradicional", preco: 30, imagem: "img/tradicional.jpeg", estoque: 50, quantidade: 2 },
    { produtoId: 2, nome: "Chipa", preco: 30, imagem: "img/chipa.jpeg", estoque: 40, quantidade: 1 },
    { produtoId: 3, nome: "Pão de Queijo de Frango", preco: 34, imagem: "img/frango.jpeg", estoque: 35, quantidade: 1 },
    { produtoId: 4, nome: "Pão de Queijo de Requeijão", preco: 34, imagem: "img/requeijao.jpeg", estoque: 30, quantidade: 1 },
    { produtoId: 5, nome: "Pão de Queijo de Calabresa", preco: 34, imagem: "img/calabresa.jpeg", estoque: 25, quantidade: 1 },
    { produtoId: 6, nome: "Pão de Queijo de Goiabada", preco: 34, imagem: "img/goiabada.jpeg", estoque: 20, quantidade: 1 },
];

function formatarPreco(valor: number) {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

export function CarrinhoPage() {
    const [itens, setItens] = useState<ItemExemplo[]>(ITENS_EXEMPLO);
    const [erro] = useState("");
    const [desfazer, setDesfazer] = useState<{ id: number; item: ItemExemplo; indice: number } | null>(null);

    // Para voltar ao banco, apague ITENS_EXEMPLO, use useState([]) e descomente isto:
    // const [itens, setItens] = useState<ItemExemplo[]>([]);
    // const [erro, setErro] = useState("");
    // useEffect(() => {
    //     api.get<ItemExemplo[]>("/api/carrinho")
    //         .then((resposta) => setItens(resposta.data))
    //         .catch((falha: unknown) => setErro(mensagemDaApi(falha, "Não foi possível carregar o carrinho.")));
    // }, []);

    useEffect(() => {
        if (!desfazer) return;
        const tempo = setTimeout(() => setDesfazer(null), 5000);
        return () => clearTimeout(tempo);
    }, [desfazer]);

    function excluir(produtoId: number) {
        const indice = itens.findIndex((item) => item.produtoId === produtoId);
        if (indice < 0) return;
        setDesfazer({ id: Date.now(), item: itens[indice], indice });
        setItens((atual) => atual.filter((item) => item.produtoId !== produtoId));
    }

    function desfazerExclusao() {
        if (!desfazer) return;
        const { item, indice } = desfazer;
        setItens((atual) => {
            if (atual.some((linha) => linha.produtoId === item.produtoId)) return atual;
            const proximo = [...atual];
            proximo.splice(Math.min(indice, proximo.length), 0, item);
            return proximo;
        });
        setDesfazer(null);
    }

    function mudar(produtoId: number, quantidade: number) {
        setItens((atual) => atual.flatMap((item) => {
            if (item.produtoId !== produtoId) return [item];
            if (quantidade <= 0) return [];
            return [{ ...item, quantidade: Math.min(quantidade, item.estoque) }];
        }));
    }

    function finalizar() {
        // api.post("/api/vendas", { itens })
        //     .then(() => setItens([]))
        //     .catch((falha: unknown) => setErro(mensagemDaApi(falha, "Não foi possível finalizar a compra.")));
    }

    const total = itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
    const quantidade = itens.reduce((soma, item) => soma + item.quantidade, 0);

    return (
        <section className="carrinho">
            <div className="carrinho-miolo">
                <div>
                    <h2>Carrinho de compras</h2>
                    {erro && <p className="field-error">{erro}</p>}
                    {itens.length === 0 && (
                        <div className="carrinho-card carrinho-vazio">
                            <p>Seu carrinho está vazio.</p>
                            <Link to="/produtos">Ver produtos</Link>
                        </div>
                    )}
                    {itens.length > 0 && (
                        <div className="carrinho-card">
                            {itens.map((item) => (
                                <article className="carrinho-item" key={item.produtoId}>
                                    <img src={`/${item.imagem}`} alt="" />
                                    <div className="carrinho-info">
                                        <h3>{item.nome}</h3>
                                        <p>Frete grátis</p>
                                        <div className="carrinho-acoes">
                                            <div className="carrinho-qtd">
                                                <button type="button" onClick={() => mudar(item.produtoId, item.quantidade - 1)} disabled={item.quantidade <= 1}>-</button>
                                                <span>{item.quantidade}</span>
                                                <button type="button" onClick={() => mudar(item.produtoId, item.quantidade + 1)} disabled={item.quantidade >= item.estoque}>+</button>
                                            </div>
                                            <button type="button" className="carrinho-excluir" onClick={() => excluir(item.produtoId)}>Excluir</button>
                                        </div>
                                    </div>
                                    <strong>{formatarPreco(item.preco * item.quantidade)}</strong>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
                <aside className="carrinho-resumo">
                    <p>Produtos ({quantidade}) <span>{formatarPreco(total)}</span></p>
                    <p>Frete <span className="carrinho-frete">Grátis</span></p>
                    <p className="carrinho-total-linha">Total <strong>{formatarPreco(total)}</strong></p>
                    <button type="button" onClick={finalizar} disabled={itens.length === 0}>Continuar a compra</button>
                </aside>
            </div>
            {desfazer && (
                <Alerta tipo="warning">
                    <span>{desfazer.item.nome} foi excluído do carrinho.</span>
                    <button type="button" className="aviso-desfazer" onClick={desfazerExclusao}>Desfazer</button>
                </Alerta>
            )}
        </section>
    );
}
