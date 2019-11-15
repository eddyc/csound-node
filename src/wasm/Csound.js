import raw from "raw.macro";
import types from "./types";
import "audioworklet-polyfill";
const libcsound = raw("./libcsound.js");
const CsoundWorklet = raw("./CsoundWorklet.js");
const CsoundObj = raw("./CsoundObj.js");
const {
    COMPILE_CSD,
    START_PERFORMANCE,
    WRITE_TO_FS,
    UNLINK_FROM_FS,
    CSOUND_INITIALIZED,
    SET_OUTPUT_CHANNEL_CALLBACK,
    SET_INPUT_CHANNEL_CALLBACK,
    SEND_OUTPUT_CHANNEL_VALUE,
    SEND_MIDI_MESSAGE,
    SET_CONTROL_CHANNEL,
    SET_INPUT_CHANNEL_VALUE
} = types;

export default () =>
    new Promise(async (resolve, reject) => {
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        const blob = new Blob(
            [`${libcsound}\n${CsoundWorklet}\n${CsoundObj}`],
            {
                type: "text/javascript"
            }
        );
        const url = URL.createObjectURL(blob);
        await actx.audioWorklet.addModule(url);
        const csoundNode = new AudioWorkletNode(actx, "csound", {
            processorOptions: {
                sampleRate: actx.sampleRate,
                types: types
            },
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2]
        });

        csoundNode.port.start();
        csoundNode.connect(actx.destination);
        await actx.suspend();
        const outputChannelCallbacks = {};
        const csound = {
            compileCsd: csd => {
                csoundNode.port.postMessage({
                    type: COMPILE_CSD,
                    payload: csd
                });
            },
            start: () => {
                csoundNode.port.postMessage({
                    type: START_PERFORMANCE
                });

                actx.resume();
            },
            writeToFs: (path, blob) => {
                csoundNode.port.postMessage({
                    type: WRITE_TO_FS,
                    payload: { path, blob }
                });
            },
            unlinkFromFs: path => {
                csoundNode.port.postMessage({
                    type: UNLINK_FROM_FS,
                    payload: path
                });
            },
            setControlChannel: (name, value) => {
                csoundNode.port.postMessage({
                    type: SET_CONTROL_CHANNEL,
                    payload: { name, value }
                });
            },
            setOutputChannelCallback: (name, callback) => {
                outputChannelCallbacks[name] = callback;
                csoundNode.port.postMessage({
                    type: SET_OUTPUT_CHANNEL_CALLBACK
                });
            },
            setInputChannelCallback: () => {
                csoundNode.port.postMessage({
                    type: SET_INPUT_CHANNEL_CALLBACK
                });
            },
            setInputChannelValue: (name, value) => {
                csoundNode.port.postMessage({
                    type: SET_INPUT_CHANNEL_VALUE,
                    payload: { name, value }
                });
            },
            initializeMidi: () =>
                new Promise((resolve, reject) => {
                    if (navigator.requestMIDIAccess) {
                        navigator.requestMIDIAccess().then(
                            midiInterface => {
                                const inputs = midiInterface.inputs.values();

                                for (
                                    let input = inputs.next();
                                    input && !input.done;
                                    input = inputs.next()
                                ) {
                                    input = input.value;
                                    input.onmidimessage = ({ data }) => {
                                        csoundNode.port.postMessage({
                                            type: SEND_MIDI_MESSAGE,
                                            payload: data
                                        });
                                    };
                                }
                                resolve(true);
                            },
                            () => reject(false)
                        );
                    } else {
                        console.log("MIDI not supported in this browser");
                        reject(false);
                    }
                })
        };

        csoundNode.port.onmessage = message => {
            const { type, payload } = message.data;
            switch (type) {
                case CSOUND_INITIALIZED: {
                    resolve(csound);
                    break;
                }
                case SEND_OUTPUT_CHANNEL_VALUE: {
                    const { name, value } = payload;
                    outputChannelCallbacks[name](value);
                    break;
                }
                default: {
                    break;
                }
            }
        };
    });
