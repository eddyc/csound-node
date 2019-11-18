// eslint-disable-next-line no-unused-vars
class CsoundObj {
    constructor(CSMOD, numberOfOutputs, numberOfInputs, sampleRate) {
        const _new = CSMOD.cwrap("CsoundObj_new", ["number"], null);
        const csObj = _new();
        const compileCsd = CSMOD.cwrap(
            "CsoundObj_compileCSD",
            ["number"],
            ["number", "string"]
        );

        this.compileCsd = csd => {
            compileCsd(csObj, csd);
        };
        const evaluateCode = CSMOD.cwrap(
            "CsoundObj_evaluateCode",
            ["number"],
            ["number", "string"]
        );

        this.evaluateCode = code => {
            evaluateCode(csObj, code);
        };

        const readScore = CSMOD.cwrap(
            "CsoundObj_readScore",
            ["number"],
            ["number", "string"]
        );

        this.readScore = score => {
            readScore(csObj, score);
        };

        const reset = CSMOD.cwrap("CsoundObj_reset", null, ["number"]);

        this.reset = () => {
            reset(csObj);
        };

        const getOutputBuffer = CSMOD.cwrap(
            "CsoundObj_getOutputBuffer",
            ["number"],
            ["number"]
        );

        this.getOutputBuffer = () => {
            return getOutputBuffer(csObj);
        };
        const getInputBuffer = CSMOD.cwrap(
            "CsoundObj_getInputBuffer",
            ["number"],
            ["number"]
        );

        this.getInputBuffer = () => {
            return getInputBuffer(csObj);
        };
        const getControlChannel = CSMOD.cwrap(
            "CsoundObj_getControlChannel",
            ["number"],
            ["number", "string"]
        );

        this.getControlChannel = channel => {
            console.log(channel);

            return getControlChannel(csObj, channel);
        };

        const setControlChannel = CSMOD.cwrap(
            "CsoundObj_setControlChannel",
            null,
            ["number", "string", "number"]
        );

        this.setControlChannel = (channel, value) => {
            setControlChannel(csObj, channel, value);
        };

        const setOutputChannelCallback = CSMOD.cwrap(
            "CsoundObj_setOutputChannelCallback",
            null,
            ["number", "number"]
        );
        this.setOutputChannelCallback = callback => {
            function csoundCallback(csoundPtr, stringPtr, valuePtr, typePtr) {
                const name = CSMOD.UTF8ToString(stringPtr);
                const value = CSMOD.getValue(valuePtr, "float");
                callback(name, value);
            }
            const functionPointer = CSMOD.addFunction(csoundCallback, "viiii");
            setOutputChannelCallback(csObj, functionPointer);
        };

        const setInputChannelCallback = CSMOD.cwrap(
            "CsoundObj_setInputChannelCallback",
            null,
            ["number", "number"]
        );

        const inputValues = {};
        this.setInputChannelCallback = () => {
            function csoundCallback(csoundPtr, stringPtr, valuePtr, typePtr) {
                const name = CSMOD.UTF8ToString(stringPtr);
                const value = inputValues[name] || 0;
                CSMOD.setValue(valuePtr, value, "float");
            }
            const functionPointer = CSMOD.addFunction(csoundCallback, "viiii");
            setInputChannelCallback(csObj, functionPointer);
        };

        this.setInputChannelValue = (name, value) => {
            inputValues[name] = value;
        };

        const getStringChannel = CSMOD.cwrap(
            "CsoundObj_getStringChannel",
            ["string"],
            ["number", "string"]
        );

        this.getStringChannel = channel => {
            const pointer = getStringChannel(csObj, channel);
            return CSMOD.UTF8ToString(pointer);
        };

        const setStringChannel = CSMOD.cwrap(
            "CsoundObj_setStringChannel",
            null,
            ["number", "string", "string"]
        );

        this.setStringChannel = (channel, string) => {
            setStringChannel(csObj, channel, string);
        };

        const getKsmps = CSMOD.cwrap(
            "CsoundObj_getKsmps",
            ["number"],
            ["number"]
        );

        this.getKsmps = () => {
            return getKsmps(csObj);
        };

        const performKsmps = CSMOD.cwrap(
            "CsoundObj_performKsmps",
            ["number"],
            ["number"]
        );

        this.performKsmps = () => {
            return performKsmps(csObj);
        };

        const render = CSMOD.cwrap("CsoundObj_render", null, ["number"]);

        this.render = () => {
            render(csObj);
        };

        const getInputChannelCount = CSMOD.cwrap(
            "CsoundObj_getInputChannelCount",
            ["number"],
            ["number"]
        );

        this.getInputChannelCount = () => {
            return getInputChannelCount(csObj);
        };
        const getOutputChannelCount = CSMOD.cwrap(
            "CsoundObj_getOutputChannelCount",
            ["number"],
            ["number"]
        );

        this.getOutputChannelCount = () => {
            return getOutputChannelCount(csObj);
        };

        const getTableLength = CSMOD.cwrap(
            "CsoundObj_getTableLength",
            ["number"],
            ["number", "number"]
        );

        this.getTableLength = table => {
            return getTableLength(csObj, table);
        };

        const getTable = CSMOD.cwrap(
            "CsoundObj_getTable",
            ["number"],
            ["number", "number"]
        );

        this.getTable = table => {
            const buffer = getTable(csObj, table);
            const length = this.getTableLength(table);
            const src = new Float32Array(CSMOD.HEAP8.buffer, buffer, length);
            return new Float32Array(src);
        };

        const getZerodBFS = CSMOD.cwrap(
            "CsoundObj_getZerodBFS",
            ["number"],
            ["number"]
        );

        this.getZerodBFS = () => {
            return getZerodBFS(csObj);
        };

        const compileOrc = CSMOD.cwrap("CsoundObj_compileOrc", "number", [
            "number",
            "string"
        ]);

        this.compileOrc = orc => {
            return compileOrc(csObj, orc);
        };
        const setOption = CSMOD.cwrap("CsoundObj_setOption", null, [
            "number",
            "string"
        ]);

        this.setOption = option => {
            setOption(csObj, option);
        };

        const prepareRT = CSMOD.cwrap("CsoundObj_prepareRT", null, ["number"]);

        this.prepareRT = () => {
            prepareRT(csObj);
        };

        const getScoreTime = CSMOD.cwrap("CsoundObj_getScoreTime", null, [
            "number"
        ]);

        this.getScoreTime = () => {
            return getScoreTime(csObj);
        };

        const setTable = CSMOD.cwrap("CsoundObj_setTable", null, [
            "number",
            "number",
            "number",
            "number"
        ]);

        this.setTable = (num, index, val) => {
            setTable(csObj, num, index, val);
        };

        const pushMidiMessage = CSMOD.cwrap("CsoundObj_pushMidiMessage", null, [
            "number",
            "number",
            "number",
            "number"
        ]);

        this.pushMidiMessage = (status, data1, data2) => {
            pushMidiMessage(csObj, status, data1, data2);
        };

        const setMidiCallbacks = CSMOD.cwrap(
            "CsoundObj_setMidiCallbacks",
            null,
            ["number"]
        );

        this.setMidiCallbacks = () => {
            setMidiCallbacks(csObj);
        };

        Object.assign(this, {
            result: 0,
            running: false,
            cnt: 0,
            sampleRate,
            nchnls: numberOfOutputs,
            nchnls_i: numberOfInputs
        });

        this.setMidiCallbacks();
        this.setOption("-odac");
        this.setOption("-iadc");
        this.setOption("-M0");
        this.setOption("-+rtaudio=null");
        this.setOption("-+rtmidi=null");
        this.setOption("--sample-rate=" + sampleRate);
        this.setOption("--nchnls=" + this.nchnls);
        this.setOption("--nchnls_i=" + this.nchnls_i);
        this.prepareRT();

        this.start = () => {
            if (this.running === false) {
                const ksmps = this.getKsmps();
                const outputPointer = this.getOutputBuffer();
                const inputPointer = this.getInputBuffer();
                this.zerodBFS = this.getZerodBFS();
                this.ksmps = ksmps;
                this.cnt = ksmps;
                this.csoundOutputBuffer = new Float32Array(
                    CSMOD.HEAP8.buffer,
                    outputPointer,
                    ksmps * this.nchnls
                );
                this.csoundInputBuffer = new Float32Array(
                    CSMOD.HEAP8.buffer,
                    inputPointer,
                    ksmps * this.nchnls_i
                );
                this.running = true;
            }
            // this.firePlayStateChange();
        };

        this.process = (inputs, outputs) => {
            if (this.csoundOutputBuffer == null || this.running === false) {
                const output = outputs[0];
                const bufferLen = output[0].length;

                for (let i = 0; i < bufferLen; i++) {
                    for (
                        let channel = 0;
                        channel < output.numberOfChannels;
                        channel++
                    ) {
                        const outputChannel = output[channel];
                        outputChannel[i] = 0;
                    }
                }
                return true;
            }

            const input = inputs[0];
            const output = outputs[0];
            const bufferLen = output[0].length;

            const csOut = this.csoundOutputBuffer;
            const csIn = this.csoundInputBuffer;
            const { ksmps, zerodBFS, nchnls, nchnls_i } = this;
            let { result, cnt } = this;

            for (let i = 0; i < bufferLen; i++, cnt++) {
                if (cnt === ksmps && result === 0) {
                    // if we need more samples from Csound
                    result = this.performKsmps();
                    cnt = 0;

                    if (result !== 0) {
                        this.running = false;
                        // this.firePlayStateChange();
                    }
                }

                for (let channel = 0; channel < input.length; channel++) {
                    const inputChannel = input[channel];
                    csIn[cnt * nchnls_i + channel] = inputChannel[i] * zerodBFS;
                }
                for (let channel = 0; channel < output.length; channel++) {
                    const outputChannel = output[channel];
                    if (result === 0) {
                        outputChannel[i] =
                            csOut[cnt * nchnls + channel] / zerodBFS;
                    } else {
                        outputChannel[i] = 0;
                    }
                }
            }

            this.cnt = cnt;
            this.result = result;
        };
    }
}
