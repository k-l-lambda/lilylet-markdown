declare module 'verovio/wasm' {
  export default function createModule(): Promise<unknown>;
}
declare module 'verovio/esm' {
  export class VerovioToolkit {
    constructor(module: unknown);
    loadData(data: string): boolean;
    renderToSVG(page?: number, options?: object): string;
    getLog(): string;
    setOptions(options: object): void;
    destroy(): void;
  }
}
