/*global libcsound, CsoundObj*/

class CsoundWorklet extends AudioWorkletProcessor {
    constructor(options) {
        super();

        this.port.onmessage = this.onMessage.bind(this);

        this.CSMOD = {
            print: this.printMessages,
            printErr: this.printMessages,
            ENVIRONMENT: "WEB"
        };

        libcsound(this.CSMOD);
        const { types, sampleRate } = options.processorOptions;

        this.csound = new CsoundObj(
            this.CSMOD,
            options.numberOfOutputs || 1,
            options.numberOfInputs || 1,
            sampleRate
        );
        this.types = types;
        this.port.start();
        this.port.postMessage({ type: this.types.CSOUND_INITIALIZED });
    }

    printMessages(e) {
        console.log(e);
    }

    onMessage(message) {
        const { data } = message;
        const { type, payload } = data;
        const { COMPILE_CSD, START_PERFORMANCE } = this.types;

        switch (type) {
            case COMPILE_CSD: {
                this.csound.compileCsd(payload);
                break;
            }
            case START_PERFORMANCE: {
                this.csound.start();
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
