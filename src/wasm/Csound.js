import raw from "raw.macro";
import types, { COMPILE_CSD, START_PERFORMANCE } from "./types";
const libcsound = raw("./libcsound.js");
const CsoundWorklet = raw("./CsoundWorklet.js");
const CsoundObj = raw("./CsoundObj.js");

export default async () => {
    await import("audioworklet-polyfill");
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const blob = new Blob([`${libcsound}\n${CsoundWorklet}\n${CsoundObj}`], {
        type: "text/javascript"
    });
    const url = URL.createObjectURL(blob);
    await actx.audioWorklet.addModule(url);

    const csoundNode = new AudioWorkletNode(actx, "csound", {
        processorOptions: {
            sampleRate: actx.sampleRate,
            types: types
        }
    });

    csoundNode.port.start();
    csoundNode.port.onmessage = message => {
        console.log(message);
    };

    return {
        compileCsd: csd => {
            csoundNode.port.postMessage({
                type: COMPILE_CSD,
                payload: csd
            });
        },
        start: () => {
            csoundNode.connect(actx.destination);
            csoundNode.port.postMessage({
                type: START_PERFORMANCE
            });
            actx.resume();
        }
    };
};
