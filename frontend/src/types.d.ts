declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.jsx' {
  const mod: any;
  export default mod;
}