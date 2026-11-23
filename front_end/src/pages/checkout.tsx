import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Campo } from "../components/campo";
import { api, mensagemDaApi } from "../api/axios";
import { useCarrinho } from "../components/carrinho";
import { guardarDetalhePedido } from "../detalhesPedido";
import { mascaraCep, validarEndereco, type EnderecoForm, type ErrosEndereco } from "../validacao";

function formatarPreco(valor: number) {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function formatarCep(cep: string) {
    const digitos = cep.replace(/\D/g, "");
    if (digitos.length !== 8) return cep;
    return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

type EnderecoSalvo = {
    id: number;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
};

const VAZIO: EnderecoForm = {
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
};

export function CheckoutPage() {
    const navigate = useNavigate();
    const { itens, limpar, total, quantidade } = useCarrinho();
    const [form, setForm] = useState<EnderecoForm>(VAZIO);
    const [erros, setErros] = useState<ErrosEndereco>({});
    const [erroApi, setErroApi] = useState("");
    const [loading, setLoading] = useState(false);
    const [aviso, setAviso] = useState("");
    const [enderecos, setEnderecos] = useState<EnderecoSalvo[]>([]);
    const [carregandoEndereco, setCarregandoEndereco] = useState(true);
    const [adicionando, setAdicionando] = useState(false);
    const [escolhido, setEscolhido] = useState<number | null>(null);
    const usandoSalvo = enderecos.length > 0 && !adicionando;

    useEffect(() => {
        if (!aviso) return;
        const tempo = setTimeout(() => navigate("/produtos"), 2000);
        return () => clearTimeout(tempo);
    }, [aviso, navigate]);

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            setCarregandoEndereco(false);
            return;
        }
        let ativo = true;
        api.get<{ enderecos: EnderecoSalvo[] }>("/api/enderecos", { params: { limite: 100 } })
            .then((resposta) => {
                if (ativo) setEnderecos(resposta.data.enderecos ?? []);
            })
            .catch(() => {
                if (ativo) setEnderecos([]);
            })
            .finally(() => {
                if (ativo) setCarregandoEndereco(false);
            });
        return () => {
            ativo = false;
        };
    }, []);

    function dadosDoEndereco() {
        return {
            rua: form.rua.trim(),
            numero: form.numero.trim(),
            bairro: form.bairro.trim(),
            cidade: form.cidade.trim(),
            estado: form.estado.trim().toUpperCase(),
            cep: form.cep.replace(/\D/g, ""),
        };
    }

    async function salvarEndereco() {
        const encontrados = validarEndereco(form);
        setErros(encontrados);
        if (Object.keys(encontrados).length > 0) return;

        setLoading(true);
       
try {
    await api.post("/api/enderecos", dadosDoEndereco());

    const resposta = await api.get<{
        enderecos: EnderecoSalvo[];
    }>("/api/enderecos", {
        params: { limite: 100 },
    });

    setEnderecos(resposta.data.enderecos ?? []);
    setForm(VAZIO);
    setErros({});
    setEscolhido(null);
    setAdicionando(false);
} catch (falha) {
    setErroApi(
        mensagemDaApi(falha, "Não foi possível adicionar o endereço.")
    );
} finally {
    setLoading(false);
}
}


    async function onFormSubmit(event: SubmitEvent) {
        event.preventDefault();
        setErroApi("");
        if (adicionando) {
            await salvarEndereco();
            return;
        }
        if (usandoSalvo && escolhido == null) {
            setErroApi("Escolha um endereço para finalizar.");
            return;
        }
        if (!usandoSalvo) {
            const encontrados = validarEndereco(form);
            setErros(encontrados);
            if (Object.keys(encontrados).length > 0) return;
        }
        if (itens.length === 0) return;

        setLoading(true);
        try {
            if (!usandoSalvo) {
                await api.post("/api/enderecos", dadosDoEndereco());
            }
           const resposta = await api.post<{ pedido?: { id?: number } }>("/api/pedidos", {
    itens: itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
    })),
});
            const pedidoId = resposta.data.pedido?.id;
            if (pedidoId) {
                guardarDetalhePedido(pedidoId, itens.map((item) => ({
                    nome: item.nome,
                    quantidade: item.quantidade,
                    preco: item.preco,
                })));
            }
            limpar();
            setAviso("Pedido registrado com sucesso.");
        } catch (falha) {
            setErroApi(mensagemDaApi(falha, "Não foi possível finalizar a compra."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
        <section className="carrinho">
            <form id="endereco-compra" className="checkout-form" onSubmit={onFormSubmit} noValidate>
                <div className="carrinho-miolo">
                    <div>
                        <h2>Endereço de entrega</h2>
                        {erroApi && <p className="field-error">{erroApi}</p>}
                        {itens.length === 0 && !aviso && (
                            <div className="carrinho-card carrinho-vazio">
                                <p>Seu carrinho está vazio.</p>
                                <Link to="/produtos">Ver produtos</Link>
                            </div>
                        )}
                        {(itens.length > 0 || aviso) && carregandoEndereco && (
                            <div className="carrinho-card carrinho-vazio">
                                <p>Carregando endereço...</p>
                            </div>
                        )}
                        {(itens.length > 0 || aviso) && !carregandoEndereco && usandoSalvo && (
                            <div className="carrinho-card checkout-enderecos">
                                {enderecos.map((endereco) => (
                                    <button
                                        type="button"
                                        className={endereco.id === escolhido ? "checkout-endereco escolhido" : "checkout-endereco"}
                                        key={endereco.id}
                                        aria-pressed={endereco.id === escolhido}
                                        onClick={() => setEscolhido(endereco.id)}
                                    >
                                        <strong>{endereco.rua}, {endereco.numero}</strong>
                                        <p>{endereco.bairro}</p>
                                        <p>{endereco.cidade}/{endereco.estado}</p>
                                        <p>CEP {formatarCep(endereco.cep)}</p>
                                    </button>
                                ))}
                                <button type="button" className="checkout-outro" onClick={() => setAdicionando(true)}>
                                    Adicionar outro
                                </button>
                            </div>
                        )}
                        {(itens.length > 0 || aviso) && !carregandoEndereco && !usandoSalvo && (
                            <div className="carrinho-card checkout-grade">
                                <div className="checkout-largo">
                                    <Campo
                                        id="end-rua"
                                        label="Rua"
                                        autoComplete="address-line1"
                                        value={form.rua}
                                        erro={erros.rua}
                                        onChange={(rua) => setForm({ ...form, rua })}
                                    />
                                </div>
                                <Campo
                                    id="end-numero"
                                    label="Número"
                                    autoComplete="address-line2"
                                    value={form.numero}
                                    erro={erros.numero}
                                    onChange={(numero) => setForm({ ...form, numero })}
                                />
                                <Campo
                                    id="end-cep"
                                    label="CEP"
                                    autoComplete="postal-code"
                                    inputMode="numeric"
                                    value={form.cep}
                                    erro={erros.cep}
                                    onChange={(cep) => setForm({ ...form, cep: mascaraCep(cep) })}
                                />
                                <div className="checkout-largo">
                                    <Campo
                                        id="end-bairro"
                                        label="Bairro"
                                        value={form.bairro}
                                        erro={erros.bairro}
                                        onChange={(bairro) => setForm({ ...form, bairro })}
                                    />
                                </div>
                                <Campo
                                    id="end-cidade"
                                    label="Cidade"
                                    autoComplete="address-level2"
                                    value={form.cidade}
                                    erro={erros.cidade}
                                    onChange={(cidade) => setForm({ ...form, cidade })}
                                />
                                <Campo
                                    id="end-estado"
                                    label="Estado"
                                    autoComplete="address-level1"
                                    value={form.estado}
                                    erro={erros.estado}
                                    onChange={(estado) => setForm({ ...form, estado: estado.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() })}
                                />
                                {enderecos.length > 0 && (
                                    <div className="checkout-largo checkout-acoes">
                                        <button type="button" className="checkout-outro" onClick={() => { setAdicionando(false); setErros({}); setErroApi(""); }}>
                                            Usar endereço salvo
                                        </button>
                                        <button type="submit" className="checkout-outro checkout-adicionar" disabled={loading}>
                                            {loading ? "Adicionando..." : "Adicionar"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <aside className="carrinho-resumo">
                        <p>Produtos ({quantidade}) <span>{formatarPreco(total)}</span></p>
                        <p>Frete <span className="carrinho-frete">Grátis</span></p>
                        <p className="carrinho-total-linha">Total <strong>{formatarPreco(total)}</strong></p>
                        <button type="submit" disabled={itens.length === 0 || loading || carregandoEndereco || adicionando || (usandoSalvo && escolhido == null)}>
                            {loading && !adicionando ? "Finalizando..." : "Finalizar compra"}
                        </button>
                        <Link className="checkout-voltar" to="/carrinho">Voltar ao carrinho</Link>
                    </aside>
                </div>
            </form>
        </section>
        {aviso && (
            <div className="admin-confirma" role="status" aria-live="polite">
                <article>
                    <h2>Pedido registrado</h2>
                    <p>{aviso}</p>
                </article>
            </div>
        )}
        </>
    );
}
