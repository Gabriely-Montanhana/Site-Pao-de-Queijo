import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { api } from "../api/axios";
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


type ProdutoApi = {
    id: number;
    nome: string;
    descricao: string;
    preco: string | number;
    estoque: number;
    imagem?: string | null;
    categoria_id?: number | null;
    ativo?: boolean | number;
};

type CategoriaApi = {
    id: number;
    nome: string;
};

function formatarPreco(valor: number) {
    return `R$${valor.toFixed(2).replace(".", ",")}`;
}

function arquivoDaFoto(imagem: string | null | undefined, nome: string) {
    const enviado = (imagem ?? "").split("/").pop();
    if (enviado) return imagem ?? "";
    const texto = nome.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    const conhecido = ["goiabada", "calabresa", "requeijao", "frango", "chipa", "tradicional"]
        .find((item) => texto.includes(item));
    return conhecido ? `${conhecido}.jpeg` : "";
}

function urlImagem(imagem?: string | null) {
    const arquivo = (imagem ?? "").split("/").pop();
    return arquivo ? `/img/${arquivo}` : "/img/logo.png";
}

function grupoDaCategoria(nome: string) {
    const texto = nome.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    if (texto.includes("reche")) return "recheados";
    if (texto.includes("especial")) return "especiais";
    return "classicos";
}

function Cartao({ produto }: { produto: ProdutoVitrine }) {
    const { adicionar, itens } = useCarrinho();
    const noCarrinho = itens.find((item) => item.produtoId === produto.id)?.quantidade ?? 0;
    const esgotado = produto.estoque <= 0 || noCarrinho >= produto.estoque;

    return (
        <article className="sabor">
            <img src={urlImagem(produto.imagem)} alt="" />
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
    const [produtos, setProdutos] = useState<ProdutoVitrine[]>([]);
    const [erro, setErro] = useState("");
    const [pedirLogin, setPedirLogin] = useState(false);
    useEffect(() => {
        Promise.all([
            api.get<{ produtos: ProdutoApi[] }>("/api/produtos"),
            api.get<{ categorias: CategoriaApi[] }>("/api/categorias"),
        ])
            .then(([produtosResposta, categoriasResposta]) => {
                const nomes = new Map(categoriasResposta.data.categorias.map((categoria) => [categoria.id, categoria.nome]));
                setProdutos(produtosResposta.data.produtos
                    .filter((produto) => produto.ativo !== 0 && produto.ativo !== false)
                    .map((produto) => ({
                        id: produto.id,
                        nome: produto.nome,
                        descricao: produto.descricao,
                        preco: Number(produto.preco),
                        estoque: produto.estoque,
                        imagem: arquivoDaFoto(produto.imagem, produto.nome),
                        categoriaId: produto.categoria_id ?? 0,
                        categoriaNome: nomes.get(produto.categoria_id ?? 0) ?? "",
                    })));
            })
            .catch((falha: unknown) => {
                const semLogin = axios.isAxiosError(falha) && falha.response?.status === 401;
                setPedirLogin(semLogin);
                setErro(semLogin
                    ? "Entre na sua conta para ver os produtos."
                    : "Não foi possível carregar os sabores.");
            });
    }, []);

    const classicos = produtos.filter((produto) => grupoDaCategoria(produto.categoriaNome) === "classicos");
    const recheados = produtos.filter((produto) => grupoDaCategoria(produto.categoriaNome) === "recheados");
    const especiais = produtos.filter((produto) => grupoDaCategoria(produto.categoriaNome) === "especiais");

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
                {erro && (
                    <div className="sabores-aviso">
                        <p>{erro}</p>
                        {pedirLogin && (
                            <Link className="btn btn-danger rounded-pill px-4" to="/login">Entrar</Link>
                        )}
                    </div>
                )}
                {!erro && produtos.length === 0 && <p>Carregando sabores...</p>}
                {classicos.length > 0 && (
                    <>
                        <h3>Clássicos:</h3>
                        <div className="fileira fileira-classicos">
                            {classicos.map((produto) => <Cartao key={produto.id} produto={produto} />)}
                        </div>
                    </>
                )}
                {recheados.length > 0 && (
                    <>
                        <h3>Recheados:</h3>
                        <div className="fileira fileira-recheados">
                            {recheados.map((produto) => <Cartao key={produto.id} produto={produto} />)}
                        </div>
                    </>
                )}
                {especiais.length > 0 && (
                    <>
                        <h3>Especiais:</h3>
                        <div className="fileira fileira-recheados">
                            {especiais.map((produto) => <Cartao key={produto.id} produto={produto} />)}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}