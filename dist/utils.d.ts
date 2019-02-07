import { IChatitoEntityAST, IEntities, ISentenceTokens } from './types';
export declare const shuffle: <T>(array: T[]) => void;
export declare const validateAndPushToStack: (entity: IChatitoEntityAST, entitiesStack: IChatitoEntityAST[]) => IChatitoEntityAST[];
export declare const maxSentencesForSentence: (entities: IEntities, stack?: IChatitoEntityAST[] | undefined) => (sentence: ISentenceTokens[]) => number;
export declare const maxSentencesForEntity: (ed: IChatitoEntityAST, entities: IEntities, stack?: IChatitoEntityAST[]) => number;
export declare const mergeDeep: <T>(target: any, source: any) => T;
