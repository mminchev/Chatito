"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const gen = require("../main");
const utils = require("../utils");
function adapter(dsl, formatOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const training = {
            rasa_nlu_data: {
                regex_features: [],
                entity_synonyms: [],
                common_examples: []
            }
        };
        const testing = { rasa_nlu_data: { common_examples: [] } };
        const synonyms = {};
        if (formatOptions) {
            utils.mergeDeep(training, formatOptions);
        }
        const utteranceWriter = (utterance, intentKey, isTrainingExample) => {
            const example = utterance.reduce((acc, next) => {
                if (next.type === 'Slot' && next.slot) {
                    if (next.synonym) {
                        if (!synonyms[next.synonym]) {
                            synonyms[next.synonym] = new Set();
                        }
                        if (next.synonym !== next.value) {
                            synonyms[next.synonym].add(next.value);
                        }
                    }
                    acc.entities.push({
                        end: acc.text.length + next.value.length,
                        entity: next.slot,
                        start: acc.text.length,
                        value: next.value
                    });
                }
                acc.text += next.value;
                return acc;
            }, { text: '', intent: intentKey, entities: [] });
            if (isTrainingExample) {
                training.rasa_nlu_data.common_examples.push(example);
            }
            else {
                testing.rasa_nlu_data.common_examples.push(example);
            }
        };
        yield gen.datasetFromString(dsl, utteranceWriter);
        Object.keys(synonyms).forEach(k => {
            training.rasa_nlu_data.entity_synonyms.push({
                synonyms: [...synonyms[k]],
                value: k
            });
        });
        return { training, testing };
    });
}
exports.adapter = adapter;
