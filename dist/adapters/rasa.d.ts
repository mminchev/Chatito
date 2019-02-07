import { ISentenceTokens } from '../types';
export interface IRasaEntity {
    start: number;
    end: number;
    value: string;
    entity: string;
}
export interface IRasaExample {
    text: string;
    intent: string;
    entities: IRasaEntity[];
}
export interface IRasaDataset {
    rasa_nlu_data: {
        regex_features: any[];
        entity_synonyms: Array<{
            value: string;
            synonyms: string[];
        }>;
        common_examples: IRasaExample[];
    };
}
export interface IRasaTestingDataset {
    [intent: string]: ISentenceTokens[][];
}
export declare function adapter(dsl: string, formatOptions?: any): Promise<{
    training: IRasaDataset;
    testing: {
        rasa_nlu_data: {
            common_examples: IRasaExample[];
        };
    };
}>;
