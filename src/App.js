import React from "react";
import Csound from "./wasm/Csound";
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
        this.setState({ csound });
    };

    render() {
        return (
            <div className="App">
                <button onClick={() => this.state.csound.start()}>
                    Start{" "}
                </button>
                <button onClick={() => this.state.csound.compileCsd(csdFile)}>
                    Compile{" "}
                </button>
            </div>
        );
    }
}
export default App;
