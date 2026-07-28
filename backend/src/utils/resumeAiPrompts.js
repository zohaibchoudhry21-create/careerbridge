export const extractJsonFromText = (text) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim());
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in AI response.');
  }

  return JSON.parse(trimmed.slice(start, end + 1));
};
