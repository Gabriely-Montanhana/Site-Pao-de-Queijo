/** Entidade de domínio: representa uma categoria de produtos. */
export class Categoria {
  private _nome: string;

  constructor(nome: string) {
    if (!nome.trim()) {
      throw new Error('O nome da categoria é obrigatório.');
    }

    this._nome = nome.trim();
  }

  get nome(): string {
    return this._nome;
  }

  set nome(novoNome: string) {
    if (!novoNome.trim()) {
      throw new Error('O nome da categoria não pode ficar vazio.');
    }

    this._nome = novoNome.trim();
  }

  paraPersistencia() {
    return {
      nome: this._nome,
    };
  }
}