
import { DataTypes, Model, Sequelize } from 'sequelize';

export class ItemPedidoModel extends Model {
  declare id: number;
  declare pedido_id: number;
  declare produto_id: number;
  declare quantidade: number;
  declare preco_unitario: number;
}

export function inicializarItemPedido(sequelize: Sequelize): void {
  ItemPedidoModel.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      pedido_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      produto_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      quantidade: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { min: 1 },
      },
      preco_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },
    },
    {
      sequelize,
      tableName: 'itens_pedido',
      timestamps: true,
    }
  );
}
