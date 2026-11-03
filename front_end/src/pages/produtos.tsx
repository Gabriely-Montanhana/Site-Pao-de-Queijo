import { useEffect, useState } from "react";
import { api, mensagemDaApi } from "../api/axios";
import { useCarrinho } from "../components/carrinho";

type ProdutoVitrine = {
    id: number;
    nome: string;
    descricao: string;
    preco: number;
    estoque: number;
    imagem: string;
    categoriaId: number;
    categoriaNome: string;
};

function formatarPreco(valor: number) {
    return `R$${valor.toFixed(2).replace(".", ",")}`;
}

function Cartao({ produto }: { produto: ProdutoVitrine }) {
    const { adicionar, itens } = useCarrinho();
    const noCarrinho = itens.find((item) => item.produtoId === produto.id)?.quantidade ?? 0;
    const esgotado = produto.estoque <= 0 || noCarrinho >= produto.estoque;

    return (
        <article className="sabor">
            <img src={`/${produto.imagem}`} alt="" />
            <strong>{`/${produto.nome}`}</strong>
            <span>{formatarPreco(produto.preco)}</span>
            <button
                className="btn btn-primary"
                type="button"
                disabled={esgotado}
                onClick={() => adicionar({
                    produtoId: produto.id,
                    nome: produto.nome,
                    preco: produto.preco,
                    imagem: produto.imagem,
                    estoque: produto.estoque,
                })}
            >
                {produto.estoque <= 0 ? "Sem estoque" : "Comprar"}
            </button>
        </article>
    )
}

export function Sabores() {
    const [produtos, setProdutos] = useState<ProdutoVitrine[]>([]);
    const [erro, setErro] = useState("");

    useEffect(() => {
        api.get<ProdutoVitrine[]>("/api/vitrine/produtos")
            .then((resposta) => setProdutos(resposta.data))
            .catch((falha: unknown) => setErro(mensagemDaApi(falha, "Não foi possível carregar os sabores.")));
    }, []);

    const classicos = produtos.filter((produto) => produto.categoriaNome === "Classicos");
    const recheados = produtos.filter((produto) => produto.categoriaNome === "Recheados");

    return (
        <section className="sabores" id="sabores">
            <div className="sabores-topo">
                <h2>
                    Produtos
                    <br />
                    disponíveis:
                </h2>
            </div>
            <svg className="onda" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
                <path fill="#fbf3e4" d="M0 72c160 48 280-56 460-28 210 32 300 70 470 18 150-46 250-8 510-22v80H0Z" />
            </svg>
            <div className="sabores-corpo">
                {erro && <p className="field-error">{erro}</p>}
                {!erro && produtos.length === 0 && <p>Carregando sabores...</p>}
                {classicos.length > 0 && (
                    <div className="fileira fileira-classicos">
                        {classicos.map((produto) => <Cartao key={produto.id} produto={produto} />)}
                    </div>
                )}
                {recheados.length > 0 && (
                    <>
                        <h3>Recheados:</h3>
                        <div className="fileira fileira-recheados">
                            {recheados.map((produto) => <Cartao key={produto.id} produto={produto} />)}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}