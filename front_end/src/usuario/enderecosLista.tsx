import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, mensagemDaApi } from "../api/axios";
import { mascaraCep } from "../validacao";
import { ContaMenu } from "./contaMenu";
import { useUsuario } from "./contextoUsuario";

// CRUD de endereços. A lista fica nesta tela e pede uma página por vez para a API.
const LIMITE = 5;

type EnderecoApi = {
    id: number;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
};

type ListaEnderecos = {
    enderecos: EnderecoApi[];
    paginacao?: { totalPaginas: number; total: number };
};

// Função exclusiva desta listagem.
function LinhaEndereco({
    endereco,
    onExcluir,
}: {
    endereco: EnderecoApi;
    onExcluir: (endereco: EnderecoApi) => void;
}) {
    return (
        <article className="ml-endereco">
            <div>
                <strong>{endereco.rua}, {endereco.numero}</strong>
                <span>{endereco.bairro} · {endereco.cidade}/{endereco.estado} · CEP {mascaraCep(endereco.cep)}</span>
            </div>
            <div className="ml-endereco-acoes">
                <Link className="btn btn-outline-secondary btn-sm rounded-pill" to={`/configuracoes/enderecos/${endereco.id}/editar`}>Editar</Link>
                <button className="btn btn-danger btn-sm rounded-pill" type="button" onClick={() => onExcluir(endereco)}>Excluir</button>
            </div>
        </article>
    );
}

export function EnderecosLista() {
    const navigate = useNavigate();
    const { usuario } = useUsuario();
    const [enderecos, setEnderecos] = useState<EnderecoApi[]>([]);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [excluir, setExcluir] = useState<EnderecoApi | null>(null);
    const [excluindo, setExcluindo] = useState(false);
    const [recarregar, setRecarregar] = useState(0);

    useEffect(() => {
        if (!localStorage.getItem("token") || !usuario) navigate("/login", { replace: true });
    }, [navigate, usuario]);

    useEffect(() => {
        if (!localStorage.getItem("token")) return;
        let ativo = true;
        api.get<ListaEnderecos>("/api/enderecos", { params: { pagina, limite: LIMITE } })
            .then((resposta) => {
                if (!ativo) return;
                const total = resposta.data.paginacao?.total ?? resposta.data.enderecos.length;
                const paginas = Math.max(resposta.data.paginacao?.totalPaginas ?? 1, 1);
                if (total > 0 && pagina > paginas) {
                    setPagina(paginas);
                    return;
                }
                setEnderecos(resposta.data.enderecos ?? []);
                setTotalPaginas(total === 0 ? 1 : paginas);
                setErro("");
            })
            .catch((falha: unknown) => {
                if (ativo) setErro(mensagemDaApi(falha, "Não foi possível carregar os endereços."));
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });
        return () => {
            ativo = false;
        };
    }, [pagina, recarregar]);

    async function confirmarExclusao() {
        if (!excluir) return;
        setErro("");
        setExcluindo(true);
        try {
            await api.delete(`/api/enderecos/${excluir.id}`);
            setExcluir(null);
            if (enderecos.length === 1 && pagina > 1) setPagina(pagina - 1);
            setRecarregar((valor) => valor + 1);
        } catch (falha) {
            setErro(mensagemDaApi(falha, "Não foi possível excluir o endereço."));
            setExcluir(null);
        } finally {
            setExcluindo(false);
            setCarregando(false);
        }
    }

    return (
        <section className="ml-conta">
            <div className="ml-miolo">
                <ContaMenu ativo="enderecos" />
                <div className="ml-painel">
                    <div className="ml-topo">
                        <div>
                            <h1>Endereços</h1>
                            <p>Cadastre, edite ou exclua os endereços desta conta.</p>
                        </div>
                        <Link className="btn btn-danger rounded-pill px-4" to="/configuracoes/enderecos/novo">Novo endereço</Link>
                    </div>
                    {erro && <p className="ml-alerta">{erro}</p>}
                    <div className="ml-card">
                        {carregando && <p>Carregando endereços...</p>}
                        {!carregando && enderecos.length === 0 && <p>Nenhum endereço cadastrado.</p>}
                        {!carregando && enderecos.map((endereco) => (
                            <LinhaEndereco key={endereco.id} endereco={endereco} onExcluir={setExcluir} />
                        ))}
                        {/* Paginação da listagem de endereços. */}
                        {!carregando && enderecos.length > 0 && (
                            <div className="ml-paginas">
                                <button type="button" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
                                <span>Página {pagina} de {totalPaginas}</span>
                                <button type="button" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>Próxima</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {excluir && (
                <div className="admin-confirma" role="dialog" aria-modal="true" aria-labelledby="confirma-exclusao-endereco">
                    <article>
                        <h2 id="confirma-exclusao-endereco">Excluir endereço</h2>
                        <p>Confirma a exclusão de {excluir.rua}, {excluir.numero}?</p>
                        <div className="d-flex justify-content-center flex-wrap gap-3">
                            <button className="btn btn-outline-secondary rounded-pill px-4" type="button" onClick={() => setExcluir(null)} disabled={excluindo}>Cancelar</button>
                            <button className="btn btn-danger rounded-pill px-4" type="button" onClick={confirmarExclusao} disabled={excluindo}>
                                {excluindo ? "Excluindo..." : "Excluir"}
                            </button>
                        </div>
                    </article>
                </div>
            )}
        </section>
    );
}
