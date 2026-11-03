/** Entidade de domínio: protege os dados internos do usuário. */
export class Usuario {
  private _nome: string;
  private readonly _email: string;
  private readonly _cpf: string;
  private readonly _senhaHash: string;

  constructor(nome: string, email: string, cpf: string, senhaHash: string) {
    if (!nome.trim()) throw new Error('O nome é obrigatório.');
    if (!email.trim()) throw new Error('O email é obrigatório.');
    if (!cpf.trim()) throw new Error('O CPF é obrigatório.');
    if (!senhaHash) throw new Error('O hash da senha é obrigatório.');

    this._nome = nome.trim();
    this._email = email.trim().toLowerCase();
    this._cpf = cpf.replace(/\D/g, '');
    this._senhaHash = senhaHash;
  }

  get nome(): string { return this._nome; }

  set nome(novoNome: string) {
    if (!novoNome.trim()) throw new Error('O nome não pode ficar vazio.');
    this._nome = novoNome.trim();
  }
  get email(): string { return this._email; }
  get cpf(): string { return this._cpf; }

  /** Dados liberados para persistência; a senha original nunca é armazenada. */
  paraPersistencia() {
    return {
      nome: this._nome,
      email: this._email,
      cpf: this._cpf,
      senha: this._senhaHash,
    };
  }
}
