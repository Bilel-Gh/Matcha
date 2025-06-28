import { Request, Response, NextFunction } from 'express';

type ValidationFunction = (data: any) => void;

export const validateBody = (validationFunction: ValidationFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      validationFunction(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (validationFunction: ValidationFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      validationFunction(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (validationFunction: ValidationFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      validationFunction(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};
