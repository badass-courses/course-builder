export function toChicagoTitleCase(str: string): string {
  const lowerCaseWords = new Set([
    'a',
    'an',
    'the',
    'at',
    'by',
    'for',
    'in',
    'of',
    'on',
    'to',
    'up',
    'and',
    'as',
    'but',
    'or',
    'nor',
  ])
  const specialCases = {
    I: true,
    II: true,
    III: true,
    IV: true,
    V: true,
    VI: true,
  }

  return str
    .replace(/\w\S*/g, (word, index) => {
      if (
        index > 0 &&
        index < str.length - 1 &&
        lowerCaseWords.has(word.toLowerCase())
      ) {
        return word.toLowerCase()
      }
      if (specialCases.hasOwnProperty(word.toUpperCase())) {
        return word.toUpperCase()
      }
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
    })
    .replace(
      /(\b(?:Mc|Mac)\w)/g,
      (s) => s.charAt(0).toUpperCase() + s.substr(1),
    )
}
