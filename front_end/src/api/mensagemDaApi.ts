import axios from "axios";

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
