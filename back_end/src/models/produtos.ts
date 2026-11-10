/** Entidade de domínio: representa um produto da loja. */
export class Produto {
  private _nome: string;
  private _descricao: string;
  private _preco: number;
  private _estoque: number;
  private readonly _categoriaId: number | null;

  constructor(
    nome: string,
    descricao: string,
    preco: number,
    estoque: number,
    categoriaId: number | null = null,
  ) {
    if (!nome.trim()) {
      throw new Error('O nome é obrigatório.');
    }

    if (!descricao.trim()) {
      throw new Error('A descrição é obrigatória.');
    }

    if (preco < 0) {
      throw new Error('O preço não pode ser negativo.');
    }

    if (estoque < 0) {
      throw new Error('O estoque não pode ser negativo.');
    }

    this._nome = nome.trim();
    this._descricao = descricao.trim();
    this._preco = preco;
    this._estoque = estoque;
    this._categoriaId = categoriaId;
  }

  get nome(): string {
    return this._nome;
  }

  set nome(novoNome: string) {
    if (!novoNome.trim()) {
      throw new Error('O nome não pode ficar vazio.');
    }

    this._nome = novoNome.trim();
  }

  get descricao(): string {
    return this._descricao;
  }

  set descricao(novaDescricao: string) {
    if (!novaDescricao.trim()) {
      throw new Error('A descrição não pode ficar vazia.');
    }

    this._descricao = novaDescricao.trim();
  }

  get preco(): number {
    return this._preco;
  }

  set preco(novoPreco: number) {
    if (novoPreco < 0) {
      throw new Error('O preço não pode ser negativo.');
    }

    this._preco = novoPreco;
  }

  get estoque(): number {
    return this._estoque;
  }

  set estoque(novoEstoque: number) {
    if (novoEstoque < 0) {
      throw new Error('O estoque não pode ser negativo.');
    }

    this._estoque = novoEstoque;
  }

  get categoriaId(): number | null {
    return this._categoriaId;
  }

  paraPersistencia() {
    return {
      nome: this._nome,
      descricao: this._descricao,
      preco: this._preco,
      estoque: this._estoque,
      categoria_id: this._categoriaId,
    };
  }
}