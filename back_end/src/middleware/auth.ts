import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado no .env');
}

export interface DadosToken {
  id: number;
  email: string;
}

export function gerarToken(dados: DadosToken): string {
  return jwt.sign(dados, JWT_SECRET as string, {
    expiresIn: '2h',
  });
}

export function autenticarToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const cabecalho = req.headers.authorization;

  if (!cabecalho) {
    res.status(401).json({
      mensagem: 'Token não informado.',
    });
    return;
  }

  const [tipo, token] = cabecalho.split(' ');

  if (tipo !== 'Bearer' || !token) {
    res.status(401).json({
      mensagem: 'Token inválido.',
    });
    return;
  }

  try {
    const dados = jwt.verify(token, JWT_SECRET as string) as unknown as DadosToken;

    (req as Request & { usuarioId: number }).usuarioId = dados.id;

    next();
  } catch {
    res.status(401).json({
      mensagem: 'Token inválido ou expirado.',
    });
  }
}