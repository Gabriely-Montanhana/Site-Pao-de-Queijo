import { useState } from "react";
// import { useEffect } from "react";
// import { api, mensagemDaApi } from "../api/axios";
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

const PRODUTOS_EXEMPLO: ProdutoVitrine[] = [
    { id: 1, nome: "Pão de Queijo Tradicional", descricao: "", preco: 30, estoque: 50, imagem: "img/tradicional.jpeg", categoriaId: 1, categoriaNome: "Classicos" },
    { id: 2, nome: "Chipa", descricao: "", preco: 30, estoque: 40, imagem: "img/chipa.jpeg", categoriaId: 3, categoriaNome: "Classicos" },
    { id: 3, nome: "Pão de Queijo de Frango", descricao: "", preco: 34, estoque: 35, imagem: "img/frango.jpeg", categoriaId: 2, categoriaNome: "Recheados" },
    { id: 4, nome: "Pão de Queijo de Requeijão", descricao: "", preco: 34, estoque: 30, imagem: "img/requeijao.jpeg", categoriaId: 2, categoriaNome: "Recheados" },
    { id: 5, nome: "Pão de Queijo de Calabresa", descricao: "", preco: 34, estoque: 25, imagem: "img/calabresa.jpeg", categoriaId: 2, categoriaNome: "Recheados" },
    { id: 6, nome: "Pão de Queijo de Goiabada", descricao: "", preco: 34, estoque: 20, imagem: "img/goiabada.jpeg", categoriaId: 3, categoriaNome: "Recheados" },
];

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
            <strong>{produto.nome}</strong>
            <span>({formatarPreco(produto.preco)})</span>
            <button
                className="btn btn-danger rounded-pill px-4"
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
    const [produtos] = useState<ProdutoVitrine[]>(PRODUTOS_EXEMPLO);
    const [erro] = useState("");

    // Para voltar ao banco, apague PRODUTOS_EXEMPLO, use useState([]) e descomente isto:
    // const [produtos, setProdutos] = useState<ProdutoVitrine[]>([]);
    // const [erro, setErro] = useState("");
    // useEffect(() => {
    //     api.get<ProdutoVitrine[]>("/api/vitrine/produtos")
    //         .then((resposta) => setProdutos(resposta.data))
    //         .catch((falha: unknown) => setErro(mensagemDaApi(falha, "Não foi possível carregar os sabores.")));
    // }, []);

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
                <path fill="#e7b16b" fillRule="evenodd" d="M0 0h1440v120H0Z M0 58c180 62 340-8 560 8 210 16 330 54 520 18 150-28 250-6 360 8v28H0Z" />
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