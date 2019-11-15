<CsoundSynthesizer>
<CsOptions>
-odac -+rtaudio=CoreAudio
</CsOptions>
<CsInstruments>

sr = 48000
ksmps = 128
nchnls = 2
0dbfs = 1

instr 1
    aout vco2 0.1, 440
    kphasor phasor 1

    outs kphasor * aout, (1 - kphasor) * aout
endin

schedule(1, 0, -1)

</CsInstruments>
<CsScore>
</CsScore>
</CsoundSynthesizer>
