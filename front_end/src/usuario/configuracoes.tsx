import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, mensagemDaApi } from "../api/axios";
import { Campo } from "../components/campo";
import { lerDetalhePedido } from "../detalhesPedido";
import { mascaraCpf, validarEdicaoUsuario, type CadastroForm, type ErrosCadastro } from "../validacao";
import { ContaMenu } from "./contaMenu";
import { useUsuario, type Usuario } from "./contextoUsuario";

const STATUS: Record<string, string> = {
    pendente: "Pendente",
    pago: "Pago",
    enviado: "Enviado",
    entregue: "Entregue",
    cancelado: "Cancelado",
};

type PedidoApi = {
    id: number;
    status: string;
    valor_total: string | number;
    createdAt?: string;
};

function formatarPreco(valor: string | number) {
    return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

function formatarData(valor?: string) {
    if (!valor) return "";
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return "";
    return data.toLocaleDateString("pt-BR");
}

// Função exclusiva desta página: a lista de pedidos não é um componente compartilhado.
function PedidosFeitos() {
    const [pedidos, setPedidos] = useState<PedidoApi[]>([]);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        let ativo = true;
        async function carregar() {
            try {
                const resposta = await api.get<{ pedidos: PedidoApi[]; paginacao?: { totalPaginas: number } }>("/api/pedidos", {
                    params: { pagina: 1, limite: 100 },
                });
                const lista = [...resposta.data.pedidos];
                const totalPaginas = resposta.data.paginacao?.totalPaginas ?? 1;
                for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
                    const proxima = await api.get<{ pedidos: PedidoApi[] }>("/api/pedidos", { params: { pagina, limite: 100 } });
                    lista.push(...proxima.data.pedidos);
                }
                if (!ativo) return;
                setPedidos(lista);
                setErro("");
            } catch (falha) {
                if (ativo) setErro(mensagemDaApi(falha, "Não foi possível carregar os pedidos."));
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        carregar();
        return () => {
            ativo = false;
        };
    }, []);

    if (carregando) return <p>Carregando pedidos...</p>;
    if (erro) return <p className="ml-alerta">{erro}</p>;
    if (pedidos.length === 0) return <div className="ml-card"><p>Nenhum pedido feito.</p></div>;

    return (
        <div className="ml-card">
            {pedidos.map((pedido) => {
                const itens = lerDetalhePedido(pedido.id);
                const data = formatarData(pedido.createdAt);
                return (
                    <article className="ml-pedido" key={pedido.id}>
                        <strong>Pedido #{pedido.id}</strong>
                        <span>{STATUS[pedido.status] ?? pedido.status}{data ? ` · ${data}` : ""} · {formatarPreco(pedido.valor_total)}</span>
                        {itens && itens.length > 0 && (
                            <ul>
                                {itens.map((item, indice) => (
                                    <li key={`${item.nome}-${indice}`}>{item.nome} · {item.quantidade} un. · {formatarPreco(item.preco * item.quantidade)}</li>
                                ))}
                            </ul>
                        )}
                    </article>
                );
            })}
        </div>
    );
}

function formularioDoUsuario(usuario: Usuario | null): CadastroForm {
    return {
        nome: usuario?.nome ?? "",
        email: usuario?.email ?? "",
        senha: "",
        confirmacao: "",
        cpf: mascaraCpf(usuario?.cpf ?? ""),
    };
}

// Rúbrica: esta tela lê o usuário pelo contexto e só altera a própria conta.
export function Configuracoes() {
    const navigate = useNavigate();
    const { usuario, atualizar } = useUsuario();
    const [form, setForm] = useState<CadastroForm>(() => formularioDoUsuario(usuario));
    const [erros, setErros] = useState<ErrosCadastro>({});
    const [erroApi, setErroApi] = useState("");
    const [aviso, setAviso] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [editando, setEditando] = useState(false);
    const [params] = useSearchParams();
    const painel = params.get("aba") === "pedidos" ? "pedidos" : "dados";

    useEffect(() => {
        if (!localStorage.getItem("token") || !usuario) navigate("/login", { replace: true });
    }, [navigate, usuario]);

    useEffect(() => {
        if (!aviso) return;
        const tempo = setTimeout(() => setAviso(""), 2000);
        return () => clearTimeout(tempo);
    }, [aviso]);

    useEffect(() => {
        if (!usuario) return;
        setForm(formularioDoUsuario(usuario));
    }, [usuario]);

    async function salvar(event: FormEvent) {
        event.preventDefault();
        if (!usuario) return;
        setErroApi("");
        setAviso("");
        const encontrados = validarEdicaoUsuario(form, usuario.email, usuario.cpf ?? "");
        setErros(encontrados);
        if (Object.keys(encontrados).length > 0) return;

        setEnviando(true);
        try {
            const acesso = await api.post<{ token: string }>("/api/auth/login", {
                email: usuario.email,
                senha: form.senha,
            });
            localStorage.setItem("token", acesso.data.token);
            const resposta = await api.put<{ usuario: Usuario }>("/api/usuarios/me", {
                nome: form.nome.trim(),
                email: usuario.email,
                senha: form.senha,
                cpf: (usuario.cpf ?? "").replace(/\D/g, ""),
            });
            atualizar(resposta.data.usuario);
            setEditando(false);
            setAviso("Dados atualizados com sucesso.");
        } catch (falha) {
            const mensagem = mensagemDaApi(falha, "Não foi possível atualizar os dados.");
            const texto = mensagem.toLowerCase();
            if (texto.includes("senha") || texto.includes("incorret")) setErros({ senha: "A senha não confere." });
            else if (texto.includes("e-mail") || texto.includes("email")) setErros({ email: mensagem });
            else if (texto.includes("cpf")) setErros({ cpf: mensagem });
            else setErroApi(mensagem);
        } finally {
            setEnviando(false);
        }
    }

    function abrirEdicao() {
        setForm(formularioDoUsuario(usuario));
        setErros({});
        setErroApi("");
        setAviso("");
        setEditando(true);
    }

    function cancelar() {
        setForm(formularioDoUsuario(usuario));
        setErros({});
        setErroApi("");
        setEditando(false);
    }

    return (
        <section className="ml-conta">
            <div className="ml-miolo">
                <ContaMenu ativo={painel} />
                <div className="ml-painel">
                    <h1>{painel === "pedidos" ? "Pedidos" : "Meus dados"}</h1>
                    <p>{painel === "pedidos" ? "Pedidos feitos nesta conta." : editando ? "Altere os dados e confirme a senha para salvar." : "Informações da sua conta."}</p>
                    {painel === "dados" && erroApi && <p className="ml-alerta">{erroApi}</p>}
                    {painel === "pedidos" && <PedidosFeitos />}
                    {painel === "dados" && !editando && (
                        <div className="ml-card" id="config-dados">
                            <h2>Dados pessoais</h2>
                            <dl className="ml-info">
                                <div>
                                    <dt>Nome</dt>
                                    <dd>{usuario?.nome || "Não informado"}</dd>
                                </div>
                                <div>
                                    <dt>E-mail</dt>
                                    <dd>{usuario?.email || "Não informado"}</dd>
                                </div>
                                <div>
                                    <dt>CPF</dt>
                                    <dd>{usuario?.cpf ? mascaraCpf(usuario.cpf) : "Não informado"}</dd>
                                </div>
                            </dl>
                            <button className="btn btn-danger rounded-pill px-4" type="button" onClick={abrirEdicao}>Editar</button>
                        </div>
                    )}
                    {painel === "dados" && editando && (
                        <form onSubmit={salvar} noValidate>
                            <div className="ml-card" id="config-dados">
                                <h2>Dados pessoais</h2>
                                <Campo
                                    id="config-nome"
                                    label="Nome"
                                    autoComplete="name"
                                    value={form.nome}
                                    erro={erros.nome}
                                    onChange={(nome) => setForm({ ...form, nome })}
                                />
                                {/* O e-mail fica bloqueado: a rubrica não permite trocá-lo. */}
                                <Campo
                                    id="config-email"
                                    label="E-mail"
                                    type="email"
                                    autoComplete="email"
                                    value={form.email}
                                    erro={erros.email}
                                    disabled
                                    onChange={() => undefined}
                                />
                                <p className="ml-nota">O e-mail não pode ser alterado.</p>
                                <Campo
                                    id="config-cpf"
                                    label="CPF"
                                    inputMode="numeric"
                                    value={form.cpf}
                                    erro={erros.cpf}
                                    disabled
                                    onChange={() => undefined}
                                />
                                <p className="ml-nota">O CPF não pode ser alterado.</p>
                            </div>
                            <div className="ml-card">
                                {/* A senha confirma que a pessoa pode salvar a alteração. */}
                                <h2>Confirmar senha</h2>
                                <p className="ml-nota">A senha não muda. Ela só confirma que você pode salvar os dados.</p>
                                <Campo
                                    id="config-senha"
                                    label="Senha"
                                    type="password"
                                    autoComplete="current-password"
                                    value={form.senha}
                                    erro={erros.senha}
                                    onChange={(senha) => setForm({ ...form, senha })}
                                />
                                <div className="ml-acoes">
                                    <button className="btn btn-danger rounded-pill px-4" type="submit" disabled={enviando}>
                                        {enviando ? "Salvando..." : "Salvar alterações"}
                                    </button>
                                    <button className="btn btn-outline-secondary rounded-pill px-4" type="button" onClick={cancelar} disabled={enviando}>Cancelar</button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            {aviso && (
                <div className="admin-confirma" role="status" aria-live="polite">
                    <article>
                        <h2>Dados atualizados</h2>
                        <p>{aviso}</p>
                    </article>
                </div>
            )}
        </section>
    );
}
