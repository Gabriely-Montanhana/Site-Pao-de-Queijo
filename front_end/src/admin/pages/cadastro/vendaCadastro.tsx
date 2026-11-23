import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensagemDaApi } from "../../../api/axios";
import { Campo } from "../../../components/campo";
import { AdminLayout } from "../../componets/adminLayour";
import { type VendaForm } from "../../../validacao";

// Tela separada da lista: cria ou edita uma venda.
const STATUS = [
    { valor: "pendente", rotulo: "Pendente" },
    { valor: "pago", rotulo: "Pago" },
    { valor: "enviado", rotulo: "Enviado" },
    { valor: "entregue", rotulo: "Entregue" },
    { valor: "cancelado", rotulo: "Cancelado" },
];

const vazio: VendaForm = {
    status: "",
    valorTotal: "",
};

type PedidoApi = {
    id: number;
    status: string;
    valor_total: string | number;
};

type ProdutoApi = {
    id: number;
    nome: string;
    preco: string | number;
    estoque: number;
};

type Lista<T extends string, Item> = {
    [chave in T]: Item[];
} & {
    paginacao?: { totalPaginas: number };
};

function formatarPreco(valor: string | number) {
    return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

function opcoesDoStatus(atual: string) {
    if (atual === "cancelado") return STATUS.filter((item) => item.valor === "cancelado");
    if (atual === "pendente") return STATUS;
    return STATUS.filter((item) => item.valor !== "cancelado");
}

async function listarTudo<T>(caminho: string, chave: "produtos" | "pedidos") {
    const resposta = await api.get<Lista<typeof chave, T>>(caminho, { params: { pagina: 1, limite: 100 } });
    const lista = [...(resposta.data[chave] ?? [])];
    const totalPaginas = resposta.data.paginacao?.totalPaginas ?? 1;
    for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
        const proxima = await api.get<Lista<typeof chave, T>>(caminho, { params: { pagina, limite: 100 } });
        lista.push(...(proxima.data[chave] ?? []));
    }
    return lista;
}

export function VendaCadastro() {
    const navigate = useNavigate();
    const { id } = useParams();
    const editando = Boolean(id);
    const [form, setForm] = useState<VendaForm>(vazio);
    const [produtos, setProdutos] = useState<ProdutoApi[]>([]);
    const [produtoId, setProdutoId] = useState("");
    const [quantidade, setQuantidade] = useState("1");
    const [erroStatus, setErroStatus] = useState("");
    const [erroApi, setErroApi] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        if (!localStorage.getItem("token")) navigate("/login", { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (!aviso) return;
        const tempo = setTimeout(() => navigate("/admin/vendas"), 2000);
        return () => clearTimeout(tempo);
    }, [aviso, navigate]);

    useEffect(() => {
        if (!localStorage.getItem("token") || editando) return;
        listarTudo<ProdutoApi>("/api/produtos", "produtos")
            .then(setProdutos)
            .catch((falha: unknown) => setErroApi(mensagemDaApi(falha, "Não foi possível carregar os produtos.")));
    }, [editando]);

    useEffect(() => {
        if (!id || !localStorage.getItem("token")) return;
        let ativo = true;
        listarTudo<PedidoApi>("/api/admin/pedidos", "pedidos")
            .then((pedidos) => {
                if (!ativo) return;
                const pedido = pedidos.find((item) => item.id === Number(id));
                if (!pedido) {
                    setErroApi("Venda não encontrada.");
                    return;
                }
                setForm({
                    status: pedido.status,
                    valorTotal: formatarPreco(pedido.valor_total),
                });
            })
            .catch((falha: unknown) => {
                if (ativo) setErroApi(mensagemDaApi(falha, "Não foi possível carregar a venda."));
            });
        return () => {
            ativo = false;
        };
    }, [id]);

    async function salvar(event: FormEvent) {
        event.preventDefault();
        setErroApi("");
        setErroStatus("");

        if (editando) {
            if (!form.status.trim()) {
                setErroStatus("O status é obrigatório.");
                return;
            }
        } else {
            const quantidadeNumero = Number(quantidade);
            if (!produtoId || !Number.isInteger(quantidadeNumero) || quantidadeNumero <= 0) {
                setErroApi("Selecione um produto e informe uma quantidade válida.");
                return;
            }
            const produtoSelecionado = produtos.find((produto) => produto.id === Number(produtoId));
            if (!produtoSelecionado || quantidadeNumero > produtoSelecionado.estoque) {
                setErroApi("Produto indisponível ou estoque insuficiente.");
                return;
            }
        }

        setEnviando(true);
        try {
            if (editando) {
                await api.put(`/api/pedidos/${id}`, { status: form.status.trim() });
            } else {
                await api.post("/api/pedidos", {
                    itens: [{ produtoId: Number(produtoId), quantidade: Number(quantidade) }],
                });
            }
            setAviso(editando ? "Venda atualizada com sucesso." : "Venda cadastrada com sucesso.");
        } catch (falha) {
            setErroApi(mensagemDaApi(falha, editando ? "Não foi possível salvar a venda." : "Não foi possível cadastrar a venda."));
        } finally {
            setEnviando(false);
        }
    }

    const opcoes = opcoesDoStatus(form.status);

    return (
        <div className="admin-pagina">
            <AdminLayout />
            <section className="admin-conteudo">
                <h1>{editando ? "Editar venda" : "Nova venda"}</h1>
                <p>{editando ? "Altere o status e salve." : "Escolha o produto e a quantidade. O valor é calculado pelo preço atual."}</p>
                <form className="admin-card admin-form" onSubmit={salvar} noValidate>
                    {erroApi && <p className="field-error">{erroApi}</p>}
                    {!editando && (
                        <>
                            <div className="mb-3">
                                <label className="form-label fw-semibold" htmlFor="venda-produto">Produto</label>
                                <select
                                    id="venda-produto"
                                    className="form-select"
                                    value={produtoId}
                                    onChange={(event) => setProdutoId(event.target.value)}
                                >
                                    <option value="">Selecione um produto</option>
                                    {produtos.map((produto) => (
                                        <option key={produto.id} value={produto.id}>
                                            {produto.nome} — {formatarPreco(produto.preco)} (Estoque: {produto.estoque})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-semibold" htmlFor="venda-quantidade">Quantidade</label>
                                <input
                                    id="venda-quantidade"
                                    className="form-control"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={quantidade}
                                    onChange={(event) => setQuantidade(event.target.value)}
                                />
                            </div>
                        </>
                    )}
                    {editando && (
                        <>
                            <div className="mb-3">
                                <label className="form-label fw-semibold" htmlFor="venda-status">Status</label>
                                <select
                                    id="venda-status"
                                    className="form-select"
                                    value={form.status}
                                    aria-invalid={Boolean(erroStatus)}
                                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                                >
                                    <option value="">Selecione o status</option>
                                    {opcoes.map((item) => (
                                        <option key={item.valor} value={item.valor}>{item.rotulo}</option>
                                    ))}
                                </select>
                                {erroStatus && <span className="campo-erro">{erroStatus}</span>}
                                {form.status === "cancelado" && <p>Um pedido cancelado não pode ser reativado.</p>}
                                {form.status !== "" && form.status !== "pendente" && form.status !== "cancelado" && (
                                    <p>Este pedido não pode ser cancelado.</p>
                                )}
                            </div>
                            <Campo
                                id="venda-valor"
                                label="Valor"
                                value={form.valorTotal}
                                disabled
                                onChange={() => undefined}
                            />
                        </>
                    )}
                    <div className="d-flex flex-wrap gap-3">
                        <button className="btn btn-danger rounded-pill px-4" type="submit" disabled={enviando || form.status === "cancelado"}>
                            {enviando ? "Salvando..." : editando ? "Salvar" : "Cadastrar"}
                        </button>
                        <Link className="btn btn-outline-secondary rounded-pill px-4" to="/admin/vendas">Voltar</Link>
                    </div>
                </form>
            </section>
            {aviso && (
                <div className="admin-confirma" role="status" aria-live="polite">
                    <article>
                        <h2>{editando ? "Venda editada" : "Venda cadastrada"}</h2>
                        <p>{aviso}</p>
                    </article>
                </div>
            )}
        </div>
    );
}
