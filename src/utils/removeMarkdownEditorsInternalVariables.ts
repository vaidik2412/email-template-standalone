export function removeMarkdownEditorsInternalVariables(input: string) {
  if (!input) {
    return '';
  }

  return input
    .replace(/\r\n?/g, '\n')
    .replace(/\$\$widget0\s*(\{\{[^}]+\}\})\$\$/g, '$1')
    .replace(/\n?<br\s*\/?>\n?/gi, '\n\n')
    .replace(/\n{3,}/g, '\n\n');
}
