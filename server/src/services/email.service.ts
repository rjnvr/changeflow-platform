export const emailService = {
  buildStatusEmail(changeOrderId: string, status: string) {
    return {
      subject: `Change order ${changeOrderId} updated`,
      body: `The change order status is now ${status}.`
    };
  }
};

