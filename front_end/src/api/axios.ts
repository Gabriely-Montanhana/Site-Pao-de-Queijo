import axios from "axios";

export const api = axios.create({
    baseURL: "http://localhost:3000",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

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