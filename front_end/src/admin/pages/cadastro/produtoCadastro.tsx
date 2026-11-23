import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensagemDaApi } from "../../../api/axios";
import { Campo } from "../../../components/campo";
import { AdminLayout } from "../../componets/adminLayour";
import { validarProduto, type ProdutoForm } from "../../../validacao";

type CategoriaApi = {
    id: number;
    nome: string;
};

// Tela separada da lista: cria ou edita um produto e valida os campos antes de gravar.
const vazio: ProdutoForm = {
    nome: "",
    descricao: "",
    preco: "",
    estoque: "",
    categoriaId: "",
};

type ProdutoApi = {
    id: number;
    nome: string;
    descricao: string;
    preco: string | number;
    estoque: number;
    categoria_id?: number | null;
};

export function ProdutoCadastro() {
    const navigate = useNavigate();
    const { id } = useParams();
    const editando = Boolean(id);
    const [form, setForm] = useState<ProdutoForm>(vazio);
    const [erros, setErros] = useState<Partial<ProdutoForm>>({});
    const [erroApi, setErroApi] = useState("");
    const [categorias, setCategorias] = useState<CategoriaApi[]>([]);
    const [enviando, setEnviando] = useState(false);
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        if (!aviso) return;
        const tempo = setTimeout(() => navigate("/admin/produtos"), 2000);
        return () => clearTimeout(tempo);
    }, [aviso, navigate]);

    useEffect(() => {
        if (!localStorage.getItem("token")) navigate("/login", { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (!localStorage.getItem("token")) return;
        api.get<{ categorias: CategoriaApi[] }>("/api/categorias", { params: { limite: 100 } })
            .then((resposta) => setCategorias(resposta.data.categorias))
            .catch(() => setCategorias([]));
    }, []);

    useEffect(() => {
        if (!id || !localStorage.getItem("token")) return;
        api.get<{ produtos: ProdutoApi[] }>("/api/produtos", { params: { limite: 100 } })
            .then((resposta) => {
                const produto = resposta.data.produtos.find((item) => item.id === Number(id));
                if (!produto) {
                    setErroApi("Produto não encontrado.");
                    return;
                }
                setForm({
                    nome: produto.nome,
                    descricao: produto.descricao,
                    preco: Number(produto.preco).toFixed(2).replace(".", ","),
                    estoque: String(produto.estoque),
                    categoriaId: produto.categoria_id ? String(produto.categoria_id) : "",
                });
            })
            .catch((falha: unknown) => setErroApi(mensagemDaApi(falha, "Não foi possível carregar o produto.")));
    }, [id]);

    async function salvar(event: FormEvent) {
        event.preventDefault();
        setErroApi("");
        const encontrados = validarProduto(form);
        setErros(encontrados);
        if (Object.keys(encontrados).length > 0) return;

        setEnviando(true);
        try {
            const corpo = {
                nome: form.nome.trim(),
                descricao: form.descricao.trim(),
                preco: Number(form.preco.replace(",", ".")),
                estoque: Number(form.estoque),
                categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
            };
            if (editando) await api.put(`/api/produtos/${id}`, corpo);
            else await api.post("/api/produtos", corpo);
            setAviso(editando ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.");
        } catch (falha) {
            setErroApi(mensagemDaApi(falha, editando ? "Não foi possível salvar o produto." : "Não foi possível cadastrar o produto."));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="admin-pagina">
            <AdminLayout />
            <section className="admin-conteudo">
                <h1>{editando ? "Editar produto" : "Novo produto"}</h1>
                <p>{editando ? "Altere os dados e salve." : "Cadaastre uma novo produto"}</p>
                <form className="admin-card admin-form" onSubmit={salvar} noValidate>
                    {erroApi && <p className="field-error">{erroApi}</p>}
                    <Campo
                        id="produto-nome"
                        label="Nome"
                        value={form.nome}
                        erro={erros.nome}
                        onChange={(nome) => setForm({ ...form, nome })}
                    />
                    <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="produto-descricao">Descrição</label>
                        <textarea
                            id="produto-descricao"
                            className="form-control"
                            value={form.descricao}
                            onChange={(event) => setForm({ ...form, descricao: event.target.value })}
                        />
                        {erros.descricao && <p className="field-error">{erros.descricao}</p>}
                    </div>
                    <Campo
                        id="produto-preco"
                        label="Preço"
                        value={form.preco}
                        erro={erros.preco}
                        inputMode="text"
                        onChange={(preco) => setForm({ ...form, preco })}
                    />
                    <Campo
                        id="produto-estoque"
                        label="Estoque"
                        value={form.estoque}
                        erro={erros.estoque}
                        inputMode="numeric"
                        onChange={(estoque) => setForm({ ...form, estoque })}
                    />
                    <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="produto-categoria">Categoria</label>
                        <select
                            id="produto-categoria"
                            className="form-select"
                            value={form.categoriaId}
                            aria-invalid={Boolean(erros.categoriaId)}
                            onChange={(event) => setForm({ ...form, categoriaId: event.target.value })}
                        >
                            <option value="">Selecione a categoria</option>
                            {categorias.map((categoria) => (
                                <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                            ))}
                        </select>
                        {erros.categoriaId && <span className="campo-erro">{erros.categoriaId}</span>}
                    </div>
                    <div className="d-flex flex-wrap gap-3">
                        <button className="btn btn-danger rounded-pill px-4" type="submit" disabled={enviando}>
                            {enviando ? "Salvando..." : editando ? "Salvar" : "Cadastrar"}
                        </button>
                        <Link className="btn btn-outline-secondary rounded-pill px-4" to="/admin/produtos">Voltar</Link>
                    </div>
                </form>
            </section>
            {aviso && (
                <div className="admin-confirma" role="status" aria-live="polite">
                    <article>
                        <h2>{editando ? "Produto editado" : "Produto cadastrado"}</h2>
                        <p>{aviso}</p>
                    </article>
                </div>
            )}
        </div>
    );
}
