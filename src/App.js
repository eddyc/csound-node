import React, { useEffect, useState } from "react";
import Csound from "./wasm/Csound";
import "./App.css";
import raw from "raw.macro";
import { log } from "util";
const csdFile = raw("./wasm/test.csd");

const App = props => {
    const [csound, setCsound] = useState(false);

    useEffect(() => {
        (async () => {
            const csound = await Csound();
            csound.setOutputChannelCallback(
                "phasor",
                value => {}
                // console.log(value)
            );
            await csound.initializeMidi();

            setCsound(csound);
        })();
    }, []);

    return (
        <div className="App">
            {csound && (
                <>
                    <button onClick={() => csound.start()}>Start</button>
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
                            console.log(value, string);
                        }}
                    >
                        Get Value
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
