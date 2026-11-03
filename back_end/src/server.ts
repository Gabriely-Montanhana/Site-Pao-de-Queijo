import express, { type Request, type Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Usuario } from './models/Usuario';
import { validarEmail, validarCpf, validarForcaSenha } from './utils/validacoes';
import { sequelize, UsuarioModel } from './config/database';


const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.json({ mensagem: 'API Banepane Foods funcionando!' });
});

app.post('/api/auth/cadastro', async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, cpf } = req.body as {
      nome?: string; email?: string; senha?: string; cpf?: string;
    };

    if (!nome?.trim() || !email?.trim() || !senha || !cpf?.trim()) {
      return res.status(400).json({ mensagem: 'Preencha nome, email, senha e CPF.' });
    }
    if (!validarEmail(email)) {
      return res.status(400).json({ mensagem: 'Informe um email válido.' });
    }
    if (!validarCpf(cpf)) {
      return res.status(400).json({ mensagem: 'Informe um CPF válido.' });
    }
    const erroSenha = validarForcaSenha(senha);
    if (erroSenha) {
      return res.status(400).json({ mensagem: erroSenha });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const cpfNumeros = cpf.replace(/\D/g, '');
    const existente = await UsuarioModel.findOne({
      where: { email: emailNormalizado },
    });
    if (existente) {
      return res.status(409).json({ mensagem: 'Este email já está cadastrado.' });
    }
    const cpfExistente = await UsuarioModel.findOne({ where: { cpf: cpfNumeros } });
    if (cpfExistente) {
      return res.status(409).json({ mensagem: 'Este CPF já está cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const usuario = new Usuario(nome.trim(), emailNormalizado, cpfNumeros, senhaHash);
    const salvo = await UsuarioModel.create(usuario.paraPersistencia());

     return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso.',
      usuario: {
        id: salvo.get("id"),
        nome: salvo.get("nome"),
        email: salvo.get("email"),
        cpf: salvo.get("cpf")
      }
    });

  } catch (erro) {
    console.error('Erro ao cadastrar usuário:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao cadastrar usuário.'
    });
  }
});
const PORTA = Number(process.env.PORT ?? 3000);
async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    console.log('Conexão com MySQL estabelecida.');

   app.listen(PORTA, '0.0.0.0', () => {
  console.log(`API rodando na porta ${PORTA}`);
});

  } catch (erro) {
    console.error('Não foi possível conectar ao MySQL:', erro);
    process.exit(1);
  }
}

void iniciarServidor();
