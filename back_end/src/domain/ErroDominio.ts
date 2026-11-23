
/**
 * Exceção personalizada para erros nas regras de negócio.
 */
export class ErroDominio extends Error {
  constructor(
    mensagem: string,
    public readonly codigo: string
  ) {
    super(mensagem);

    this.name = 'ErroDominio';
    Object.setPrototypeOf(this, ErroDominio.prototype);
  }
}
