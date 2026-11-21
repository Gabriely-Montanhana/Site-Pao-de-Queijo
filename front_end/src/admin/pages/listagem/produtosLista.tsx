import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, mensagemDaApi } from "../../../api/axios";
import { AdminLayout } from "../../componets/adminLayour";

const LIMITE = 5;

type ProdutoApi = {
    id: number;
    nome: string;
    descricao: string;
    preco: string | number;
    estoque: number;
    categoria_id?: number | null;
};

type CategoriaApi = {
    id: number;
    nome: string;
};

function formatarPreco(valor: number) {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function textoPesquisa(valor: string) {
    return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function LinhaProduto({
    produto,
    categoria,
    onExcluir,
}: {
    produto: ProdutoApi;
    categoria: string;
    onExcluir: (produto: ProdutoApi) => void;
}) {
    return (
        <tr>
            <td>{produto.nome}</td>
            <td>{produto.descricao}</td>
            <td>{categoria || "Sem categoria"}</td>
            <td>{formatarPreco(Number(produto.preco))}</td>
            <td>{produto.estoque}</td>
            <td>
                <div className="admin-acoes">
                    <Link className="btn btn-outline-secondary btn-sm rounded-pill" to={`/admin/produtos/${produto.id}/editar`}>Editar</Link>
                    <button className="btn btn-danger btn-sm rounded-pill" type="button" onClick={() => onExcluir(produto)}>Excluir</button>
                </div>
            </td>
        </tr>
    );
}

export function ProdutosLista() {
    const navigate = useNavigate();
    const [pagina, setPagina] = useState(1);
    const [busca, setBusca] = useState("");
    const [produtos, setProdutos] = useState<ProdutoApi[]>([]);
    const [categorias, setCategorias] = useState<Map<number, string>>(new Map());
    const [erro, setErro] = useState("");
    const [recarregar, setRecarregar] = useState(0);
    const [excluir, setExcluir] = useState<ProdutoApi | null>(null);
    const [excluindo, setExcluindo] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem("token")) navigate("/login", { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (!localStorage.getItem("token")) return;
        api.get<{ categorias: CategoriaApi[] }>("/api/categorias", { params: { limite: 100 } })
            .then((resposta) => {
                setCategorias(new Map(resposta.data.categorias.map((categoria) => [categoria.id, categoria.nome])));
            })
            .catch(() => setCategorias(new Map()));
    }, []);

    useEffect(() => {
        if (!localStorage.getItem("token")) return;
        api.get<{ produtos: ProdutoApi[] }>("/api/produtos", { params: { limite: 100 } })
            .then((resposta) => {
                setProdutos(resposta.data.produtos);
                setErro("");
            })
            .catch((falha: unknown) => setErro(mensagemDaApi(falha, "Não foi possível listar os produtos.")));
    }, [recarregar]);

    const termo = textoPesquisa(busca.trim());
    const filtrados = produtos.filter((produto) => {
        if (!termo) return true;
        return textoPesquisa(`${produto.nome} ${produto.descricao}`).includes(termo);
    });
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / LIMITE));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const visiveis = filtrados.slice((paginaAtual - 1) * LIMITE, paginaAtual * LIMITE);

    async function confirmarExclusao() {
        if (!excluir) return;
        setExcluindo(true);
        setErro("");
        try {
            await api.delete(`/api/produtos/${excluir.id}`);
            setExcluir(null);
            setRecarregar((atual) => atual + 1);
        } catch (falha) {
            setErro(mensagemDaApi(falha, "Não foi possível excluir o produto."));
            setExcluir(null);
        } finally {
            setExcluindo(false);
        }
    }

    return (
        <div className="admin-pagina">
            <AdminLayout />
            <section className="admin-conteudo">
                <div className="admin-topo">
                    <div className="admin-titulo-busca">
                        <h1>Produtos</h1>
                        <input
                            className="admin-busca"
                            type="search"
                            placeholder="Pesquisar"
                            value={busca}
                            aria-label="Pesquisar produtos"
                            onChange={(event) => {
                                setBusca(event.target.value);
                                setPagina(1);
                            }}
                        />
                    </div>
                    <Link className="btn btn-danger rounded-pill px-4" to="/admin/produtos/novo">Novo produto</Link>
                </div>
                {erro && <p className="field-error">{erro}</p>}
                <div className="admin-card">
                    <table className="admin-tabela">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Preço</th>
                                <th>Estoque</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visiveis.map((produto) => (
                                <LinhaProduto
                                    key={produto.id}
                                    produto={produto}
                                    categoria={categorias.get(produto.categoria_id ?? 0) ?? ""}
                                    onExcluir={setExcluir}
                                />
                            ))}
                        </tbody>
                    </table>
                    {visiveis.length === 0 && !erro && <p>Nenhum produto encontrado.</p>}
                    <div className="admin-paginas">
                        <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</button>
                        <span>Página {paginaAtual} de {totalPaginas}</span>
                        <button type="button" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</button>
                    </div>
                </div>
            </section>
            {excluir && (
                <div className="admin-confirma" role="dialog" aria-modal="true" aria-labelledby="confirma-exclusao">
                    <article>
                        <h2 id="confirma-exclusao">Excluir produto</h2>
                        <p>Confirma a exclusão de {excluir.nome}?</p>
                        <div className="d-flex justify-content-center flex-wrap gap-3">
                            <button className="btn btn-outline-secondary rounded-pill px-4" type="button" onClick={() => setExcluir(null)} disabled={excluindo}>Cancelar</button>
                            <button className="btn btn-danger rounded-pill px-4" type="button" onClick={confirmarExclusao} disabled={excluindo}>
                                {excluindo ? "Excluindo..." : "Excluir"}
                            </button>
                        </div>
                    </article>
                </div>
            )}
        </div>
    );
}
