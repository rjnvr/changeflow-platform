export const aiSummaryService = {
  generateSummary(description: string, amount: number) {
    return `This change order covers ${description.toLowerCase()} and is expected to add approximately $${amount.toLocaleString()} to project cost.`;
  }
};

