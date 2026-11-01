import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import { mensagemDaApi } from "../api/mensagemDaApi";
import { Campo } from "../components/campo";
import { validarLogin, type ErrosLogin, type LoginForm } from "../validacao";

export function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState<LoginForm>({
        email: "",
        senha: "",
    });
    const [erros, setErros] = useState<ErrosLogin>({});
    const [erroApi, setErroApi] = useState("");
    const [loading, setLoading] = useState(false);

    async function onFormSubmit(event: SubmitEvent) {
        event.preventDefault();
        setErroApi("");
        const encontrados = validarLogin(form);
        setErros(encontrados);
        if (Object.keys(encontrados).length > 0) return;

        setLoading(true);
        try {
            await api.post("/api/auth/login", {
                email: form.email.trim(),
                senha: form.senha,
            });
            navigate("/");
        } catch (falha) {
            setErroApi(mensagemDaApi(falha, "Não foi possível entrar."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onFormSubmit} className="login-form card rounded-4 p-4 p-md-5" noValidate>
            <h2 className="fw-bold mb-4 text-center">Entrar</h2>
            {erroApi && <p className="field-error">{erroApi}</p>}
            <Campo
                id="login-email"
                label="E-mail"
                type="email"
                autoComplete="email"
                value={form.email}
                erro={erros.email}
                onChange={(email) => setForm({ ...form, email })}
            />
            <Campo
                id="login-senha"
                label="Senha"
                type="password"
                autoComplete="current-password"
                value={form.senha}
                erro={erros.senha}
                onChange={(senha) => setForm({ ...form, senha })}
            />
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-2">
                <p className="mb-0">
                    Não tem conta? <Link className="link-danger fw-bold text-decoration-underline" to="/cadastro">Cadastro</Link>
                </p>
                {
                    loading
                        ? (
                            <span className="loader"></span>
                        )
                        : (
                            <button type="submit" className="btn btn-danger rounded-pill px-4">
                                Entrar
                            </button>
                        )
                }
            </div>
        </form>
    )
}
