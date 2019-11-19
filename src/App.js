import React, { useEffect, useState } from "react";
import Csound from "./wasm/Csound";
import "./App.css";
import raw from "raw.macro";
const csdFile = raw("./wasm/test.csd");

const App = props => {
    const [csound, setCsound] = useState(false);

    useEffect(() => {
        (async () => {
            const csound = await Csound(false);
            csound.node.connect(csound.audioContext.destination);
            csound.enableAudioInput();
            csound.setOutputChannelCallback(
                "phasor",
                value => {}
                // console.log(value)
            );
            await csound.initializeMidi();
            csound.addPlayStateListener(state => {
                console.log(state + 1);
            });
            csound.addPlayStateListener(state => {
                console.log(state + 2);
            });
            setCsound(csound);
        })();
    }, []);

    return (
        <div className="App">
            {csound && (
                <>
                    <button onClick={() => csound.start()}>Start</button>
                    <button onClick={() => csound.stop()}>Stop</button>
                    <button onClick={() => csound.reset()}>Reset</button>
                    <button onClick={() => csound.compileCsd(csdFile)}>
                        Compile
                    </button>
                    <button
                        onClick={async () => {
                            const value = await csound.getControlChannel(
                                "kval"
                            );
                            const string = await csound.getStringChannel(
                                "kstring"
                            );

                            const outputs = await csound.getOutputChannelCount();
                            const inputs = await csound.getInputChannelCount();
                            const table = await csound.getTable(1);
                            const zeroDBFS = await csound.getZeroDBFS();
                            const scoreTime = await csound.getScoreTime();
                            console.log(
                                value,
                                string,
                                outputs,
                                inputs,
                                table,
                                zeroDBFS,
                                scoreTime
                            );
                        }}
                    >
                        Get Value
                    </button>
                    <button
                        onClick={async () => {
                            csound.evaluateCode(`instr 2
                                                    aout vco2 0.1, 440
                                                    outs aout, aout
                                                endin`);
                            csound.readScore("i2 0 1");
                        }}
                    >
                        Eval
                    </button>

                    <input
                        type="range"
                        min="1"
                        max="100"
                        onChange={e => {
                            csound.setInputChannelValue(
                                "channel",
                                e.target.value
                            );
                        }}
                    />
                </>
            )}
        </div>
    );
};
export default App;
