import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { api } from "../../api/axios";
import { AdminLayout } from "../componets/adminLayour";

type NivelEstoque = "critico" | "baixo" | "normal";

type DashboardDados = {
    faturamento: number;
    pedidos: number;
    clientes: number;
    produtosAtivos: number | null;
    ranking: { nome: string; quantidade: number; faturamento: number }[];
    estoque: { nome: string; estoque: number; nivel: NivelEstoque }[];
};

function formatarPreco(valor: number) {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

const nivelTexto: Record<NivelEstoque, string> = {
    critico: "Crítico",
    baixo: "Baixo",
    normal: "Normal",
};

type PedidoApi = {
    usuario_id?: number;
    valor_total?: string | number;
};

type ProdutoApi = {
    nome: string;
    estoque: number;
    ativo?: number | boolean;
};

function nivelDoEstoque(estoque: number): NivelEstoque {
    if (estoque <= 10) return "critico";
    if (estoque <= 20) return "baixo";
    return "normal";
}

export function Dashboard() {
    const [dados, setDados] = useState<DashboardDados | null>(null);
    const [erro, setErro] = useState("");
    const [pedirLogin, setPedirLogin] = useState(false);

    useEffect(() => {
        api.get<{ pedidos: PedidoApi[] }>("/api/pedidos")
            .then(async (pedidosResposta) => {
                const pedidos = pedidosResposta.data.pedidos ?? [];
                let estoque: DashboardDados["estoque"] = [];
                let produtosAtivos: number | null = null;
                try {
                    const produtosResposta = await api.get<{ produtos: ProdutoApi[] }>("/api/produtos");
                    const ativos = (produtosResposta.data.produtos ?? [])
                        .filter((produto) => produto.ativo !== 0 && produto.ativo !== false);
                    produtosAtivos = ativos.length;
                    estoque = ativos
                        .map((produto) => ({
                            nome: produto.nome,
                            estoque: Number(produto.estoque),
                            nivel: nivelDoEstoque(Number(produto.estoque)),
                        }))
                        .sort((a, b) => a.estoque - b.estoque || a.nome.localeCompare(b.nome));
                } catch {
                    produtosAtivos = null;
                }
                const clientes = new Set(pedidos.map((pedido) => pedido.usuario_id).filter((id) => id != null)).size;
                setDados({
                    faturamento: pedidos.reduce((soma, pedido) => soma + Number(pedido.valor_total ?? 0), 0),
                    pedidos: pedidos.length,
                    clientes,
                    produtosAtivos,
                    ranking: [],
                    estoque,
                });
            })
            .catch((falha: unknown) => {
                const semLogin = axios.isAxiosError(falha) && falha.response?.status === 401;
                setPedirLogin(semLogin);
                setErro(semLogin
                    ? "Entre na sua conta para ver o dashboard."
                    : "Não foi possível carregar o dashboard.");
            });
    }, []);

    const maisVendido = dados?.ranking[0];
    const criticos = dados?.estoque.filter((item) => item.nivel === "critico") ?? [];

    return (
        <div className="admin-pagina">
            <AdminLayout />
            <section className="admin-conteudo">
                <h1>Dashboard de vendas</h1>
                <p>Indicadores lidos do banco da loja.</p>
                {erro && (
                    <div className="admin-aviso">
                        <p>{erro}</p>
                        {pedirLogin && <Link className="btn btn-danger rounded-pill px-4" to="/login">Entrar</Link>}
                    </div>
                )}
                {!erro && !dados && <p>Carregando indicadores...</p>}
                {dados && (
                    <>
                        <div className="admin-cards">
                            <article className="admin-card">
                                <span>Faturamento</span>
                                <strong>{formatarPreco(dados.faturamento)}</strong>
                            </article>
                            <article className="admin-card">
                                <span>Pedidos</span>
                                <strong>{dados.pedidos}</strong>
                            </article>
                            <article className="admin-card">
                                <span>Clientes</span>
                                <strong>{dados.clientes}</strong>
                            </article>
                            <article className="admin-card">
                                <span>Produtos ativos</span>
                                <strong>{dados.produtosAtivos ?? "—"}</strong>
                            </article>
                        </div>
                        <div className="admin-paineis">
                            <article className="admin-card admin-painel">
                                <h2>Ranking de produtos</h2>
                                <p>Produtos ordenados pela quantidade vendida.</p>
                                {maisVendido && <strong>Mais vendido: {maisVendido.nome}</strong>}
                                {dados.ranking.length === 0 && <p>Nenhum produto vendido por item ainda.</p>}
                                {dados.ranking.map((item) => (
                                    <div className="admin-linha" key={item.nome}>
                                        <span>{item.nome}</span>
                                        <small>{item.quantidade} un. · {formatarPreco(item.faturamento)}</small>
                                    </div>
                                ))}
                            </article>
                            <article className="admin-card admin-painel">
                                <h2>Estoque</h2>
                                <p>Quantidade disponível por produto.</p>
                                {dados.estoque.length === 0 && dados.produtosAtivos === null && <p>O estoque não pôde ser lido agora.</p>}
                                {dados.estoque.map((item) => (
                                    <div className="admin-linha" key={item.nome}>
                                        <span>{item.nome}</span>
                                        <small className={`admin-nivel ${item.nivel}`}>{item.estoque} · {nivelTexto[item.nivel]}</small>
                                    </div>
                                ))}
                                {dados.produtosAtivos !== null && (
                                    <p>{criticos.length === 0 ? "Nenhum produto com estoque crítico." : `${criticos.length} com estoque crítico.`}</p>
                                )}
                            </article>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
