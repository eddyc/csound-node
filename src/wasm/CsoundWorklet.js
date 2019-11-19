/*global libcsound, CsoundObj*/

class CsoundWorklet extends AudioWorkletProcessor {
    constructor(options) {
        super(options);

        this.port.onmessage = this.onMessage.bind(this);

        const { types, sampleRate } = options.processorOptions;

        libcsound({
            print: this.printMessages,
            printErr: this.printMessages
        }).then(CSMOD => {
            this.csound = new CsoundObj(
                CSMOD,
                options.outputChannelCount[0],
                options.numberOfInputs,
                sampleRate
            );
            this.types = types;
            this.port.start();
            this.port.postMessage({ type: this.types.CSOUND_INITIALIZED });
        });

        this.playStateListeners = [];
    }

    printMessages(e) {
        console.log(e);
    }

    onMessage(message) {
        const { data } = message;
        const { type, payload } = data;
        const {
            COMPILE_CSD,
            START_PERFORMANCE,
            STOP_PERFORMANCE,
            RESET_CSOUND,
            SET_OUTPUT_CHANNEL_CALLBACK,
            SEND_OUTPUT_CHANNEL_VALUE,
            SET_INPUT_CHANNEL_CALLBACK,
            SET_INPUT_CHANNEL_VALUE,
            SET_CONTROL_CHANNEL,
            SEND_MIDI_MESSAGE,
            GET_CONTROL_CHANNEL,
            SET_STRING_CHANNEL,
            GET_STRING_CHANNEL,
            EVALUATE_CODE,
            READ_SCORE,
            GET_INPUT_CHANNEL_COUNT,
            GET_OUTPUT_CHANNEL_COUNT,
            GET_TABLE_LENGTH,
            GET_TABLE,
            SET_TABLE_AT_INDEX,
            SET_TABLE,
            GET_ZERODBFS,
            COMPILE_ORC,
            GET_SCORE_TIME,
            ADD_PLAY_STATE_LISTENER,
            FIRE_PLAY_STATE_CHANGE
        } = this.types;

        switch (type) {
            case COMPILE_CSD: {
                this.csound.compileCsd(payload);
                break;
            }
            case START_PERFORMANCE: {
                this.csound.start();
                break;
            }
            case STOP_PERFORMANCE: {
                this.csound.stop();
                break;
            }
            case RESET_CSOUND: {
                this.csound.reset();
                break;
            }
            case SET_CONTROL_CHANNEL: {
                const { name, value } = payload;
                this.csound.setControlChannel(name, value);
                break;
            }
            case SET_STRING_CHANNEL: {
                const { name, value } = payload;
                this.csound.setStringChannel(name, value);
                break;
            }
            case GET_CONTROL_CHANNEL: {
                const name = payload;
                const value = this.csound.getControlChannel(name);
                this.port.postMessage({
                    type: GET_CONTROL_CHANNEL,
                    payload: { name, value }
                });
                break;
            }
            case GET_STRING_CHANNEL: {
                const name = payload;
                const value = this.csound.getStringChannel(name);
                this.port.postMessage({
                    type: GET_STRING_CHANNEL,
                    payload: { name, value }
                });
                break;
            }
            case SET_INPUT_CHANNEL_VALUE: {
                const { name, value } = payload;
                this.csound.setInputChannelValue(name, value);
                break;
            }
            case SET_OUTPUT_CHANNEL_CALLBACK: {
                this.csound.setOutputChannelCallback((name, value) => {
                    this.port.postMessage({
                        type: SEND_OUTPUT_CHANNEL_VALUE,
                        payload: { name, value }
                    });
                });
                break;
            }
            case SEND_MIDI_MESSAGE: {
                const [status, data1, data2] = payload;
                this.csound.pushMidiMessage(status, data1, data2);
                break;
            }

            case SET_INPUT_CHANNEL_CALLBACK: {
                this.csound.setInputChannelCallback();
                break;
            }
            case EVALUATE_CODE: {
                const code = payload;
                this.csound.evaluateCode(code);
                break;
            }
            case COMPILE_ORC: {
                const orc = payload;
                this.csound.compileOrc(orc);
                break;
            }
            case READ_SCORE: {
                const score = payload;
                this.csound.readScore(score);
                break;
            }
            case GET_INPUT_CHANNEL_COUNT: {
                const count = this.csound.getInputChannelCount();
                this.port.postMessage({
                    type: GET_INPUT_CHANNEL_COUNT,
                    payload: count
                });
                break;
            }
            case GET_OUTPUT_CHANNEL_COUNT: {
                const count = this.csound.getOutputChannelCount();
                this.port.postMessage({
                    type: GET_OUTPUT_CHANNEL_COUNT,
                    payload: count
                });
                break;
            }
            case GET_TABLE_LENGTH: {
                const table = payload;
                const length = this.csound.getTableLength(table);
                this.port.postMessage({
                    type: GET_TABLE_LENGTH,
                    payload: { table, length }
                });
                break;
            }
            case GET_TABLE: {
                const table = payload;
                const tableData = this.csound.getTable(table);
                this.port.postMessage({
                    type: GET_TABLE,
                    payload: { table, tableData }
                });
                break;
            }
            case SET_TABLE_AT_INDEX: {
                const { table, index, value } = payload;
                this.csound.setTable(table, index, value);
                break;
            }
            case SET_TABLE: {
                const { table, tableData } = payload;
                for (let i = 0; i < tableData.length; ++i) {
                    this.csound.setTable(table, i, tableData[i]);
                }
                break;
            }
            case GET_ZERODBFS: {
                const zeroDBFS = this.csound.getZerodBFS();
                this.port.postMessage({
                    type: GET_ZERODBFS,
                    payload: zeroDBFS
                });
                break;
            }
            case GET_SCORE_TIME: {
                const scoreTime = this.csound.getScoreTime();
                this.port.postMessage({
                    type: GET_SCORE_TIME,
                    payload: scoreTime
                });
                break;
            }
            case ADD_PLAY_STATE_LISTENER: {
                this.csound.addPlayStateListener((playState, index) => {
                    this.port.postMessage({
                        type: FIRE_PLAY_STATE_CHANGE,
                        payload: { playState, index }
                    });
                });

                break;
            }
            default: {
                break;
            }
        }
    }

    process(inputs, outputs, parameters) {
        this.csound.process(inputs, outputs);
        return true;
    }
}

registerProcessor("csound", CsoundWorklet);
