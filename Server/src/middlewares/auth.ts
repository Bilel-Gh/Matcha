import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;

  if (!bearer || !bearer.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = bearer.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = user as { id: number };
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
