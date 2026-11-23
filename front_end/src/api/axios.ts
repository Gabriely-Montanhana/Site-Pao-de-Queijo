import axios from "axios";

const urlDaApi = (import.meta.env as { VITE_API_URL?: string }).VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
    baseURL: urlDaApi,
});

// Lê o token do localStorage e envia nas rotas que exigem login.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Transforma a resposta de erro da API em uma frase para mostrar na tela.
export function mensagemDaApi(falha: unknown, padrao: string) {
    if (!axios.isAxiosError(falha)) return padrao;
    const dados = falha.response?.data as { mensagem?: unknown; message?: unknown; erro?: unknown } | undefined;
    const mensagem = dados && [dados.mensagem, dados.message, dados.erro].find(
        (item) => typeof item === "string" && item.trim(),
    );
    if (typeof mensagem === "string") return mensagem;
    if (!falha.response) return "Não foi possível falar com o servidor.";
    return "Não foi possível concluir a operação.";
}