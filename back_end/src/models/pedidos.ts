/** Entidade de domínio: representa um pedido da loja. */
export class Pedido {
  private _usuarioId: number;
  private _status: string;
  private _valorTotal: number;

  constructor(
    usuarioId: number,
    status: string,
    valorTotal: number,
  ) {
    if (usuarioId <= 0) {
      throw new Error('O usuário do pedido é obrigatório.');
    }

    if (!status.trim()) {
      throw new Error('O status do pedido é obrigatório.');
    }

    if (valorTotal < 0) {
      throw new Error('O valor total não pode ser negativo.');
    }

    this._usuarioId = usuarioId;
    this._status = status.trim();
    this._valorTotal = valorTotal;
  }

  get usuarioId(): number {
    return this._usuarioId;
  }

  get status(): string {
    return this._status;
  }

  set status(novoStatus: string) {
    if (!novoStatus.trim()) {
      throw new Error('O status não pode ficar vazio.');
    }

    this._status = novoStatus.trim();
  }

  get valorTotal(): number {
    return this._valorTotal;
  }

  set valorTotal(novoValor: number) {
    if (novoValor < 0) {
      throw new Error('O valor total não pode ser negativo.');
    }

    this._valorTotal = novoValor;
  }

  paraPersistencia() {
    return {
      usuario_id: this._usuarioId,
      status: this._status,
      valor_total: this._valorTotal,
    };
  }
}