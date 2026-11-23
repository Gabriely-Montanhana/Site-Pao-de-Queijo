import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, mensagemDaApi } from "../../../api/axios";
import { AdminLayout } from "../../componets/adminLayour";

// CRUD de categorias. A lista fica nesta tela e mostra cinco itens por página.
const LIMITE = 5;

type CategoriaApi = {
    id: number;
    nome: string;
};

function textoPesquisa(valor: string) {
    return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

// Função exclusiva desta listagem.
function LinhaCategoria({
    categoria,
    onExcluir,
}: {
    categoria: CategoriaApi;
    onExcluir: (categoria: CategoriaApi) => void;
}) {
    return (
        <tr>
            <td>{categoria.nome}</td>
            <td>
                <div className="admin-acoes">
                    <Link className="btn btn-outline-secondary btn-sm rounded-pill" to={`/admin/categorias/${categoria.id}/editar`}>Editar</Link>
                    <button className="btn btn-danger btn-sm rounded-pill" type="button" onClick={() => onExcluir(categoria)}>Excluir</button>
                </div>
            </td>
        </tr>
    );
}

export function CategoriasLista() {
    const navigate = useNavigate();
    const [pagina, setPagina] = useState(1);
    const [busca, setBusca] = useState("");
    const [categorias, setCategorias] = useState<CategoriaApi[]>([]);
    const [erro, setErro] = useState("");
    const [recarregar, setRecarregar] = useState(0);
    const [excluir, setExcluir] = useState<CategoriaApi | null>(null);
    const [excluindo, setExcluindo] = useState(false);
    const [bloqueio, setBloqueio] = useState("");

    useEffect(() => {
        if (!localStorage.getItem("token")) navigate("/login", { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (!localStorage.getItem("token")) return;
        api.get<{ categorias: CategoriaApi[] }>("/api/categorias", { params: { limite: 100 } })
            .then((resposta) => {
                setCategorias(resposta.data.categorias);
                setErro("");
            })
            .catch((falha: unknown) => setErro(mensagemDaApi(falha, "Não foi possível listar as categorias.")));
    }, [recarregar]);

    const termo = textoPesquisa(busca.trim());
    const filtradas = categorias.filter((categoria) => !termo || textoPesquisa(categoria.nome).includes(termo));
    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / LIMITE));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const visiveis = filtradas.slice((paginaAtual - 1) * LIMITE, paginaAtual * LIMITE);

    async function confirmarExclusao() {
        if (!excluir) return;
        setExcluindo(true);
        setErro("");
        setBloqueio("");
        try {
            const resposta = await api.get<{ produtos: { categoria_id?: number | null }[]; paginacao?: { totalPaginas: number } }>("/api/produtos", {
                params: { pagina: 1, limite: 100 },
            });
            const produtos = [...resposta.data.produtos];
            const totalPaginas = resposta.data.paginacao?.totalPaginas ?? 1;
            for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
                const proxima = await api.get<{ produtos: { categoria_id?: number | null }[] }>("/api/produtos", {
                    params: { pagina, limite: 100 },
                });
                produtos.push(...proxima.data.produtos);
            }
            if (produtos.some((produto) => produto.categoria_id === excluir.id)) {
                setBloqueio("Não é possível excluir uma categoria que possui produtos.");
                return;
            }
            await api.delete(`/api/categorias/${excluir.id}`);
            setExcluir(null);
            setRecarregar((atual) => atual + 1);
        } catch (falha) {
            setBloqueio(mensagemDaApi(falha, "Não foi possível excluir a categoria."));
        } finally {
            setExcluindo(false);
        }
    }

    function pedirExclusao(categoria: CategoriaApi) {
        setBloqueio("");
        setExcluir(categoria);
    }

    return (
        <div className="admin-pagina">
            <AdminLayout />
            <section className="admin-conteudo">
                <div className="admin-topo">
                    <div className="admin-titulo-busca">
                        <h1>Categorias</h1>
                        <input
                            className="admin-busca"
                            type="search"
                            placeholder="Pesquisar"
                            value={busca}
                            aria-label="Pesquisar categorias"
                            onChange={(event) => {
                                setBusca(event.target.value);
                                setPagina(1);
                            }}
                        />
                    </div>
                    <Link className="btn btn-danger rounded-pill px-4" to="/admin/categorias/novo">Nova categoria</Link>
                </div>
                {erro && <p className="field-error">{erro}</p>}
                <div className="admin-card">
                    <table className="admin-tabela">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visiveis.map((categoria) => (
                                <LinhaCategoria key={categoria.id} categoria={categoria} onExcluir={pedirExclusao} />
                            ))}
                        </tbody>
                    </table>
                    {visiveis.length === 0 && !erro && <p>Nenhuma categoria encontrada.</p>}
                    {/* Paginação da listagem de categorias. */}
                    <div className="admin-paginas">
                        <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</button>
                        <span>Página {paginaAtual} de {totalPaginas}</span>
                        <button type="button" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</button>
                    </div>
                </div>
            </section>
            {excluir && (
                <div className="admin-confirma" role="dialog" aria-modal="true" aria-labelledby="confirma-exclusao-categoria">
                    <article>
                        <h2 id="confirma-exclusao-categoria">{bloqueio ? "Categoria não excluída" : "Excluir categoria"}</h2>
                        <p>{bloqueio || `Confirma a exclusão de ${excluir.nome}?`}</p>
                        <div className="d-flex justify-content-center flex-wrap gap-3">
                            <button className="btn btn-outline-secondary rounded-pill px-4" type="button" onClick={() => setExcluir(null)} disabled={excluindo}>
                                {bloqueio ? "Fechar" : "Cancelar"}
                            </button>
                            {!bloqueio && (
                                <button className="btn btn-danger rounded-pill px-4" type="button" onClick={confirmarExclusao} disabled={excluindo}>
                                    {excluindo ? "Excluindo..." : "Excluir"}
                                </button>
                            )}
                        </div>
                    </article>
                </div>
            )}
        </div>
    );
}
