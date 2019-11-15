import raw from "raw.macro";
import types, {
    COMPILE_CSD,
    START_PERFORMANCE,
    WRITE_TO_FS,
    UNLINK_FROM_FS
} from "./types";
import "audioworklet-polyfill";
const libcsound = raw("./libcsound.js");
const CsoundWorklet = raw("./CsoundWorklet.js");
const CsoundObj = raw("./CsoundObj.js");

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
        csoundNode.port.onmessage = message => {
            console.log(message);
        };

        csoundNode.connect(actx.destination);
        await actx.suspend();

        resolve({
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
            }
        });
    });
