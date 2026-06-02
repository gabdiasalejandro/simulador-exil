/// <reference types="vite/client" />

// Declaración para importar archivos YAML como strings crudos con ?raw
declare module '*.yaml?raw' {
  const content: string;
  export default content;
}
