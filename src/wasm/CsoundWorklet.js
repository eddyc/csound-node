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
            SET_OUTPUT_CHANNEL_CALLBACK,
            SEND_OUTPUT_CHANNEL_VALUE,
            SET_INPUT_CHANNEL_CALLBACK,
            SET_INPUT_CHANNEL_VALUE,
            SET_CONTROL_CHANNEL,
            SEND_MIDI_MESSAGE
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
            case SET_CONTROL_CHANNEL: {
                const { name, value } = payload;
                this.csound.setControlChannel(name, value);
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
