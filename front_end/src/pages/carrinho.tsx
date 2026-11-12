import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alerta } from "../components/alerta";
import { api, mensagemDaApi } from "../api/axios";
import { useCarrinho, type ItemCarrinho } from "../components/carrinho";


function formatarPreco(valor: number) {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function urlImagem(imagem?: string | null) {
    const arquivo = (imagem ?? "").split("/").pop();
    return arquivo ? `/img/${arquivo}` : "/img/logo.png";
}

export function CarrinhoPage() {
    const { itens, alterar, remover, repor, limpar, total, quantidade } = useCarrinho();
    const [desfazer, setDesfazer] = useState<{ id: number; item: ItemCarrinho; indice: number } | null>(null);
    const [erro, setErro] = useState("");
    const [pedidoFeito, setPedidoFeito] = useState(false);

    useEffect(() => {
        if (!desfazer) return;
        const tempo = setTimeout(() => setDesfazer(null), 5000);
        return () => clearTimeout(tempo);
    }, [desfazer]);

    function excluir(produtoId: number) {
        const indice = itens.findIndex((item) => item.produtoId === produtoId);
        if (indice < 0) return;
        setDesfazer({ id: Date.now(), item: itens[indice], indice });
        remover(produtoId);
    }

    function desfazerExclusao() {
        if (!desfazer) return;
        repor(desfazer.item, desfazer.indice);
        setDesfazer(null);
    }

    function mudar(produtoId: number, quantidadeItem: number) {
        alterar(produtoId, quantidadeItem);
    }

    function finalizar() {
        setErro("");
        setPedidoFeito(false);
        const texto = localStorage.getItem("usuario");
        let usuario: { id?: number } | null = null;
        try {
            usuario = texto ? JSON.parse(texto) as { id?: number } : null;
        } catch {
            usuario = null;
        }
        api.post("/api/pedidos", {
            usuarioId: usuario?.id,
            status: "pendente",
            valorTotal: total,
        })
            .then(() => {
                limpar();
                setPedidoFeito(true);
            })
            .catch((falha: unknown) => setErro(mensagemDaApi(falha, "Não foi possível finalizar a compra.")));
    }

    return (
        <section className="carrinho">
            <div className="carrinho-miolo">
                <div>
                    <h2>Carrinho de compras</h2>
                    {erro && <p className="field-error">{erro}</p>}
                    {pedidoFeito && <Alerta tipo="success">Pedido registrado.</Alerta>}
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
                                    <img src={urlImagem(item.imagem)} alt="" />
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
