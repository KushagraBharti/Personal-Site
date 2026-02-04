/* eslint-disable @typescript-eslint/no-namespace */

export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}
