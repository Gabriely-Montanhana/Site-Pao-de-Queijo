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

export { sequelize };
