import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensagemDaApi } from "../../../api/axios";
import { Campo } from "../../../components/campo";
import { AdminLayout } from "../../componets/adminLayour";
import { validarVenda, type VendaForm } from "../../../validacao";

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

export function VendaCadastro() {
    const navigate = useNavigate();
    const { id } = useParams();
    const editando = Boolean(id);
    const [form, setForm] = useState<VendaForm>(vazio);
    const [erros, setErros] = useState<Partial<VendaForm>>({});
    const [erroApi, setErroApi] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        if (!aviso) return;
        const tempo = setTimeout(() => navigate("/admin/vendas"), 2000);
        return () => clearTimeout(tempo);
    }, [aviso, navigate]);

    useEffect(() => {
        if (!localStorage.getItem("token")) navigate("/login", { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (!id || !localStorage.getItem("token")) return;
        api.get<{ pedidos: PedidoApi[]; paginacao?: { totalPaginas: number } }>("/api/pedidos", { params: { pagina: 1, limite: 100 } })
            .then(async (resposta) => {
                const pedidos = [...resposta.data.pedidos];
                const totalPaginas = resposta.data.paginacao?.totalPaginas ?? 1;
                for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
                    const proxima = await api.get<{ pedidos: PedidoApi[] }>("/api/pedidos", { params: { pagina, limite: 100 } });
                    pedidos.push(...proxima.data.pedidos);
                }
                const pedido = pedidos.find((item) => item.id === Number(id));
                if (!pedido) {
                    setErroApi("Venda não encontrada.");
                    return;
                }
                setForm({
                    status: pedido.status,
                    valorTotal: Number(pedido.valor_total).toFixed(2).replace(".", ","),
                });
            })
            .catch((falha: unknown) => setErroApi(mensagemDaApi(falha, "Não foi possível carregar a venda.")));
    }, [id]);

    const opcoes = STATUS.some((item) => item.valor === form.status) || !form.status
        ? STATUS
        : [...STATUS, { valor: form.status, rotulo: form.status }];

    async function salvar(event: FormEvent) {
        event.preventDefault();
        setErroApi("");
        const encontrados = validarVenda(form);
        setErros(encontrados);
        if (Object.keys(encontrados).length > 0) return;

        setEnviando(true);
        try {
            const corpo = {
                status: form.status.trim(),
                valorTotal: Number(form.valorTotal.replace(",", ".")),
            };
            if (editando) await api.put(`/api/pedidos/${id}`, corpo);
            else await api.post("/api/pedidos", corpo);
            setAviso(editando ? "Venda atualizada com sucesso." : "Venda cadastrada com sucesso.");
        } catch (falha) {
            setErroApi(mensagemDaApi(falha, editando ? "Não foi possível salvar a venda." : "Não foi possível cadastrar a venda."));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="admin-pagina">
            <AdminLayout />
            <section className="admin-conteudo">
                <h1>{editando ? "Editar venda" : "Nova venda"}</h1>
                <p>{editando ? "Altere o status e salve." : "Registre uma nova venda."}</p>
                <form className="admin-card admin-form" onSubmit={salvar} noValidate>
                    {erroApi && <p className="field-error">{erroApi}</p>}
                    <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="venda-status">Status</label>
                        <select
                            id="venda-status"
                            className="form-select"
                            value={form.status}
                            aria-invalid={Boolean(erros.status)}
                            onChange={(event) => setForm({ ...form, status: event.target.value })}
                        >
                            <option value="">Selecione o status</option>
                            {opcoes.map((item) => (
                                <option key={item.valor} value={item.valor}>{item.rotulo}</option>
                            ))}
                        </select>
                        {erros.status && <span className="campo-erro">{erros.status}</span>}
                    </div>
                    <Campo
                        id="venda-valor"
                        label="Valor"
                        value={form.valorTotal}
                        erro={erros.valorTotal}
                        inputMode="text"
                        disabled={editando}
                        onChange={(valorTotal) => setForm({ ...form, valorTotal })}
                    />
                    <div className="d-flex flex-wrap gap-3">
                        <button className="btn btn-danger rounded-pill px-4" type="submit" disabled={enviando}>
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
