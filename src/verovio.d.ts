declare module 'verovio' {
  export const module: {
    onRuntimeInitialized: () => void;
  };

  export class toolkit {
    loadData(data: string): boolean;
    renderToSVG(page?: number, options?: object): string;
    getLog(): string;
    setOptions(options: object): void;
  }
}
