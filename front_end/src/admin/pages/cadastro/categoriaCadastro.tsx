import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensagemDaApi } from "../../../api/axios";
import { Campo } from "../../../components/campo";
import { AdminLayout } from "../../componets/adminLayour";
import { validarCategoria } from "../../../validacao";

type CategoriaApi = {
    id: number;
    nome: string;
};

export function CategoriaCadastro() {
    const navigate = useNavigate();
    const { id } = useParams();
    const editando = Boolean(id);
    const [nome, setNome] = useState("");
    const [erroNome, setErroNome] = useState("");
    const [erroApi, setErroApi] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        if (!aviso) return;
        const tempo = setTimeout(() => navigate("/admin/categorias"), 2000);
        return () => clearTimeout(tempo);
    }, [aviso, navigate]);

    useEffect(() => {
        if (!localStorage.getItem("token")) navigate("/login", { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (!id || !localStorage.getItem("token")) return;
        api.get<{ categorias: CategoriaApi[] }>("/api/categorias", { params: { limite: 100 } })
            .then((resposta) => {
                const categoria = resposta.data.categorias.find((item) => item.id === Number(id));
                if (!categoria) {
                    setErroApi("Categoria não encontrada.");
                    return;
                }
                setNome(categoria.nome);
            })
            .catch((falha: unknown) => setErroApi(mensagemDaApi(falha, "Não foi possível carregar a categoria.")));
    }, [id]);

    async function salvar(event: FormEvent) {
        event.preventDefault();
        setErroApi("");
        const erro = validarCategoria(nome);
        setErroNome(erro);
        if (erro) return;

        setEnviando(true);
        try {
            if (editando) await api.put(`/api/categorias/${id}`, { nome: nome.trim() });
            else await api.post("/api/categorias", { nome: nome.trim() });
            setAviso(editando ? "Categoria atualizada com sucesso." : "Categoria cadastrada com sucesso.");
        } catch (falha) {
            const mensagem = mensagemDaApi(falha, editando ? "Não foi possível salvar a categoria." : "Não foi possível cadastrar a categoria.");
            if (mensagem.toLowerCase().includes("já existe")) setErroNome(mensagem);
            else setErroApi(mensagem);
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="admin-pagina">
            <AdminLayout />
            <section className="admin-conteudo">
                <h1>{editando ? "Editar categoria" : "Nova categoria"}</h1>
                <p>{editando ? "Altere o nome e salve." : "Cadaastre uma nova categoria"}</p>
                <form className="admin-card admin-form" onSubmit={salvar} noValidate>
                    {erroApi && <p className="field-error">{erroApi}</p>}
                    <Campo
                        id="categoria-nome"
                        label="Nome"
                        value={nome}
                        erro={erroNome}
                        onChange={setNome}
                    />
                    <div className="d-flex flex-wrap gap-3">
                        <button className="btn btn-danger rounded-pill px-4" type="submit" disabled={enviando}>
                            {enviando ? "Salvando..." : editando ? "Salvar" : "Cadastrar"}
                        </button>
                        <Link className="btn btn-outline-secondary rounded-pill px-4" to="/admin/categorias">Voltar</Link>
                    </div>
                </form>
            </section>
            {aviso && (
                <div className="admin-confirma" role="status" aria-live="polite">
                    <article>
                        <h2>{editando ? "Categoria editada" : "Categoria cadastrada"}</h2>
                        <p>{aviso}</p>
                    </article>
                </div>
            )}
        </div>
    );
}
