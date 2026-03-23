import { emailService } from "../services/email.service.js";
import { slackService } from "../services/slack.service.js";

export function notificationJob(changeOrderId: string, status: string) {
  return {
    slack: slackService.formatChangeOrderMessage(changeOrderId, status),
    email: emailService.buildStatusEmail(changeOrderId, status)
  };
}

