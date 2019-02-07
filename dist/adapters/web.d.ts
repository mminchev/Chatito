import { ISentenceTokens } from '../types';
export interface IDefaultDataset {
    [intent: string]: ISentenceTokens[][];
}
export declare function adapter(dsl: string, formatOptions?: any): Promise<{
    training: IDefaultDataset;
    testing: IDefaultDataset;
}>;
