import raw from "raw.macro";
import types from "./types";
import "audioworklet-polyfill";
const libcsound = raw("./libcsound.js");
const CsoundWorklet = raw("./CsoundWorklet.js");
const CsoundObj = raw("./CsoundObj.js");
const {
    COMPILE_CSD,
    START_PERFORMANCE,
    STOP_PERFORMANCE,
    RESET_CSOUND,
    WRITE_TO_FS,
    UNLINK_FROM_FS,
    CSOUND_INITIALIZED,
    SET_OUTPUT_CHANNEL_CALLBACK,
    SET_INPUT_CHANNEL_CALLBACK,
    SEND_OUTPUT_CHANNEL_VALUE,
    SEND_MIDI_MESSAGE,
    SET_INPUT_CHANNEL_VALUE,
    SET_CONTROL_CHANNEL,
    GET_CONTROL_CHANNEL,
    SET_STRING_CHANNEL,
    GET_STRING_CHANNEL,
    EVALUATE_CODE,
    READ_SCORE,
    GET_INPUT_CHANNEL_COUNT,
    GET_OUTPUT_CHANNEL_COUNT,
    GET_ZERODBFS,
    GET_SCORE_TIME,
    GET_TABLE_LENGTH,
    GET_TABLE,
    SET_TABLE_AT_INDEX,
    SET_TABLE,
    COMPILE_ORC,
    ADD_PLAY_STATE_LISTENER,
    FIRE_PLAY_STATE_CHANGE
} = types;

export default connect =>
    new Promise(async (resolve, reject) => {
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        const blob = new Blob(
            [`${libcsound}\n${CsoundWorklet}\n${CsoundObj}`],
            {
                type: "text/javascript"
            }
        );
        const url = URL.createObjectURL(blob);
        try {
            await actx.audioWorklet.addModule(url);
        } catch (e) {
            console.error(
                "Csound could not be instantiated. AudioWorklet.addModule Error: " +
                    e
            );
        }
        const csoundNode = new AudioWorkletNode(actx, "csound", {
            processorOptions: {
                sampleRate: actx.sampleRate,
                types: types
            },
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            inputChannelCount: [1]
        });

        csoundNode.port.start();

        if (connect !== false) {
            csoundNode.connect(actx.destination);
        }
        const outputChannelCallbacks = {};
        const channelCountCallbacks = {};
        const tableLengthCallbacks = {};
        const tableDataCallbacks = {};
        let scoreTimeCallbacks = {};
        let zerodBFSCallbacks = {};
        const playStateListeners = [];
        // const promiseResultCallbacks = {};

        let microphoneNode = null;
        const csound = {
            node: csoundNode,
            audioContext: actx,
            compileCsd: csd => {
                csoundNode.port.postMessage({
                    type: COMPILE_CSD,
                    payload: csd
                });
            },
            start: () => {
                if (microphoneNode) {
                    microphoneNode.connect(csoundNode);
                }

                actx.resume();
                csoundNode.port.postMessage({
                    type: START_PERFORMANCE
                });
            },
            stop: () => {
                csoundNode.port.postMessage({
                    type: STOP_PERFORMANCE
                });
            },
            reset: () => {
                csoundNode.port.postMessage({
                    type: RESET_CSOUND
                });
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
            setStringChannel: (name, value) => {
                csoundNode.port.postMessage({
                    type: SET_STRING_CHANNEL,
                    payload: { name, value }
                });
            },
            getControlChannel: name =>
                new Promise((resolve, reject) => {
                    outputChannelCallbacks[name] = resolve;
                    csoundNode.port.postMessage({
                        type: GET_CONTROL_CHANNEL,
                        payload: name
                    });
                }),
            getStringChannel: name =>
                new Promise((resolve, reject) => {
                    outputChannelCallbacks[name] = resolve;
                    csoundNode.port.postMessage({
                        type: GET_STRING_CHANNEL,
                        payload: name
                    });
                }),
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
            enableAudioInput: () => {
                const getUserMedia =
                    navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia ||
                    null;

                if (getUserMedia) {
                    navigator.getUserMedia(
                        {
                            audio: true,
                            video: false
                        },
                        stream => {
                            microphoneNode = actx.createMediaStreamSource(
                                stream
                            );
                            console.log("Enable Audio Input success");
                        },
                        () => {
                            console.error("Enable Audio Input failed");
                        }
                    );
                }
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
                            () => {
                                console.error(
                                    "MIDI is supported in this browser but could not initialize access."
                                );

                                reject(false);
                            }
                        );
                    } else {
                        console.error("MIDI not supported in this browser");
                        reject(false);
                    }
                }),
            compileOrc: orc => {
                csoundNode.port.postMessage({
                    type: COMPILE_ORC,
                    payload: orc
                });
            },
            evaluateCode: code => {
                csoundNode.port.postMessage({
                    type: EVALUATE_CODE,
                    payload: code
                });
            },
            readScore: score => {
                csoundNode.port.postMessage({
                    type: READ_SCORE,
                    payload: score
                });
            },
            getInputChannelCount: () =>
                new Promise((resolve, reject) => {
                    channelCountCallbacks[GET_INPUT_CHANNEL_COUNT] = {
                        resolve,
                        reject
                    };
                    csoundNode.port.postMessage({
                        type: GET_INPUT_CHANNEL_COUNT
                    });
                }),
            getOutputChannelCount: () =>
                new Promise((resolve, reject) => {
                    channelCountCallbacks[GET_OUTPUT_CHANNEL_COUNT] = {
                        resolve,
                        reject
                    };
                    csoundNode.port.postMessage({
                        type: GET_OUTPUT_CHANNEL_COUNT
                    });
                }),
            getZeroDBFS: () =>
                new Promise((resolve, reject) => {
                    zerodBFSCallbacks = {
                        resolve,
                        reject
                    };
                    csoundNode.port.postMessage({
                        type: GET_ZERODBFS
                    });
                }),
            getScoreTime: () =>
                new Promise((resolve, reject) => {
                    scoreTimeCallbacks = {
                        resolve,
                        reject
                    };
                    csoundNode.port.postMessage({
                        type: GET_SCORE_TIME
                    });
                }),
            getTableLength: table =>
                new Promise((resolve, reject) => {
                    tableLengthCallbacks[table] = {
                        resolve,
                        reject
                    };
                    csoundNode.port.postMessage({
                        type: GET_TABLE_LENGTH,
                        payload: table
                    });
                }),
            getTable: table =>
                new Promise((resolve, reject) => {
                    tableDataCallbacks[table] = {
                        resolve,
                        reject
                    };
                    csoundNode.port.postMessage({
                        type: GET_TABLE,
                        payload: table
                    });
                }),
            setTableAtIndex: (table, index, value) => {
                csoundNode.port.postMessage({
                    type: SET_TABLE_AT_INDEX,
                    payload: { table, index, value }
                });
            },
            setTable: (table, tableData) => {
                csoundNode.port.postMessage({
                    type: SET_TABLE,
                    payload: { table, tableData }
                });
            },
            addPlayStateListener: listener => {
                const listenerIndex = playStateListeners.length;
                playStateListeners.push(listener);
                csoundNode.port.postMessage({
                    type: ADD_PLAY_STATE_LISTENER,
                    payload: listenerIndex
                });
            }
        };

        csoundNode.port.onmessage = message => {
            const { type, payload } = message.data;
            switch (type) {
                case CSOUND_INITIALIZED: {
                    csound.setInputChannelCallback();
                    resolve(csound);
                    break;
                }
                case SEND_OUTPUT_CHANNEL_VALUE:
                case GET_STRING_CHANNEL:
                case GET_CONTROL_CHANNEL: {
                    const { name, value } = payload;
                    if (outputChannelCallbacks[name]) {
                        outputChannelCallbacks[name](value);
                    }
                    break;
                }
                case GET_INPUT_CHANNEL_COUNT:
                case GET_OUTPUT_CHANNEL_COUNT: {
                    const value = payload;
                    if (channelCountCallbacks[type]) {
                        const { resolve } = channelCountCallbacks[type];
                        resolve(value);
                    }
                    break;
                }
                case GET_TABLE_LENGTH: {
                    const { table, length } = payload;
                    if (tableLengthCallbacks[table]) {
                        const { resolve } = tableLengthCallbacks[table];
                        resolve(length);
                    }
                    break;
                }
                case GET_TABLE: {
                    const { table, tableData } = payload;
                    if (tableDataCallbacks[table]) {
                        const { resolve } = tableDataCallbacks[table];
                        resolve(tableData);
                    }
                    break;
                }
                case GET_ZERODBFS: {
                    const zeroDBFS = payload;
                    if (zerodBFSCallbacks) {
                        const { resolve } = zerodBFSCallbacks;
                        resolve(zeroDBFS);
                    }
                    break;
                }
                case GET_SCORE_TIME: {
                    const scoreTime = payload;
                    if (scoreTimeCallbacks) {
                        const { resolve } = scoreTimeCallbacks;
                        resolve(scoreTime);
                    }
                    break;
                }
                case FIRE_PLAY_STATE_CHANGE: {
                    const { index, playState } = payload;
                    if (playStateListeners[index]) {
                        playStateListeners[index](playState);
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        };
    });
