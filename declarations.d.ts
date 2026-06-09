// Deklarasi tipe untuk CSS module imports
// Menghilangkan warning TypeScript "Cannot find module or type declarations
// for side-effect import of './globals.css'"
declare module "*.css" {
  const content: string;
  export default content;
}