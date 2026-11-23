
import { ProdutoComercializavel } from './ProdutoBase';

/**
 * Produto especializado da Banepane Foods.
 * Demonstra herança e implementação de métodos abstratos.
 */
export class PaoDeQueijoCongelado extends ProdutoComercializavel {
  constructor(
    nome: string,
    preco: number,
    private readonly sabor: string
  ) {
    super(nome, preco);

    if (!sabor.trim()) {
      throw new Error('O sabor é obrigatório.');
    }
  }

  public calcularPrecoFinal(): number {
    return this.precoBase;
  }

  public obterDescricao(): string {
    return `${this.nomeProduto} - Sabor: ${this.sabor} (congelado)`;
  }

  public get saborProduto(): string {
    return this.sabor;
  }
}
