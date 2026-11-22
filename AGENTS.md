
# AGENTS.md — Banepane Foods

## Objetivo do projeto
O Banepane Foods é um sistema de comércio eletrônico de pão de queijo congelado.

## Tecnologias
- Back-end: Node.js, TypeScript, Express e Sequelize.
- Banco de dados: MySQL executado no Docker.
- Front-end: React, TypeScript e Vite.
- Autenticação: JWT e bcryptjs.

## Regras gerais
1. Respeitar a estrutura de pastas existente.
2. Utilizar TypeScript com tipagem adequada.
3. Validar os dados recebidos pela API.
4. Manter as regras de negócio no back-end.
5. Proteger as rotas que exigem autenticação.
6. Não alterar arquivos sem necessidade.
7. Executar os testes e verificar a compilação antes de finalizar alterações.

## Segurança obrigatória
- Nunca abrir, ler, copiar ou divulgar arquivos `.env`.
- Nunca exibir senhas, tokens JWT ou credenciais do banco de dados.
- Nunca incluir segredos em commits, logs ou respostas.
- Utilizar variáveis de ambiente para configurações sensíveis.
- Nunca modificar dados de produção sem autorização.
- Não remover validações ou mecanismos de autenticação.

## Skills dos agentes
Os agentes devem consultar as seguintes skills:

1. `.agents/skills/backend-api/SKILL.md`
   - Desenvolvimento e manutenção das rotas da API.

2. `.agents/skills/banco-dados/SKILL.md`
   - Modelagem e operações seguras no MySQL.

3. `.agents/skills/testes-seguranca/SKILL.md`
   - Testes, validações e proteção de dados.

## Critérios de conclusão
- Código TypeScript compilando sem erros.
- Rotas e regras de negócio verificadas.
- Dados sensíveis protegidos.
- Alterações revisadas antes do commit.
