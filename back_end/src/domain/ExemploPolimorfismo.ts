
import { ProdutoComercializavel } from './ProdutoBase';
import { PaoDeQueijoCongelado } from './PaoDeQueijoCongelado';
import { KitPaoDeQueijo } from './KitPaoDeQueijo';

/**
 * Demonstra polimorfismo usando diferentes produtos.
 */
export function demonstrarPolimorfismo(): void {
  const produtos: ProdutoComercializavel[] = [
    new PaoDeQueijoCongelado(
      'Pão de Queijo Tradicional',
      25.90,
      'Tradicional'
    ),
    new KitPaoDeQueijo(
      'Kit Família',
      90.00,
      3
    ),
  ];

  for (const produto of produtos) {
    console.log(produto.obterDescricao());
    console.log(`Preço final: R$ ${produto.calcularPrecoFinal().toFixed(2)}`);
  }
}
