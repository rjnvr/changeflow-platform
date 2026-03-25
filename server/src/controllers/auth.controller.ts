import type { Request, Response } from "express";

import { authService } from "../services/auth.service.js";

export const authController = {
  async login(request: Request, response: Response) {
    const { email, password } = request.body;
    const result = await authService.login(email, password);

    response.json({
      success: true,
      data: result
    });
  },
  async register(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await authService.register(request.body)
    });
  },
  async requestPasswordReset(request: Request, response: Response) {
    response.json({
      success: true,
      data: await authService.requestPasswordReset(request.body.email)
    });
  },
  async resetPassword(request: Request, response: Response) {
    response.json({
      success: true,
      data: await authService.resetPassword(request.body.token, request.body.password)
    });
  },
  async me(request: Request, response: Response) {
    const user = await authService.getCurrentUser(request.user!.id);

    response.json({
      success: true,
      data: user
    });
  },
  async updateProfile(request: Request, response: Response) {
    response.json({
      success: true,
      data: await authService.updateProfile(request.user!.id, request.body)
    });
  },
  async changePassword(request: Request, response: Response) {
    response.json({
      success: true,
      data: await authService.changePassword(request.user!.id, request.body)
    });
  }
};
