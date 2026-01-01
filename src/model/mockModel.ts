export async function* mockGenerateStream(prompt: string) {
  const responses = [
    "I'm a mock AI assistant. ",
    "This is a simulated response ",
    "to avoid hitting API quotas. ",
    `You asked: "${prompt.substring(0, 50)}..." `,
    "\n\nI can help you with various tasks!",
  ];

  for (const chunk of responses) {
    yield { text: chunk, content: [] };
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
