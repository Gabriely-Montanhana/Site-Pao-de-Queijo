const EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;// Expressão regular para validar emails, verifica se o email tem o formato correto (ex: email@dominio.com)

export function emailValido(valor: string) {
    return EMAIL.test(valor.trim()); // Verifica se o valor do email é válido, usando a expressão regular definida acima
}

export function mascaraCpf(valor: string) {
    const digitos = valor.replace(/\D/g, "").slice(0, 11);

    return digitos
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function cpfValido(valor: string) {
    const cpf = valor.replace(/\D/g, ''); // Remove tudo que não é dígito, '\D' é o mesmo que [^0-9], '/g' troca as ocorrencias

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false; // Verifica se tem 11 dígitos e se não é uma sequência de números iguais

    const digito = (base: string, fator: number) => { 
        let soma = 0;

        for (const numero of base) { 
            soma += Number(numero) * fator; // Converte o número para Number e multiplica pelo fator
            fator--;
        }

        const resto = (soma * 10) % 11; // O resto da divisão da soma multiplicada por 10 por 11
        return resto === 10 ? 0 : resto; // Se o resto for 10, retorna 0, caso contrário retorna o resto
    };

    return digito(cpf.slice(0, 9), 10) === Number(cpf[9]) && digito(cpf.slice(0, 10), 11) === Number(cpf[10]);// Verifica se os dígitos verificadores são válidos
}

//Validar Login
export type LoginForm = {
    email: string;
    senha: string;
}

export type ErrosLogin = {
    email?: string;
    senha?: string;
}

export function validarLogin(form: LoginForm): ErrosLogin {
    const erros: ErrosLogin = {};

    if (!form.email.trim()) erros.email = "E-mail é obrigatório.";
    else if (!emailValido(form.email)) erros.email = "E-mail inválido.";

    if (!form.senha) erros.senha = "Senha é obrigatória.";

    return erros;
}


//Validar Cadastro
export type CadastroForm = {
    nome: string;
    email: string;
    senha: string;
    confirmacao: string;
    cpf: string;
}

export type ErrosCadastro = {
    nome?: string;
    email?: string;
    senha?: string;
    confirmacao?: string;
    cpf?: string;
}

export function validarCadastro(form: CadastroForm): ErrosCadastro {
    const erros: ErrosCadastro = {};

    if (!form.nome.trim()) erros.nome = "Nome é obrigatório.";

    if (!form.email.trim()) erros.email = "E-mail é obrigatório.";
    else if (!emailValido(form.email)) erros.email = "E-mail inválido.";

    if (!form.senha) erros.senha = "Senha é obrigatória.";
    else if (form.senha.length < 8 || !/[A-Z]/.test(form.senha) || !/[a-z]/.test(form.senha) || !/\d/.test(form.senha) || !/[^A-Za-z0-9]/.test(form.senha)) {
        erros.senha = "Use 8 caracteres, maiúscula, minúscula, número e símbolo.";
    }

    if (!form.confirmacao) erros.confirmacao = "Confirme a senha.";
    else if (form.senha !== form.confirmacao) erros.confirmacao = "A confirmação da senha não confere.";

    if (!form.cpf.trim()) erros.cpf = "CPF é obrigatório.";
    else if (!cpfValido(form.cpf)) erros.cpf = "CPF inválido.";

    return erros;
}

export function validarEdicaoUsuario(form: CadastroForm, emailOriginal: string, cpfOriginal: string): ErrosCadastro {
    const erros: ErrosCadastro = {};

    if (!form.nome.trim()) erros.nome = "Nome é obrigatório.";

    if (form.email.trim().toLowerCase() !== emailOriginal.trim().toLowerCase()) {
        erros.email = "O e-mail não pode ser alterado.";
    }

    if (form.cpf.replace(/\D/g, "") !== cpfOriginal.replace(/\D/g, "")) {
        erros.cpf = "O CPF não pode ser alterado.";
    }

    if (!form.senha) erros.senha = "Confirme sua senha para salvar.";

    return erros;
}

export type ProdutoForm = {
    nome: string;
    descricao: string;
    preco: string;
    estoque: string;
    categoriaId: string;
}

export type ErrosProduto = {
    nome?: string;
    descricao?: string;
    preco?: string;
    estoque?: string;
    categoriaId?: string;
}

export function validarProduto(form: ProdutoForm): ErrosProduto {
    const erros: ErrosProduto = {};

    if (!form.nome.trim()) erros.nome = "O nome é obrigatório.";
    if (!form.descricao.trim()) erros.descricao = "A descrição é obrigatória.";

    if (!form.preco.trim()) erros.preco = "O preço é obrigatório.";
    else {
        const preco = Number(form.preco.replace(",", "."));
        if (!Number.isFinite(preco) || preco < 0) erros.preco = "Informe um preço válido.";
    }

    if (!form.estoque.trim()) erros.estoque = "O estoque é obrigatório.";
    else if (!/^\d+$/.test(form.estoque.trim())) erros.estoque = "O estoque precisa ser um número inteiro.";

    if (!form.categoriaId) erros.categoriaId = "A categoria é obrigatória.";

    return erros;
}

export function validarCategoria(nome: string) {
    if (!nome.trim()) return "O nome é obrigatório.";
    return "";
}

export type EnderecoForm = {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}

export type ErrosEndereco = {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
}

export function mascaraCep(valor: string) {
    const digitos = valor.replace(/\D/g, "").slice(0, 8);
    return digitos.replace(/(\d{5})(\d)/, "$1-$2");
}

export function validarEndereco(form: EnderecoForm): ErrosEndereco {
    const erros: ErrosEndereco = {};

    if (!form.rua.trim()) erros.rua = "A rua é obrigatória.";
    if (!form.numero.trim()) erros.numero = "O número é obrigatório.";
    if (!form.bairro.trim()) erros.bairro = "O bairro é obrigatório.";
    if (!form.cidade.trim()) erros.cidade = "A cidade é obrigatória.";

    if (!form.estado.trim()) erros.estado = "O estado é obrigatório.";
    else if (!/^[A-Za-z]{2}$/.test(form.estado.trim())) erros.estado = "Use a sigla com 2 letras.";

    if (!form.cep.trim()) erros.cep = "O CEP é obrigatório.";
    else if (!/^\d{8}$/.test(form.cep.replace(/\D/g, ""))) erros.cep = "O CEP deve conter 8 números.";

    return erros;
}

export type VendaForm = {
    status: string;
    valorTotal: string;
}

export type ErrosVenda = {
    status?: string;
    valorTotal?: string;
}

export function validarVenda(form: VendaForm): ErrosVenda {
    const erros: ErrosVenda = {};

    if (!form.status.trim()) erros.status = "O status é obrigatório.";

    if (!form.valorTotal.trim()) erros.valorTotal = "O valor é obrigatório.";
    else {
        const valor = Number(form.valorTotal.replace(",", "."));
        if (!Number.isFinite(valor) || valor < 0) erros.valorTotal = "Informe um valor válido.";
    }

    return erros;
}