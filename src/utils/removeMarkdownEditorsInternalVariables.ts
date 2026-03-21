export function removeMarkdownEditorsInternalVariables(input: string) {
  if (!input) {
    return '';
  }

  return input.replace(/\$\$widget0\s*(\{\{[^}]+\}\})\$\$/g, '$1');
}
