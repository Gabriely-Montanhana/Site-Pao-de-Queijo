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

    if (!form.confirmacao) erros.confirmacao = "Confirme a senha.";
    else if (form.senha !== form.confirmacao) erros.confirmacao = "A confirmação da senha não confere.";

    if (!form.cpf.trim()) erros.cpf = "CPF é obrigatório.";
    else if (!cpfValido(form.cpf)) erros.cpf = "CPF inválido.";

    return erros;
}