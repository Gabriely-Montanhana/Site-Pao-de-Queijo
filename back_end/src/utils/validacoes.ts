export function validarEmail(email: string): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.trim());
}

export function validarCpf(valor: string): boolean {
  const cpf = valor.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcularDigito = (base: string, pesoInicial: number): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcularDigito(cpf.slice(0, 9), 10) === Number(cpf[9]) &&
    calcularDigito(cpf.slice(0, 10), 11) === Number(cpf[10]);
}

export function validarForcaSenha(senha: string): string | null {
  if (senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  if (!/[A-Z]/.test(senha)) return 'A senha deve conter pelo menos uma letra maiúscula.';
  if (!/[a-z]/.test(senha)) return 'A senha deve conter pelo menos uma letra minúscula.';
  if (!/\d/.test(senha)) return 'A senha deve conter pelo menos um número.';
  if (!/[^A-Za-z0-9]/.test(senha)) return 'A senha deve conter pelo menos um caractere especial.';
  return null;
}
