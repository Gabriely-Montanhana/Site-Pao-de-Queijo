import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, mensagemDaApi } from "../../../api/axios";
import { lerDetalhePedido } from "../../../detalhesPedido";
import { mascaraCpf } from "../../../validacao";
import { AdminLayout } from "../../componets/adminLayour";

const LIMITE = 5;

const STATUS: Record<string, string> = {
    pendente: "Pendente",
    pago: "Pago",
    enviado: "Enviado",
    entregue: "Entregue",
    cancelado: "Cancelado",
};

type PedidoApi = {
    id: number;
    usuario_id?: number;
    usuario_nome?: string | null;
    usuario_email?: string | null;
    usuario_cpf?: string | null;
    enderecos?: EnderecoApi[];
    status: string;
    valor_total: string | number;
    createdAt?: string;
};

type EnderecoApi = {
    id: number;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
};

type UsuarioLocal = {
    id?: number;
    nome?: string;
    email?: string;
    cpf?: string;
};

type ListaPedidos = {
    pedidos: PedidoApi[];
    paginacao?: { totalPaginas: number };
};

function textoPesquisa(valor: string) {
    return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function formatarPreco(valor: string | number) {
    return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

function rotuloStatus(status: string) {
    return STATUS[status] ?? status;
}

function formatarData(valor?: string) {
    if (!valor) return "—";
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return "—";
    return data.toLocaleDateString("pt-BR");
}

function formatarCep(cep: string) {
    const digitos = cep.replace(/\D/g, "");
    if (digitos.length !== 8) return cep;
    return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

function lerUsuario(): UsuarioLocal | null {
    try {
        const texto = localStorage.getItem("usuario");
        return texto ? JSON.parse(texto) as UsuarioLocal : null;
    } catch {
        return null;
    }
}

function nomeDaVenda(pedido: PedidoApi) {
    if (pedido.usuario_nome) return pedido.usuario_nome;
    const usuario = lerUsuario();
    if (!usuario?.nome) return "—";
    if (usuario.id != null && pedido.usuario_id != null && usuario.id !== pedido.usuario_id) return "—";
    return usuario.nome;
}

function textoEndereco(endereco: EnderecoApi) {
    return `${endereco.rua}, ${endereco.numero} — ${endereco.bairro}, ${endereco.cidade}/${endereco.estado} — CEP ${formatarCep(endereco.cep)}`;
}

function LinhaVenda({
    pedido,
    onVer,
    onExcluir,
}: {
    pedido: PedidoApi;
    onVer: (pedido: PedidoApi) => void;
    onExcluir: (pedido: PedidoApi) => void;
}) {
    return (
        <tr>
            <td>#{pedido.id}</td>
            <td>{nomeDaVenda(pedido)}</td>
            <td>{rotuloStatus(pedido.status)}</td>
            <td>{formatarPreco(pedido.valor_total)}</td>
            <td>{formatarData(pedido.createdAt)}</td>
            <td>
                <div className="admin-acoes">
                    <button className="btn btn-outline-secondary btn-sm rounded-pill" type="button" onClick={() => onVer(pedido)}>Visualizar</button>
                    <Link className="btn btn-outline-secondary btn-sm rounded-pill" to={`/admin/vendas/${pedido.id}/editar`}>Editar</Link>
                    <button className="btn btn-danger btn-sm rounded-pill" type="button" onClick={() => onExcluir(pedido)}>Excluir</button>
                </div>
            </td>
        </tr>
    );
}

function DetalheVenda({
    pedido,
    onFechar,
}: {
    pedido: PedidoApi;
    onFechar: () => void;
}) {
    const usuario = lerUsuario();
    const [enderecosConta, setEnderecosConta] = useState<EnderecoApi[] | null>(pedido.enderecos ?? null);
    const [erroEndereco, setErroEndereco] = useState("");
    const nome = pedido.usuario_nome || (usuario && usuario.id === pedido.usuario_id ? usuario.nome : "");
    const email = pedido.usuario_email || (usuario && usuario.id === pedido.usuario_id ? usuario.email : "");
    const cpf = pedido.usuario_cpf || (usuario && usuario.id === pedido.usuario_id ? usuario.cpf : "");
    const enderecos = pedido.enderecos ?? enderecosConta ?? [];
    const itens = lerDetalhePedido(pedido.id);

    useEffect(() => {
        if (pedido.enderecos) return;
        let ativo = true;
        api.get<{ enderecos: EnderecoApi[]; paginacao?: { totalPaginas: number } }>("/api/enderecos", { params: { pagina: 1, limite: 100 } })
            .then(async (resposta) => {
                const lista = [...resposta.data.enderecos];
                const totalPaginas = resposta.data.paginacao?.totalPaginas ?? 1;
                for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
                    const proxima = await api.get<{ enderecos: EnderecoApi[] }>("/api/enderecos", { params: { pagina, limite: 100 } });
                    lista.push(...proxima.data.enderecos);
                }
                if (ativo) setEnderecosConta(lista);
            })
            .catch((falha: unknown) => {
                if (ativo) setErroEndereco(mensagemDaApi(falha, "Não foi possível carregar o endereço."));
            });
        return () => {
            ativo = false;
        };
    }, [pedido]);

    return (
        <div className="admin-confirma" role="dialog" aria-modal="true" aria-labelledby="detalhe-venda">
            <article className="admin-detalhe">
                <h2 id="detalhe-venda">Venda #{pedido.id}</h2>
                <p>Status: {rotuloStatus(pedido.status)} · {formatarData(pedido.createdAt)} · {formatarPreco(pedido.valor_total)}</p>
                <h3>Quem pediu</h3>
                {nome || email || cpf ? (
                    <ul>
                        <li>{nome || "Nome não informado"}</li>
                        <li>{email || "E-mail não informado"}</li>
                        <li>{cpf ? mascaraCpf(cpf) : "CPF não informado"}</li>
                    </ul>
                ) : (
                    <p>Não foi possível identificar quem pediu.</p>
                )}
                <h3>Endereço</h3>
                {erroEndereco && <p>{erroEndereco}</p>}
                {!erroEndereco && !pedido.enderecos && !enderecosConta && <p>Carregando endereço...</p>}
                {!erroEndereco && (pedido.enderecos || enderecosConta) && enderecos.length === 0 && <p>Nenhum endereço cadastrado.</p>}
                {enderecos.length > 0 && (
                    <ul>
                        {enderecos.map((endereco) => (
                            <li key={endereco.id}>{textoEndereco(endereco)}</li>
                        ))}
                    </ul>
                )}
                <h3>O que foi pedido</h3>
                {itens && itens.length > 0 ? (
                    <ul>
                        {itens.map((item, indice) => (
                            <li key={`${item.nome}-${indice}`}>
                                {item.nome} · {item.quantidade} un. · {formatarPreco(item.preco * item.quantidade)}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Os produtos desta venda não foram registrados.</p>
                )}
                <div className="d-flex justify-content-center">
                    <button className="btn btn-outline-secondary rounded-pill px-4" type="button" onClick={onFechar}>Fechar</button>
                </div>
            </article>
        </div>
    );
}

export function VendasLista() {
    const navigate = useNavigate();
    const [pagina, setPagina] = useState(1);
    const [busca, setBusca] = useState("");
    const [pedidos, setPedidos] = useState<PedidoApi[]>([]);
    const [erro, setErro] = useState("");
    const [recarregar, setRecarregar] = useState(0);
    const [excluir, setExcluir] = useState<PedidoApi | null>(null);
    const [excluindo, setExcluindo] = useState(false);
    const [ver, setVer] = useState<PedidoApi | null>(null);

    useEffect(() => {
        if (!localStorage.getItem("token")) navigate("/login", { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (!localStorage.getItem("token")) return;
        let ativo = true;
        async function carregar() {
            try {
                const resposta = await api.get<ListaPedidos>("/api/pedidos", { params: { pagina: 1, limite: 100 } });
                const lista = [...resposta.data.pedidos];
                const totalPaginas = resposta.data.paginacao?.totalPaginas ?? 1;
                for (let paginaLista = 2; paginaLista <= totalPaginas; paginaLista += 1) {
                    const proxima = await api.get<ListaPedidos>("/api/pedidos", { params: { pagina: paginaLista, limite: 100 } });
                    lista.push(...proxima.data.pedidos);
                }
                if (!ativo) return;
                setPedidos(lista);
                setErro("");
            } catch (falha) {
                if (ativo) setErro(mensagemDaApi(falha, "Não foi possível listar as vendas."));
            }
        }
        carregar();
        return () => {
            ativo = false;
        };
    }, [recarregar]);

    const termo = textoPesquisa(busca.trim());
    const filtradas = pedidos.filter((pedido) => {
        if (!termo) return true;
        const texto = textoPesquisa(`${pedido.id} ${nomeDaVenda(pedido)} ${pedido.status} ${rotuloStatus(pedido.status)} ${formatarPreco(pedido.valor_total)}`);
        return texto.includes(termo);
    });
    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / LIMITE));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const visiveis = filtradas.slice((paginaAtual - 1) * LIMITE, paginaAtual * LIMITE);

    async function confirmarExclusao() {
        if (!excluir) return;
        setExcluindo(true);
        setErro("");
        try {
            await api.delete(`/api/pedidos/${excluir.id}`);
            setExcluir(null);
            setRecarregar((atual) => atual + 1);
        } catch (falha) {
            setErro(mensagemDaApi(falha, "Não foi possível excluir a venda."));
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
                        <h1>Vendas</h1>
                        <input
                            className="admin-busca"
                            type="search"
                            placeholder="Pesquisar"
                            value={busca}
                            aria-label="Pesquisar vendas"
                            onChange={(event) => {
                                setBusca(event.target.value);
                                setPagina(1);
                            }}
                        />
                    </div>
                    <Link className="btn btn-danger rounded-pill px-4" to="/admin/vendas/novo">Nova venda</Link>
                </div>
                {erro && <p className="field-error">{erro}</p>}
                <div className="admin-card">
                    <table className="admin-tabela">
                        <thead>
                            <tr>
                                <th>Pedido</th>
                                <th>Usuário</th>
                                <th>Status</th>
                                <th>Valor</th>
                                <th>Data</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visiveis.map((pedido) => (
                                <LinhaVenda key={pedido.id} pedido={pedido} onVer={setVer} onExcluir={setExcluir} />
                            ))}
                        </tbody>
                    </table>
                    {visiveis.length === 0 && !erro && <p>Nenhuma venda encontrada.</p>}
                    <div className="admin-paginas">
                        <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</button>
                        <span>Página {paginaAtual} de {totalPaginas}</span>
                        <button type="button" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</button>
                    </div>
                </div>
            </section>
            {ver && (
                <DetalheVenda
                    pedido={ver}
                    onFechar={() => setVer(null)}
                />
            )}
            {excluir && (
                <div className="admin-confirma" role="dialog" aria-modal="true" aria-labelledby="confirma-exclusao-venda">
                    <article>
                        <h2 id="confirma-exclusao-venda">Excluir venda</h2>
                        <p>Confirma a exclusão da venda #{excluir.id}?</p>
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
