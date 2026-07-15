import { STRINGS, type Language, type StringKey } from "./strings";

export function getTranslator(language: Language) {
  return (key: StringKey) => STRINGS[language][key];
}
