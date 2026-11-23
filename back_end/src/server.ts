import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { gerarToken, autenticarToken, autorizarAdmin } from './middleware/auth';
import { Usuario } from './models/Usuario';
import { Endereco } from './models/endereco';
import { ProdutoComercializavel } from './domain/ProdutoBase';
import { PaoDeQueijoCongelado } from './domain/PaoDeQueijoCongelado';
import { KitPaoDeQueijo } from './domain/KitPaoDeQueijo';
import { Produto } from './models/produtos';
import { validarEmail, validarCpf, validarForcaSenha } from './utils/validacoes';
import {
  sequelize,
  UsuarioModel,
  ProdutoModel,
  CategoriaModel,
  PedidoModel,
  EnderecoModel,
  ItemPedidoModel,
} from './config/database';


const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.json({ mensagem: 'API Banepane Foods funcionando!' });
});

// Rúbrica: cadastro com nome, email, senha e CPF.
app.post('/api/auth/cadastro', async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, cpf } = req.body as {
      nome?: string; email?: string; senha?: string; cpf?: string;
    };

    // Os quatro campos são obrigatórios.
    if (!nome?.trim() || !email?.trim() || !senha || !cpf?.trim()) {
      return res.status(400).json({ mensagem: 'Preencha nome, email, senha e CPF.' });
    }
    // Validação de e-mail por regex.
    if (!validarEmail(email)) {
      return res.status(400).json({ mensagem: 'Informe um email válido.' });
    }
    // Validação dos dígitos do CPF.
    if (!validarCpf(cpf)) {
      return res.status(400).json({ mensagem: 'Informe um CPF válido.' });
    }
    // Validação do nível da senha: tamanho, maiúscula, minúscula, número e símbolo.
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

    // A senha é gravada criptografada. O banco recebe o hash, não o texto original.
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

// Rúbrica: login com e-mail e senha.
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

    // Validação de e-mail por regex, também no login.
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

    // Só entra quem já está cadastrado.
    if (!usuario) {
      return res.status(401).json({
        mensagem: 'Email ou senha incorretos.',
      });
    }

    // Compara a senha digitada com o hash salvo no banco.
    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.get('senha') as string,
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem: 'Email ou senha incorretos.',
      });
    }

    // Retorno do JWT para o front guardar e enviar nas próximas requisições.
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
        perfil: usuario.get('perfil'),
      },
    });
  } catch (erro) {
    console.error('Erro ao realizar login:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao realizar login.',
    });
  }
});

// Rúbrica: edição autenticada. O id vem do token, então a pessoa só altera a própria conta.
app.put('/api/usuarios/me', autenticarToken, async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as Request & { usuarioId: number }).usuarioId;

    const { nome, email, senha, cpf } = req.body as {
      nome?: string;
      email?: string;
      senha?: string;
      cpf?: string;
    };

    // Na edição, nome, email, senha e CPF continuam obrigatórios.
    if (!nome?.trim() || !email?.trim() || !senha || !cpf?.trim()) {
      return res.status(400).json({
        mensagem: 'Preencha nome, email, senha e CPF.',
      });
    }

    // CPF e nível da senha são validados de novo antes de gravar.
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

    // O e-mail não pode ser trocado.
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

    // A nova senha também é gravada criptografada.
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

// Demonstração de herança e polimorfismo - Tech Forge
app.get('/api/techforge/produtos', autenticarToken, (req: Request, res: Response) => {
  const produtos: ProdutoComercializavel[] = [
    new PaoDeQueijoCongelado(
      'Pão de Queijo Tradicional',
      25.90,
      'Tradicional'
    ),
    new KitPaoDeQueijo(
      'Kit Família',
      90.00,
      3
    )
  ];

  const resultado = produtos.map((produto) => ({
    descricao: produto.obterDescricao(),
    precoFinal: produto.calcularPrecoFinal()
  }));

  return res.status(200).json({
    mensagem: 'Demonstração de polimorfismo - Tech Forge',
    produtos: resultado
  });
});

// CRUD de produtos. autenticarToken exige login em criar, listar, editar e apagar.
app.post('/api/produtos', autenticarToken, autorizarAdmin, async (req: Request, res: Response) => {
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

  const produtoDominio = new Produto(
  nome,
  descricao,
  preco,
  estoque,
  categoriaId ?? null
);

const produto = await ProdutoModel.create(
  produtoDominio.paraPersistencia()
);

    return res.status(201).json({
      mensagem: 'Produto cadastrado com sucesso.',
      produto,
    });
   } catch (erro) {
    if (
      erro instanceof Error &&
      (
        erro.message.startsWith('O nome') ||
        erro.message.startsWith('A descrição') ||
        erro.message.startsWith('O preço') ||
        erro.message.startsWith('O estoque')
      )
    ) {
      return res.status(400).json({
        mensagem: erro.message,
      });
    }

    console.error('Erro ao cadastrar produto:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao cadastrar produto.',
    });
  }
});


// Paginação da listagem: pagina e limite vêm da URL.
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

app.put('/api/produtos/:id', autenticarToken,autorizarAdmin, async (req: Request, res: Response) => {
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

    // Não edita recurso que não existe.
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
      // Relacionamento: o produto aponta para uma categoria.
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

app.delete('/api/produtos/:id', autenticarToken,autorizarAdmin, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        mensagem: 'ID do produto inválido.',
      });
    }

    const produto = await ProdutoModel.findByPk(id);

    // Não apaga recurso que não existe. O mesmo 404 vale para categoria, pedido e endereço.
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

// CRUD de categorias. A listagem também usa pagina e limite, como a de produtos.
app.post('/api/categorias', autenticarToken, autorizarAdmin, async (req: Request, res: Response) => {
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

app.put('/api/categorias/:id', autenticarToken,autorizarAdmin, async (req: Request, res: Response) => {
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

app.delete('/api/categorias/:id', autenticarToken,autorizarAdmin, async (req: Request, res: Response) => {
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

    // Relacionamento: categoria com produtos não pode ser apagada.
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


// CRUD de pedidos. A rota exige login e o pedido fica ligado ao usuário do token.
app.post('/api/pedidos', autenticarToken, async (req, res) => {
  try {
    const usuarioId = (req as typeof req & { usuarioId: number }).usuarioId;
    const { itens } = req.body;

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        mensagem: 'O pedido precisa ter pelo menos um produto.',
      });
    }

    const usuario = await UsuarioModel.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.',
      });
    }

    const pedido = await sequelize.transaction(async (transacao) => {
      let totalCentavos = 0;
      const itensValidados: Array<{
        produtoId: number;
        quantidade: number;
        precoUnitario: number;
      }> = [];

      const idsUtilizados = new Set<number>();

      for (const item of itens) {
        const produtoId = item?.produtoId;
        const quantidade = item?.quantidade;

        if (
          !Number.isInteger(produtoId) ||
          produtoId <= 0 ||
          !Number.isInteger(quantidade) ||
          quantidade <= 0
        ) {
          throw new Error('ITEM_INVALIDO');
        }

        if (idsUtilizados.has(produtoId)) {
          throw new Error('PRODUTO_DUPLICADO');
        }

        idsUtilizados.add(produtoId);

        const produto = await ProdutoModel.findByPk(produtoId, {
          transaction: transacao,
          lock: transacao.LOCK.UPDATE,
        });

        if (!produto) {
          throw new Error('PRODUTO_NAO_ENCONTRADO');
        }

        const estoque = Number(produto.get('estoque'));
        const precoUnitario = Number(produto.get('preco'));

        if (
          !Number.isInteger(estoque) ||
          estoque < quantidade
        ) {
          throw new Error('ESTOQUE_INSUFICIENTE');
        }

        if (!Number.isFinite(precoUnitario) || precoUnitario < 0) {
          throw new Error('PRECO_INVALIDO');
        }

        const precoCentavos = Math.round(precoUnitario * 100);
        totalCentavos += precoCentavos * quantidade;

        if (!Number.isSafeInteger(totalCentavos)) {
          throw new Error('TOTAL_INVALIDO');
        }

        itensValidados.push({
          produtoId,
          quantidade,
          precoUnitario,
        });

        await produto.update(
          { estoque: estoque - quantidade },
          { transaction: transacao }
        );
      }

      const novoPedido = await PedidoModel.create(
        {
          usuario_id: usuarioId,
          status: 'pendente',
          valor_total: totalCentavos / 100,
        },
        { transaction: transacao }
      );

      const pedidoId = Number(novoPedido.get('id'));

      for (const item of itensValidados) {
        await ItemPedidoModel.create(
          {
            pedido_id: pedidoId,
            produto_id: item.produtoId,
            quantidade: item.quantidade,
            preco_unitario: item.precoUnitario,
          },
          { transaction: transacao }
        );
      }

      return novoPedido;
    });

    return res.status(201).json({
      mensagem: 'Pedido criado com sucesso.',
      pedido,
    });
  } catch (erro) {
    if (erro instanceof Error) {
      const mensagens: Record<string, string> = {
        ITEM_INVALIDO: 'Produto ou quantidade inválida.',
        PRODUTO_DUPLICADO: 'O mesmo produto foi enviado mais de uma vez.',
        PRODUTO_NAO_ENCONTRADO: 'Produto não encontrado.',
        ESTOQUE_INSUFICIENTE: 'Estoque insuficiente.',
        PRECO_INVALIDO: 'Preço do produto inválido.',
        TOTAL_INVALIDO: 'Valor total do pedido inválido.',
      };

      if (mensagens[erro.message]) {
        return res.status(400).json({
          mensagem: mensagens[erro.message],
        });
      }
    }

    console.error('Erro ao criar pedido:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao criar pedido.',
    });
  }
});


// Listar todas as vendas - somente administrador
app.get('/api/admin/pedidos', autenticarToken, autorizarAdmin, async (req, res) => {
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

const pedidosComCliente = await Promise.all(
  rows.map(async (pedido) => {
    const dadosPedido = pedido.get({ plain: true });
    const usuarioId = Number(pedido.get('usuario_id'));

    const usuario = await UsuarioModel.findByPk(usuarioId);
    const enderecos = await EnderecoModel.findAll({
  where: { usuario_id: usuarioId },
});

    return {
  ...dadosPedido,
  usuario_nome: usuario?.get('nome') ?? null,
  usuario_email: usuario?.get('email') ?? null,
  usuario_cpf: usuario?.get('cpf') ?? null,
  enderecos: enderecos.map((endereco) =>
    endereco.get({ plain: true })
  ),
};
  })
);

    return res.status(200).json({
      mensagem: 'Todas as vendas encontradas com sucesso.',
      pedidos: pedidosComCliente,
      paginacao: {
        pagina,
        limite,
        total: count,
        totalPaginas: Math.ceil(count / limite),
      },
    });
  } catch (erro) {
    console.error('Erro ao listar vendas administrativas:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao listar vendas.',
    });
  }
});

// Listagem do próprio usuário, também paginada por pagina e limite.
app.get('/api/pedidos', autenticarToken, async (req, res) => {
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

    const { count, rows } = await PedidoModel.findAndCountAll({
      where: {
        usuario_id: usuarioId,
      },
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

app.put('/api/pedidos/:id', autenticarToken, autorizarAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensagem: 'ID do pedido inválido.',
      });
    }

   const pedido = await PedidoModel.findByPk(id);

    if (!pedido) {
      return res.status(404).json({
        mensagem: 'Pedido não encontrado.',
      });
    }

    if (typeof status !== 'string' || !status.trim()) {
      return res.status(400).json({
        mensagem: 'O status do pedido é obrigatório.',
      });
    }

   const statusPermitidos = [
  'pendente',
  'pago',
  'enviado',
  'entregue',
  'cancelado',
];

if (
  typeof status !== 'string' ||
  !statusPermitidos.includes(status.trim().toLowerCase())
) {
  return res.status(400).json({
    mensagem: 'Status do pedido inválido.',
  });
}


const novoStatus = status.trim().toLowerCase();

await sequelize.transaction(async (transacao) => {
  const pedidoAtual = await PedidoModel.findByPk(id, {
    transaction: transacao,
    lock: transacao.LOCK.UPDATE,
  });

  if (!pedidoAtual) {
    throw new Error('PEDIDO_NAO_ENCONTRADO');
  }

  const statusAnterior = String(
    pedidoAtual.get('status')
  ).toLowerCase();

  // Um pedido cancelado não pode ser reativado.
  if (statusAnterior === 'cancelado' && novoStatus !== 'cancelado') {
    throw new Error('PEDIDO_JA_CANCELADO');
  }

  // Não permitir cancelamento após pagamento ou envio.
  if (
    novoStatus === 'cancelado' &&
    !['pendente', 'cancelado'].includes(statusAnterior)
  ) {
    throw new Error('CANCELAMENTO_NAO_PERMITIDO');
  }

  // Devolver o estoque apenas no primeiro cancelamento.
  if (novoStatus === 'cancelado' && statusAnterior === 'pendente') {
    const itens = await ItemPedidoModel.findAll({
      where: { pedido_id: id },
      transaction: transacao,
    });

    for (const item of itens) {
      const produto = await ProdutoModel.findByPk(item.produto_id, {
        transaction: transacao,
        lock: transacao.LOCK.UPDATE,
      });

      if (!produto) {
        throw new Error('PRODUTO_NAO_ENCONTRADO');
      }

      const estoqueAtual = Number(produto.get('estoque'));

      await produto.update(
        { estoque: estoqueAtual + item.quantidade },
        { transaction: transacao }
      );
    }
  }

  await pedidoAtual.update(
    { status: novoStatus },
    { transaction: transacao }
  );

  pedido.set('status', novoStatus);
});


    return res.status(200).json({
      mensagem: 'Pedido atualizado com sucesso.',
      pedido,
    });
  } catch (erro) {
    if (erro instanceof Error) {
  const mensagens: Record<string, string> = {
    PEDIDO_NAO_ENCONTRADO: 'Pedido não encontrado.',
    PEDIDO_JA_CANCELADO: 'Um pedido cancelado não pode ser reativado.',
    CANCELAMENTO_NAO_PERMITIDO: 'Este pedido não pode ser cancelado.',
    PRODUTO_NAO_ENCONTRADO: 'Produto do pedido não encontrado.',
  };

  if (mensagens[erro.message]) {
    return res.status(400).json({
      mensagem: mensagens[erro.message],
    });
  }
}
    console.error('Erro ao atualizar pedido:', erro);

    return res.status(500).json({
      mensagem: 'Erro interno ao atualizar pedido.',
    });
  }
});

app.delete('/api/pedidos/:id', autenticarToken, autorizarAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensagem: 'ID do pedido inválido.',
      });
    }

    const pedido = await PedidoModel.findByPk(id);

    if (!pedido) {
      return res.status(404).json({
        mensagem: 'Pedido não encontrado.',
      });
    }

const statusAtual = String(pedido.get('status')).toLowerCase();

if (!['pendente', 'cancelado'].includes(statusAtual)) {
  return res.status(400).json({
    mensagem: 'Somente pedidos pendentes ou cancelados podem ser excluídos.',
  });
}

await sequelize.transaction(async (transacao) => {
  const pedidoAtual = await PedidoModel.findByPk(id, {
    transaction: transacao,
    lock: transacao.LOCK.UPDATE,
  });

  if (!pedidoAtual) {
    throw new Error('PEDIDO_NAO_ENCONTRADO');
  }

  const statusConfirmado = String(
    pedidoAtual.get('status')
  ).toLowerCase();

  if (!['pendente', 'cancelado'].includes(statusConfirmado)) {
    throw new Error('STATUS_NAO_PERMITIDO');
  }

  const itens = await ItemPedidoModel.findAll({
    where: { pedido_id: id },
    transaction: transacao,
  });

  if (statusConfirmado === 'pendente') {
    for (const item of itens) {
      const produto = await ProdutoModel.findByPk(
        item.produto_id,
        {
          transaction: transacao,
          lock: transacao.LOCK.UPDATE,
        }
      );

      if (!produto) {
        throw new Error('PRODUTO_NAO_ENCONTRADO');
      }

      const estoqueAtual = Number(produto.get('estoque'));

      await produto.update(
        { estoque: estoqueAtual + item.quantidade },
        { transaction: transacao }
      );
    }
  }

  await pedidoAtual.destroy({ transaction: transacao });
});


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

// CRUD de endereços. Cada endereço pertence ao usuário logado.
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

    // Só encontra o endereço se o id for deste usuário. Caso contrário, não edita.
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
