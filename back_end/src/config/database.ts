import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME ?? 'banepane',
  process.env.DB_USER ?? 'root',
  process.env.DB_PASSWORD ?? '',
  {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    dialect: 'mysql',
    logging: false,
  },
);

export const UsuarioModel = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  cpf: { type: DataTypes.STRING(11), allowNull: false, unique: true },
  senha: { type: DataTypes.STRING(255), allowNull: false },
}, { tableName: 'usuarios', timestamps: true });

export const ProdutoModel = sequelize.define('Produto', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  nome: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },

  descricao: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },

  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

  estoque: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },

  categoria_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
}, {
  tableName: 'produtos',
  timestamps: true,
});

export const CategoriaModel = sequelize.define('Categoria', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'categorias',
  timestamps: true,
});

export const PedidoModel = sequelize.define('Pedido', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'pendente',
  },
  valor_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
}, {
  tableName: 'pedidos',
  timestamps: true,
});

export { sequelize };
