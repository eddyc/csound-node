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
    ain in
    aout vco2 0.1, 440
    kphasor phasor 1
    kc invalue "channel"
    outs kphasor * aout, (1 - kphasor) * aout
    printk2 kc
    chnset kphasor,"phasor"
    kval = kphasor
    chnset  kval + 1000,"kval"
    SString = "The string"
    chnset SString, "kstring"
    itemp ftgen 1, 0, 1025, -7, 200, 1024, 2000
    outs ain, aout
endin
schedule(1, 0 , -1)
</CsInstruments>
<CsScore>
</CsScore>
</CsoundSynthesizer>
