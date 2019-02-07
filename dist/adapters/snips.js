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
        const training = { language: 'en', entities: {}, intents: {} };
        const testing = {};
        if (formatOptions) {
            utils.mergeDeep(training, formatOptions);
        }
        const synonymsForSlots = {};
        const entities = new Set();
        const utteranceWriter = (utterance, intentKey, isTrainingExample) => {
            if (isTrainingExample) {
                if (!training.intents[intentKey]) {
                    training.intents[intentKey] = { utterances: [] };
                }
                const data = utterance.map(u => {
                    const ret = { text: u.value };
                    if (u.type === 'Slot' && u.slot) {
                        ret.slot_name = u.slot;
                        if (u.args) {
                            Object.keys(u.args).forEach(key => {
                                if (u.args && key === 'entity') {
                                    entities.add(u.args[key]);
                                    ret.entity = u.args[key];
                                }
                            });
                        }
                        if (!ret.entity) {
                            ret.entity = u.slot;
                            entities.add(u.slot);
                        }
                        if (u.synonym && ret.entity) {
                            if (!synonymsForSlots[ret.entity]) {
                                synonymsForSlots[ret.entity] = {};
                            }
                            const synonyms = synonymsForSlots[ret.entity];
                            if (!synonyms[u.synonym]) {
                                synonyms[u.synonym] = new Set();
                            }
                            if (u.synonym !== u.value) {
                                synonyms[u.synonym].add(u.value);
                            }
                        }
                    }
                    return ret;
                });
                training.intents[intentKey].utterances.push({ data });
            }
            else {
                if (!testing[intentKey]) {
                    testing[intentKey] = [];
                }
                testing[intentKey].push(utterance);
            }
        };
        yield gen.datasetFromString(dsl, utteranceWriter);
        entities.forEach(slotKey => {
            if (!synonymsForSlots[slotKey]) {
                if (!training.entities[slotKey]) {
                    training.entities[slotKey] = {};
                }
                return;
            }
            Object.keys(synonymsForSlots[slotKey]).forEach(synonymsValue => {
                if (!training.entities[slotKey]) {
                    training.entities[slotKey] = {};
                }
                training.entities[slotKey].use_synonyms = true;
                training.entities[slotKey].automatically_extensible = true;
                if (!training.entities[slotKey].data) {
                    training.entities[slotKey].data = [];
                }
                training.entities[slotKey].data.push({
                    synonyms: [...synonymsForSlots[slotKey][synonymsValue]],
                    value: synonymsValue
                });
            });
        });
        return { training, testing };
    });
}
exports.adapter = adapter;
