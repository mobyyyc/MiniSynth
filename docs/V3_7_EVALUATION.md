# v3.7 Detuned-Noise Calibration Evaluation

Date: 2026-07-27  
Candidate: `v3.7_noise_detune_calibration`  
Control: `v3.6_noise_detune_ablation`  
Decision: reject v3.7; retain v3.6 as the active checkpoint.

## Controlled change

v3.7 keeps the NWSD-v1 release, model architecture, grouped heads, categorical waveform
targets, optimizer, schedule, seed, and checkpoint-selection flow from v3.6. It changes only
the detuned-noise detune-loss multiplier from `0.0` to `0.5`.

## Objective results

| Layer | Metric | v3.6 | v3.7 | Result |
| --- | --- | ---: | ---: | --- |
| NWSD-v1 benchmark (2,000 clips) | Mean weighted distance | 26.288 | 28.359 | Regression |
|  | Median weighted distance | 9.849 | 9.913 | Regression |
|  | Maximum weighted distance | 699.287 | 614.861 | Improvement, insufficient alone |
|  | Failed renders | 0 | 0 | Equal |
| Product benchmark (36 cases) | Mean weighted distance | 20.738 | 40.758 | Regression |
|  | Median weighted distance | 8.841 | 15.909 | Regression |
|  | Maximum weighted distance | 145.413 | 439.442 | Regression |
|  | Failed renders | 0 | 0 | Equal |

The primary wave-correct audible-noise detune metric improves only from `0.1218` to `0.1199`,
missing the predeclared `<= 0.10` gate. The corresponding decay metric moves from `0.0838` to
`0.0785`, but overall calibration worsens.

## Product category changes

| Category | v3.6 mean distance | v3.7 mean distance |
| --- | ---: | ---: |
| Audible noise | 52.361 | 71.037 |
| Envelope extreme | 25.553 | 45.418 |
| Wave identity | 17.044 | 13.220 |
| Quiet mix | 11.136 | 89.937 |
| Filter/resonance extreme | 10.938 | 12.612 |
| Pitched detune | 7.394 | 12.320 |

The isolated wave-identity improvement cannot offset the large quiet-mix, audible-noise,
envelope, and detune regressions. The 439.442 quiet-mix worst case is driven chiefly by
oscillator-level error. Because the candidate fails both aggregate layers and its primary
target, no blinded listening review is warranted.

## Regression diagnosis

The v3.7 change did not reveal a useful detune-loss direction. It increased all aggregate
main/detuned diagnostic errors: main-wave error `0.0315 -> 0.0345`, detuned-wave error
`0.0362 -> 0.0398`, total-level error `0.3319 -> 0.3358`, balance error `0.0751 -> 0.0799`,
and normalized detune error `0.0842 -> 0.0867`. Product wave-label mistakes doubled from five
to ten, including a new quiet-mix noise-to-square mistake in the worst quiet case.

Both oscillator-level predictions remain under-dispersed relative to their targets, and v3.7
contracts them further: osc1-level standard-deviation ratio `0.5610 -> 0.5386`; osc2-level
ratio `0.5996 -> 0.5721`. The quiet-mix problem is therefore primarily oscillator-level
calibration and prediction-spread collapse. It already existed in v3.6 and the detune-loss
change made it worse; it is not evidence for another detune multiplier or wave-target change.

## Follow-up

Do not tune the multiplier further. The next experiment-design task is a single oscillator-
level calibration hypothesis that directly addresses prediction-spread collapse, while keeping
the v3.6 detune weighting and categorical waveform heads as controls. The rejected v3.7
checkpoint and compact reports remain local, ignored experiment artifacts; the shipped and
research control remains v3.6.
