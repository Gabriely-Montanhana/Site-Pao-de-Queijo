import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensagemDaApi } from "../api/axios";
import { Campo } from "../components/campo";
import { mascaraCep, validarEndereco, type EnderecoForm, type ErrosEndereco } from "../validacao";
import { ContaMenu } from "./contaMenu";
import { useUsuario } from "./contextoUsuario";

type EnderecoApi = EnderecoForm & { id: number };

// Tela separada da lista: cria ou edita um endereço e valida os campos antes de gravar.
const VAZIO: EnderecoForm = {
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
};

function corpo(form: EnderecoForm) {
    return {
        rua: form.rua.trim(),
        numero: form.numero.trim(),
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim().toUpperCase(),
        cep: form.cep.replace(/\D/g, ""),
    };
}

export function EnderecoCadastro() {
    const navigate = useNavigate();
    const { usuario } = useUsuario();
    const { id } = useParams();
    const editando = Boolean(id);
    const [form, setForm] = useState<EnderecoForm>(VAZIO);
    const [erros, setErros] = useState<ErrosEndereco>({});
    const [erroApi, setErroApi] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [carregando, setCarregando] = useState(editando);
    const [sumiu, setSumiu] = useState(false);
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        if (!localStorage.getItem("token") || !usuario) navigate("/login", { replace: true });
    }, [navigate, usuario]);

    useEffect(() => {
        if (!aviso) return;
        const tempo = setTimeout(() => navigate("/configuracoes/enderecos"), 2000);
        return () => clearTimeout(tempo);
    }, [aviso, navigate]);

    useEffect(() => {
        if (!id || !localStorage.getItem("token")) return;
        let ativo = true;
        async function carregar() {
            try {
                let pagina = 1;
                let total = 1;
                while (pagina <= total) {
                    const resposta = await api.get<{ enderecos: EnderecoApi[]; paginacao?: { totalPaginas: number } }>("/api/enderecos", {
                        params: { pagina, limite: 100 },
                    });
                    const achado = resposta.data.enderecos.find((item) => item.id === Number(id));
                    if (achado) {
                        if (!ativo) return;
                        setForm({
                            rua: achado.rua,
                            numero: achado.numero,
                            bairro: achado.bairro,
                            cidade: achado.cidade,
                            estado: achado.estado,
                            cep: mascaraCep(achado.cep),
                        });
                        setCarregando(false);
                        return;
                    }
                    total = resposta.data.paginacao?.totalPaginas ?? 1;
                    pagina += 1;
                }
                if (ativo) {
                    setSumiu(true);
                    setErroApi("Endereço não encontrado.");
                }
            } catch (falha) {
                if (ativo) {
                    setSumiu(true);
                    setErroApi(mensagemDaApi(falha, "Não foi possível carregar o endereço."));
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        carregar();
        return () => {
            ativo = false;
        };
    }, [id]);

    async function salvar(event: FormEvent) {
        event.preventDefault();
        setErroApi("");
        const encontrados = validarEndereco(form);
        setErros(encontrados);
        if (Object.keys(encontrados).length > 0) return;

        setEnviando(true);
        try {
            if (editando) await api.put(`/api/enderecos/${id}`, corpo(form));
            else await api.post("/api/enderecos", corpo(form));
            setAviso(editando ? "Endereço atualizado com sucesso." : "Endereço cadastrado com sucesso.");
        } catch (falha) {
            setErroApi(mensagemDaApi(falha, editando ? "Não foi possível salvar o endereço." : "Não foi possível cadastrar o endereço."));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <section className="ml-conta">
            <div className="ml-miolo">
                <ContaMenu ativo="enderecos" />
                <div className="ml-painel">
                    <h1>{editando ? "Editar endereço" : "Novo endereço"}</h1>
                    <p>{editando ? "Altere os dados e salve." : "Informe o endereço de entrega."}</p>
                    {erroApi && <p className="ml-alerta">{erroApi}</p>}
                    {carregando && <p>Carregando endereço...</p>}
                    {!carregando && !sumiu && (
                        <form className="ml-card ml-endereco-form" onSubmit={salvar} noValidate>
                            <div className="ml-endereco-largo">
                                <Campo id="endereco-rua" label="Rua" autoComplete="address-line1" value={form.rua} erro={erros.rua} onChange={(rua) => setForm({ ...form, rua })} />
                            </div>
                            <Campo id="endereco-numero" label="Número" value={form.numero} erro={erros.numero} onChange={(numero) => setForm({ ...form, numero })} />
                            <Campo id="endereco-cep" label="CEP" inputMode="numeric" autoComplete="postal-code" value={form.cep} erro={erros.cep} onChange={(cep) => setForm({ ...form, cep: mascaraCep(cep) })} />
                            <div className="ml-endereco-largo">
                                <Campo id="endereco-bairro" label="Bairro" value={form.bairro} erro={erros.bairro} onChange={(bairro) => setForm({ ...form, bairro })} />
                            </div>
                            <Campo id="endereco-cidade" label="Cidade" autoComplete="address-level2" value={form.cidade} erro={erros.cidade} onChange={(cidade) => setForm({ ...form, cidade })} />
                            <Campo id="endereco-estado" label="Estado" autoComplete="address-level1" value={form.estado} erro={erros.estado} onChange={(estado) => setForm({ ...form, estado: estado.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() })} />
                            <div className="ml-endereco-largo ml-acoes">
                                <button className="btn btn-danger rounded-pill px-4" type="submit" disabled={enviando}>
                                    {enviando ? "Salvando..." : editando ? "Salvar" : "Cadastrar"}
                                </button>
                                <Link className="btn btn-outline-secondary rounded-pill px-4" to="/configuracoes/enderecos">Voltar</Link>
                            </div>
                        </form>
                    )}
                    {!carregando && sumiu && (
                        <Link className="btn btn-outline-secondary rounded-pill px-4" to="/configuracoes/enderecos">Voltar</Link>
                    )}
                </div>
            </div>
            {aviso && (
                <div className="admin-confirma" role="status" aria-live="polite">
                    <article>
                        <h2>{editando ? "Endereço editado" : "Endereço cadastrado"}</h2>
                        <p>{aviso}</p>
                    </article>
                </div>
            )}
        </section>
    );
}
