import type { Request, Response } from "express";

import { authService } from "../services/auth.service.js";

export const authController = {
  login(request: Request, response: Response) {
    const { email, password } = request.body;
    const result = authService.login(email, password);

    response.json({
      success: true,
      data: result
    });
  },
  me(request: Request, response: Response) {
    const user = authService.getCurrentUser(request.user!.id);

    response.json({
      success: true,
      data: user
    });
  }
};

