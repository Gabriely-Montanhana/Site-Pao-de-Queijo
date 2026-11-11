import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { gerarToken, autenticarToken } from './middleware/auth';
import { Usuario } from './models/Usuario';
import { Endereco } from './models/endereco';
import { validarEmail, validarCpf, validarForcaSenha } from './utils/validacoes';
import {
  sequelize,
  UsuarioModel,
  ProdutoModel,
  CategoriaModel,
  PedidoModel,
  EnderecoModel,
} from './config/database';


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

app.post('/api/produtos', autenticarToken, async (req: Request, res: Response) => {
  try {
    const { nome, descricao, preco, estoque, categoriaId } = req.body as {
      nome?: string;
      descricao?: string;
      preco?: number;
      estoque?: number;
      categoriaId?: number | null;
    };

    if (
      !nome?.trim() ||
      !descricao?.trim() ||
      preco === undefined ||
      estoque === undefined
    ) {
      return res.status(400).json({
        mensagem: 'Preencha nome, descrição, preço e estoque.',
      });
    }

   const produto = await ProdutoModel.create({
  nome: nome.trim(),
  descricao: descricao.trim(),
  preco,
  estoque,
  categoria_id: categoriaId ?? null,
});

    return res.status(201).json({
      mensagem: 'Produto cadastrado com sucesso.',
      produto,
    });
  } catch (erro) {
    console.error('Erro ao cadastrar produto:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao cadastrar produto.',
    });
  }
});

app.get('/api/produtos', autenticarToken, async (req, res) => {
  try {
    const pagina = Number(req.query.pagina ?? 1);
    const limite = Number(req.query.limite ?? 10);

    if (
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      !Number.isInteger(limite) ||
      limite < 1 ||
      limite > 100
    ) {
      return res.status(400).json({
        mensagem: 'Página ou limite inválido.',
      });
    }

    const deslocamento = (pagina - 1) * limite;

    const { count, rows } = await ProdutoModel.findAndCountAll({
      limit: limite,
      offset: deslocamento,
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      mensagem: 'Produtos encontrados com sucesso.',
      produtos: rows,
      paginacao: {
        pagina,
        limite,
        total: count,
        totalPaginas: Math.ceil(count / limite),
      },
    });
  } catch (erro) {
    console.error('Erro ao listar produtos:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao listar produtos.',
    });
  }
});

app.put('/api/produtos/:id', autenticarToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        mensagem: 'ID do produto inválido.',
      });
    }

    const { nome, descricao, preco, estoque, categoriaId } = req.body as {
      nome?: string;
      descricao?: string;
      preco?: number;
      estoque?: number;
      categoriaId?: number | null;
    };

    if (
      !nome?.trim() ||
      !descricao?.trim() ||
      preco === undefined ||
      estoque === undefined
    ) {
      return res.status(400).json({
        mensagem: 'Preencha nome, descrição, preço e estoque.',
      });
    }

    const produto = await ProdutoModel.findByPk(id);

    if (!produto) {
      return res.status(404).json({
        mensagem: 'Produto não encontrado.',
      });
    }

    await produto.update({
      nome: nome.trim(),
      descricao: descricao.trim(),
      preco,
      estoque,
      categoria_id: categoriaId ?? null,
    });

    return res.status(200).json({
      mensagem: 'Produto atualizado com sucesso.',
      produto,
    });
  } catch (erro) {
    console.error('Erro ao atualizar produto:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao atualizar produto.',
    });
  }
});

app.delete('/api/produtos/:id', autenticarToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        mensagem: 'ID do produto inválido.',
      });
    }

    const produto = await ProdutoModel.findByPk(id);

    if (!produto) {
      return res.status(404).json({
        mensagem: 'Produto não encontrado.',
      });
    }

    await produto.destroy();

    return res.status(200).json({
      mensagem: 'Produto excluído com sucesso.',
    });
  } catch (erro) {
    console.error('Erro ao excluir produto:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao excluir produto.',
    });
  }
});

app.post('/api/categorias', autenticarToken, async (req: Request, res: Response) => {
  try {
    const { nome } = req.body as {
      nome?: string;
    };

    if (!nome?.trim()) {
      return res.status(400).json({
        mensagem: 'O nome da categoria é obrigatório.',
      });
    }

    const categoriaExistente = await CategoriaModel.findOne({
      where: {
        nome: nome.trim(),
      },
    });

    if (categoriaExistente) {
      return res.status(409).json({
        mensagem: 'Esta categoria já existe.',
      });
    }

    const categoria = await CategoriaModel.create({
      nome: nome.trim(),
    });

    return res.status(201).json({
      mensagem: 'Categoria cadastrada com sucesso.',
      categoria,
    });
  } catch (erro) {
    console.error('Erro ao cadastrar categoria:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao cadastrar categoria.',
    });
  }
});

app.get('/api/categorias', autenticarToken, async (req, res) => {
  try {
    const pagina = Number(req.query.pagina ?? 1);
    const limite = Number(req.query.limite ?? 10);

    if (
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      !Number.isInteger(limite) ||
      limite < 1 ||
      limite > 100
    ) {
      return res.status(400).json({
        mensagem: 'Página ou limite inválido.',
      });
    }

    const deslocamento = (pagina - 1) * limite;

    const { count, rows } = await CategoriaModel.findAndCountAll({
      limit: limite,
      offset: deslocamento,
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      mensagem: 'Categorias encontradas com sucesso.',
      categorias: rows,
      paginacao: {
        pagina,
        limite,
        total: count,
        totalPaginas: Math.ceil(count / limite),
      },
    });
  } catch (erro) {
    console.error('Erro ao listar categorias:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao listar categorias.',
    });
  }
});

app.put('/api/categorias/:id', autenticarToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        mensagem: 'ID da categoria inválido.',
      });
    }

    const { nome } = req.body as {
      nome?: string;
    };

    if (!nome?.trim()) {
      return res.status(400).json({
        mensagem: 'O nome da categoria é obrigatório.',
      });
    }

    const categoria = await CategoriaModel.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        mensagem: 'Categoria não encontrada.',
      });
    }

    const categoriaExistente = await CategoriaModel.findOne({
      where: {
        nome: nome.trim(),
      },
    });

    if (
      categoriaExistente &&
      categoriaExistente.get('id') !== id
    ) {
      return res.status(409).json({
        mensagem: 'Esta categoria já existe.',
      });
    }

    await categoria.update({
      nome: nome.trim(),
    });

    return res.status(200).json({
      mensagem: 'Categoria atualizada com sucesso.',
      categoria,
    });
  } catch (erro) {
    console.error('Erro ao atualizar categoria:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao atualizar categoria.',
    });
  }
});

app.delete('/api/categorias/:id', autenticarToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        mensagem: 'ID da categoria inválido.',
      });
    }

    const categoria = await CategoriaModel.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        mensagem: 'Categoria não encontrada.',
      });
    }

    const quantidadeProdutos = await ProdutoModel.count({
      where: {
        categoria_id: id,
      },
    });

    if (quantidadeProdutos > 0) {
      return res.status(409).json({
        mensagem: 'Não é possível excluir uma categoria que possui produtos.',
      });
    }

    await categoria.destroy();

    return res.status(200).json({
      mensagem: 'Categoria excluída com sucesso.',
    });
  } catch (erro) {
    console.error('Erro ao excluir categoria:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao excluir categoria.',
    });
  }
});

app.post('/api/pedidos', autenticarToken, async (req, res) => {
  try {
    const { usuarioId, status, valorTotal } = req.body;

    if (
      usuarioId === undefined ||
      status === undefined ||
      valorTotal === undefined
    ) {
      return res.status(400).json({
        mensagem: 'Usuário, status e valor total são obrigatórios.',
      });
    }

    if (Number(usuarioId) <= 0) {
      return res.status(400).json({
        mensagem: 'O usuário informado é inválido.',
      });
    }

    if (!String(status).trim()) {
      return res.status(400).json({
        mensagem: 'O status do pedido é obrigatório.',
      });
    }

    if (Number(valorTotal) < 0) {
      return res.status(400).json({
        mensagem: 'O valor total não pode ser negativo.',
      });
    }

    const usuario = await UsuarioModel.findByPk(Number(usuarioId));

    if (!usuario) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.',
      });
    }

    const pedido = await PedidoModel.create({
      usuario_id: Number(usuarioId),
      status: String(status).trim(),
      valor_total: Number(valorTotal),
    });

    return res.status(201).json({
      mensagem: 'Pedido criado com sucesso.',
      pedido,
    });
  } catch (erro) {
    console.error('Erro ao criar pedido:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao criar pedido.',
    });
  }
});

app.get('/api/pedidos', autenticarToken, async (req, res) => {
  try {
    const pagina = Number(req.query.pagina ?? 1);
    const limite = Number(req.query.limite ?? 10);

    if (
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      !Number.isInteger(limite) ||
      limite < 1 ||
      limite > 100
    ) {
      return res.status(400).json({
        mensagem: 'Página ou limite inválido.',
      });
    }

    const deslocamento = (pagina - 1) * limite;

    const { count, rows } = await PedidoModel.findAndCountAll({
      limit: limite,
      offset: deslocamento,
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      mensagem: 'Pedidos encontrados com sucesso.',
      pedidos: rows,
      paginacao: {
        pagina,
        limite,
        total: count,
        totalPaginas: Math.ceil(count / limite),
      },
    });
  } catch (erro) {
    console.error('Erro ao listar pedidos:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao listar pedidos.',
    });
  }
});

app.put('/api/pedidos/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, valorTotal } = req.body;

    const pedido = await PedidoModel.findByPk(Number(id));

    if (!pedido) {
      return res.status(404).json({
        mensagem: 'Pedido não encontrado.',
      });
    }

    if (status === undefined || valorTotal === undefined) {
      return res.status(400).json({
        mensagem: 'Status e valor total são obrigatórios.',
      });
    }

    if (!String(status).trim()) {
      return res.status(400).json({
        mensagem: 'O status do pedido é obrigatório.',
      });
    }

    if (Number(valorTotal) < 0) {
      return res.status(400).json({
        mensagem: 'O valor total não pode ser negativo.',
      });
    }

    await pedido.update({
      status: String(status).trim(),
      valor_total: Number(valorTotal),
    });

    return res.status(200).json({
      mensagem: 'Pedido atualizado com sucesso.',
      pedido,
    });
  } catch (erro) {
    console.error('Erro ao atualizar pedido:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao atualizar pedido.',
    });
  }
});

app.delete('/api/pedidos/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await PedidoModel.findByPk(Number(id));

    if (!pedido) {
      return res.status(404).json({
        mensagem: 'Pedido não encontrado.',
      });
    }

    await pedido.destroy();

    return res.status(200).json({
      mensagem: 'Pedido excluído com sucesso.',
    });
  } catch (erro) {
    console.error('Erro ao excluir pedido:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao excluir pedido.',
    });
  }
});

app.post('/api/enderecos', autenticarToken, async (req, res) => {
  try {
    const usuarioId = (req as typeof req & { usuarioId: number }).usuarioId;

    const {
      rua,
      numero,
      bairro,
      cidade,
      estado,
      cep,
    } = req.body;

    if (
      typeof rua !== 'string' ||
      typeof numero !== 'string' ||
      typeof bairro !== 'string' ||
      typeof cidade !== 'string' ||
      typeof estado !== 'string' ||
      typeof cep !== 'string'
    ) {
      return res.status(400).json({
        mensagem: 'Todos os campos do endereço são obrigatórios.',
      });
    }

    const endereco = new Endereco(
      usuarioId,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      cep,
    );

    const novoEndereco = await EnderecoModel.create(
      endereco.paraPersistencia(),
    );

    return res.status(201).json({
      mensagem: 'Endereço cadastrado com sucesso.',
      endereco: novoEndereco,
    });
  } catch (erro) {
    if (erro instanceof Error) {
      return res.status(400).json({
        mensagem: erro.message,
      });
    }

    console.error('Erro ao cadastrar endereço:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao cadastrar endereço.',
    });
  }
});

app.get('/api/enderecos', autenticarToken, async (req, res) => {
  try {
    const usuarioId = (req as typeof req & { usuarioId: number }).usuarioId;

    const pagina = Number(req.query.pagina ?? 1);
    const limite = Number(req.query.limite ?? 10);

    if (
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      !Number.isInteger(limite) ||
      limite < 1 ||
      limite > 100
    ) {
      return res.status(400).json({
        mensagem: 'Página ou limite inválido.',
      });
    }

    const deslocamento = (pagina - 1) * limite;

    const { count, rows } = await EnderecoModel.findAndCountAll({
      where: {
        usuario_id: usuarioId,
      },
      limit: limite,
      offset: deslocamento,
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      mensagem: 'Endereços encontrados com sucesso.',
      enderecos: rows,
      paginacao: {
        pagina,
        limite,
        total: count,
        totalPaginas: Math.ceil(count / limite),
      },
    });
  } catch (erro) {
    console.error('Erro ao listar endereços:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao listar endereços.',
    });
  }
});

app.put('/api/enderecos/:id', autenticarToken, async (req, res) => {
  try {
    const usuarioId = (req as typeof req & { usuarioId: number }).usuarioId;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensagem: 'ID do endereço inválido.',
      });
    }

    const enderecoExistente = await EnderecoModel.findOne({
      where: {
        id,
        usuario_id: usuarioId,
      },
    });

    if (!enderecoExistente) {
      return res.status(404).json({
        mensagem: 'Endereço não encontrado.',
      });
    }

    const { rua, numero, bairro, cidade, estado, cep } = req.body;

    if (
      typeof rua !== 'string' ||
      typeof numero !== 'string' ||
      typeof bairro !== 'string' ||
      typeof cidade !== 'string' ||
      typeof estado !== 'string' ||
      typeof cep !== 'string'
    ) {
      return res.status(400).json({
        mensagem: 'Todos os campos do endereço são obrigatórios.',
      });
    }

    const endereco = new Endereco(
      usuarioId,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      cep,
    );

    await enderecoExistente.update(endereco.paraPersistencia());

    return res.status(200).json({
      mensagem: 'Endereço atualizado com sucesso.',
      endereco: enderecoExistente,
    });
  } catch (erro) {
    if (erro instanceof Error && erro.message.startsWith('O ')) {
      return res.status(400).json({
        mensagem: erro.message,
      });
    }

    console.error('Erro ao atualizar endereço:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao atualizar endereço.',
    });
  }
});

app.delete('/api/enderecos/:id', autenticarToken, async (req, res) => {
  try {
    const usuarioId = (req as typeof req & { usuarioId: number }).usuarioId;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensagem: 'ID do endereço inválido.',
      });
    }

    const endereco = await EnderecoModel.findOne({
      where: {
        id,
        usuario_id: usuarioId,
      },
    });

    if (!endereco) {
      return res.status(404).json({
        mensagem: 'Endereço não encontrado.',
      });
    }

    await endereco.destroy();

    return res.status(200).json({
      mensagem: 'Endereço excluído com sucesso.',
    });
  } catch (erro) {
    console.error('Erro ao excluir endereço:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao excluir endereço.',
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
