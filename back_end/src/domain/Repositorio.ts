
/**
 * Interface genérica para operações de consulta.
 * Demonstra TypeScript Generics e inversão de dependência (SOLID).
 */
export interface Repositorio<T, ID = number> {
  buscarPorId(id: ID): Promise<T | null>;
  listar(): Promise<T[]>;
}

/**
 * Serviço que depende de uma abstração, não de um banco específico.
 * Demonstra o princípio da inversão de dependência (DIP).
 */
export class ServicoConsulta<T, ID = number> {
  constructor(
    private readonly repositorio: Repositorio<T, ID>
  ) {}

  public buscar(id: ID): Promise<T | null> {
    return this.repositorio.buscarPorId(id);
  }

  public listarTodos(): Promise<T[]> {
    return this.repositorio.listar();
  }
}
