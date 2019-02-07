import { IChatitoEntityAST, IUtteranceWriter } from './types';
export declare const astFromString: (str: string) => IChatitoEntityAST[];
export declare const datasetFromString: (str: string, writterFn: IUtteranceWriter) => Promise<void>;
export declare const datasetFromAST: (ast: IChatitoEntityAST[], writterFn: IUtteranceWriter) => Promise<void>;
