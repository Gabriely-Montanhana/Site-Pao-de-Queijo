
import { ProdutoComercializavel } from './ProdutoBase';
import { ErroDominio } from './ErroDominio';

/**
 * Representa um kit promocional de pão de queijo.
 * Demonstra herança e polimorfismo.
 */
export class KitPaoDeQueijo extends ProdutoComercializavel {
  constructor(
    nome: string,
    preco: number,
    private readonly quantidadePacotes: number
  ) {
    super(nome, preco);

    
if (!Number.isInteger(quantidadePacotes) || quantidadePacotes <= 0) {
  throw new ErroDominio(
    'A quantidade de pacotes deve ser positiva.',
    'QUANTIDADE_INVALIDA'
  );
}
  }

  public calcularPrecoFinal(): number {
    // Desconto de 10% para kits com 3 ou mais pacotes.
    return this.quantidadePacotes >= 3
      ? Math.round(this.precoBase * 0.9 * 100) / 100
      : this.precoBase;
  }

  public obterDescricao(): string {
    return `${this.nomeProduto} - Kit com ${this.quantidadePacotes} pacotes`;
  }
}
