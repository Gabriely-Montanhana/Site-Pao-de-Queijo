/** Entidade de domínio: representa um endereço de entrega. */
export class Endereco {
  private readonly _usuarioId: number;
  private _rua: string;
  private _numero: string;
  private _bairro: string;
  private _cidade: string;
  private _estado: string;
  private _cep: string;

  constructor(
    usuarioId: number,
    rua: string,
    numero: string,
    bairro: string,
    cidade: string,
    estado: string,
    cep: string,
  ) {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new Error('O usuário informado é inválido.');
    }

    if (
      !rua.trim() ||
      !numero.trim() ||
      !bairro.trim() ||
      !cidade.trim()
    ) {
      throw new Error('Todos os campos do endereço são obrigatórios.');
    }

    const estadoNormalizado = estado.trim().toUpperCase();
    const cepNormalizado = cep.replace(/\D/g, '');

    if (!/^[A-Z]{2}$/.test(estadoNormalizado)) {
      throw new Error('O estado deve conter uma sigla de 2 letras.');
    }

    if (!/^\d{8}$/.test(cepNormalizado)) {
      throw new Error('O CEP deve conter 8 números.');
    }

    this._usuarioId = usuarioId;
    this._rua = rua.trim();
    this._numero = numero.trim();
    this._bairro = bairro.trim();
    this._cidade = cidade.trim();
    this._estado = estadoNormalizado;
    this._cep = cepNormalizado;
  }

  paraPersistencia() {
    return {
      usuario_id: this._usuarioId,
      rua: this._rua,
      numero: this._numero,
      bairro: this._bairro,
      cidade: this._cidade,
      estado: this._estado,
      cep: this._cep,
    };
  }
}