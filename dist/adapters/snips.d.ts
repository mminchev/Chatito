import { ISentenceTokens } from '../types';
export interface ISnipsUtteranceData {
    text: string;
    entity?: string;
    slot_name?: string;
}
export interface ISnipsUtterance {
    data: ISnipsUtteranceData[];
}
export interface ISnipsIntent {
    utterances: ISnipsUtterance[];
}
export interface ISnipsDataset {
    intents: {
        [intentKey: string]: ISnipsIntent;
    };
    entities: {
        [entityKey: string]: {
            data?: Array<{
                value: string;
                synonyms: string[];
            }>;
            use_synonyms?: boolean;
            automatically_extensible?: boolean;
        };
    };
    language: string;
}
export interface ISnipsTestingDataset {
    [intent: string]: ISentenceTokens[][];
}
export declare function adapter(dsl: string, formatOptions?: any): Promise<{
    training: ISnipsDataset;
    testing: ISnipsTestingDataset;
}>;
