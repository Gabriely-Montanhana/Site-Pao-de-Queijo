
/**
 * Classe abstrata que representa um produto comercializável.
 * Demonstra abstração, encapsulamento e herança.
 */
export abstract class ProdutoComercializavel {
  constructor(
    protected readonly nomeProduto: string,
    protected precoBase: number
  ) {
    if (!nomeProduto.trim()) {
      throw new Error('O nome do produto é obrigatório.');
    }

    if (!Number.isFinite(precoBase) || precoBase < 0) {
      throw new Error('O preço deve ser um número válido.');
    }
  }

  public get nome(): string {
    return this.nomeProduto;
  }

  public get preco(): number {
    return this.precoBase;
  }

  // Cada tipo de produto implementará seu próprio cálculo.
  public abstract calcularPrecoFinal(): number;

  public abstract obterDescricao(): string;
}
