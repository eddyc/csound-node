import React from "react";
import Csound from "./wasm/Csound";
import "./App.css";
import raw from "raw.macro";
const csdFile = raw("./wasm/test.csd");

class App extends React.Component {
    constructor(props) {
        super(props);
        this.initialise();
        this.state = {
            csound: {}
        };
    }

    initialise = async () => {
        const csound = await Csound();
        csound.setOutputChannelCallback("phasor", value => console.log(value));
        const result = await csound.initializeMidi();
        console.log(result);

        this.setState({ csound });
        // const cs = libcsound();
        // console.log(cs);
    };

    render() {
        return (
            <div className="App">
                <button onClick={() => this.state.csound.start()}>Start</button>
                <button onClick={() => this.state.csound.compileCsd(csdFile)}>
                    Compile
                </button>
            </div>
        );
    }
}
export default App;
