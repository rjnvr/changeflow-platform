export const slackService = {
  formatChangeOrderMessage(changeOrderId: string, status: string) {
    return {
      text: `Change order ${changeOrderId} is now ${status}.`
    };
  }
};

