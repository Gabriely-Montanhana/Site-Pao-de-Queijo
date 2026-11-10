import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { gerarToken, autenticarToken } from './middleware/auth';
import { Usuario } from './models/Usuario';
import { validarEmail, validarCpf, validarForcaSenha } from './utils/validacoes';
import { sequelize, UsuarioModel } from './config/database';


console.log('JWT_SECRET:', process.env.JWT_SECRET);

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

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body as {
      email?: string;
      senha?: string;
    };

    if (!email?.trim() || !senha) {
      return res.status(400).json({
        mensagem: 'Informe email e senha.',
      });
    }

    if (!validarEmail(email)) {
      return res.status(400).json({
        mensagem: 'Informe um email válido.',
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const usuario = await UsuarioModel.findOne({
      where: {
        email: emailNormalizado,
      },
    });

    if (!usuario) {
      return res.status(401).json({
        mensagem: 'Email ou senha incorretos.',
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.get('senha') as string,
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem: 'Email ou senha incorretos.',
      });
    }

    const token = gerarToken({
      id: usuario.get('id') as number,
      email: usuario.get('email') as string,
    });

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: {
        id: usuario.get('id'),
        nome: usuario.get('nome'),
        email: usuario.get('email'),
        cpf: usuario.get('cpf'),
      },
    });
  } catch (erro) {
    console.error('Erro ao realizar login:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao realizar login.',
    });
  }
});

app.put('/api/usuarios/me', autenticarToken, async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as Request & { usuarioId: number }).usuarioId;

    const { nome, email, senha, cpf } = req.body as {
      nome?: string;
      email?: string;
      senha?: string;
      cpf?: string;
    };

    if (!nome?.trim() || !email?.trim() || !senha || !cpf?.trim()) {
      return res.status(400).json({
        mensagem: 'Preencha nome, email, senha e CPF.',
      });
    }

    if (!validarCpf(cpf)) {
      return res.status(400).json({
        mensagem: 'Informe um CPF válido.',
      });
    }

    const erroSenha = validarForcaSenha(senha);

    if (erroSenha) {
      return res.status(400).json({
        mensagem: erroSenha,
      });
    }

    const usuario = await UsuarioModel.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.',
      });
    }

    const emailAtual = usuario.get('email') as string;
    const emailInformado = email.trim().toLowerCase();

    if (emailInformado !== emailAtual) {
      return res.status(400).json({
        mensagem: 'O email não pode ser alterado.',
      });
    }

    const cpfNumeros = cpf.replace(/\D/g, '');

    const cpfExistente = await UsuarioModel.findOne({
      where: {
        cpf: cpfNumeros,
      },
    });

    if (
      cpfExistente &&
      cpfExistente.get('id') !== usuarioId
    ) {
      return res.status(409).json({
        mensagem: 'Este CPF já está cadastrado.',
      });
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    await usuario.update({
      nome: nome.trim(),
      cpf: cpfNumeros,
      senha: senhaHash,
    });

    return res.status(200).json({
      mensagem: 'Usuário atualizado com sucesso.',
      usuario: {
        id: usuario.get('id'),
        nome: usuario.get('nome'),
        email: usuario.get('email'),
        cpf: usuario.get('cpf'),
      },
    });

  } catch (erro) {
    console.error('Erro ao atualizar usuário:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao atualizar usuário.',
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
