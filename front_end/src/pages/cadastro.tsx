import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, mensagemDaApi } from "../api/axios";
import { Campo } from "../components/campo";
import { mascaraCpf, validarCadastro, type CadastroForm, type ErrosCadastro } from "../validacao";

export function CadastroPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState<CadastroForm>({
        nome: "",
        email: "",
        senha: "",
        confirmacao: "",
        cpf: "",
    });
    const [erros, setErros] = useState<ErrosCadastro>({});
    const [erroApi, setErroApi] = useState("");
    const [loading, setLoading] = useState(false);

    async function onFormSubmit(event: SubmitEvent) {
        event.preventDefault();
        setErroApi("");
        const encontrados = validarCadastro(form);
        setErros(encontrados);
        if (Object.keys(encontrados).length > 0) return;

        setLoading(true);
        try {
            await api.post("/api/auth/cadastro", {
                nome: form.nome.trim(),
                email: form.email.trim(),
                senha: form.senha,
                cpf: form.cpf.replace(/\D/g, ""),
            });
            navigate("/login");
        } catch (falha) {
            setErroApi(mensagemDaApi(falha, "Não foi possível cadastrar."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onFormSubmit} className="cadastro-form card rounded-4 p-4 p-md-5" noValidate>
            <h2 className="fw-bold mb-4 text-center">Cadastro</h2>
            {erroApi && <p className="field-error">{erroApi}</p>}
            <Campo
                id="cad-nome"
                label="Nome"
                autoComplete="name"
                value={form.nome}
                erro={erros.nome}
                onChange={(nome) => setForm({ ...form, nome })}
            />
            <Campo
                id="cad-email"
                label="E-mail"
                type="email"
                autoComplete="email"
                value={form.email}
                erro={erros.email}
                onChange={(email) => setForm({ ...form, email })}
            />
            <Campo
                id="cad-cpf"
                label="CPF"
                inputMode="numeric"
                value={form.cpf}
                erro={erros.cpf}
                onChange={(cpf) => setForm({ ...form, cpf: mascaraCpf(cpf) })}
            />
            <Campo
                id="cad-senha"
                label="Senha"
                type="password"
                autoComplete="new-password"
                value={form.senha}
                erro={erros.senha}
                onChange={(senha) => setForm({ ...form, senha })}
            />
            <Campo
                id="cad-confirma"
                label="Confirmar senha"
                type="password"
                autoComplete="new-password"
                value={form.confirmacao}
                erro={erros.confirmacao}
                onChange={(confirmacao) => setForm({ ...form, confirmacao })}
            />
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-2">
                <p className="mb-0">
                    Já tem conta? <Link className="link-danger fw-bold text-decoration-underline" to="/login">Entrar</Link>
                </p>
                {
                    loading
                        ? (
                            <span className="loader"></span>
                        )
                        : (
                            <button type="submit" className="btn btn-danger rounded-pill px-4">
                                Cadastrar
                            </button>
                        )
                }
            </div>
        </form>
    )
}
