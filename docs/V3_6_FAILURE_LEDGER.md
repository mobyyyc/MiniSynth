# v3.6 Frozen-Benchmark Failure Ledger

Date: 2026-07-26  
Checkpoint: `v3.6_noise_detune_ablation`  
Decision: retain categorical waveform heads for the next experiment; do not introduce continuous wave-mix targets yet.

## Evidence inputs

This ledger reads the archived, immutable reports created for the v3.6 promotion:

- `runs/nwsd_v1/evaluation/archive/product_benchmark_v1_v3_4_v3_6_20260726/v3.6_nwsd_v1_2000_report.json`
- `runs/nwsd_v1/evaluation/archive/product_benchmark_v1_v3_4_v3_6_20260726/v3.6_product_report.json`

No training data, development data, benchmark data, or model checkpoint was changed for this review.

## Frozen results

| Layer | Cases | Mean weighted distance | Median | Maximum | Failed renders |
| --- | ---: | ---: | ---: | ---: | ---: |
| NWSD-v1 benchmark | 2,000 | 26.288 | 9.849 | 699.287 | 0 |
| Product benchmark | 36 | 20.738 | 8.841 | 145.413 | 0 |

The model's development-selected metrics report `test_mae = 0.05490`, oscillator-group
MAE `0.08002`, and waveform accuracy `0.9106` (`0.9125` main wave; `0.9087` detuned wave).

## Product failure ranking

| Rank | Category | Mean distance | Median | Maximum | Wave-label accuracy |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | audible noise | 52.361 | 41.458 | 145.413 | 11 / 12 (91.7%) |
| 2 | envelope extreme | 25.553 | 19.447 | 47.039 | 12 / 12 (100%) |
| 3 | wave identity | 17.044 | 5.492 | 71.828 | 9 / 12 (75.0%) |
| 4 | quiet mix | 11.136 | 7.493 | 27.996 | 12 / 12 (100%) |
| 5 | filter/resonance extreme | 10.938 | 6.445 | 25.066 | 11 / 12 (91.7%) |
| 6 | pitched detune | 7.394 | 6.241 | 18.486 | 12 / 12 (100%) |

The category table is small by design (six cases per category), so its role is to expose
failure patterns rather than replace the 2,000-clip aggregate benchmark.

## Interpretation

Wave-label errors exist: three of twelve labels are wrong in the dedicated wave-identity
slice, and the overall frozen benchmark waveform accuracy is 91.06%. They are not the
dominant current rendered-audio failure. Audible noise is the largest product problem by a
wide margin even though eleven of its twelve waveform labels are correct. Its worst cases are
driven by oscillator level, detune, and envelope-decay error; the worst overall product case
has correct square/noise wave labels but normalized errors of 0.290 for decay and 0.131 for
detune.

Replacing categorical heads with continuous wave-mix targets would change the synth target
schema and require a new, separately versioned training release. It would not directly
address the dominant wave-correct audible-noise failures, and it would prevent a clean
one-variable v3.6 comparison. The existing categorical target therefore remains the control.

## Next decision gate

The paired-error report is now part of the product-benchmark evaluator. On v3.6, the five
wave-correct audible-noise cases have normalized detune MAE `0.1218` and decay MAE `0.0838`.
For context, their mean rendered distance is `52.36`; v3.4 and v3.5 score `60.24` and `62.20`
respectively on the same category. The next v3.7 experiment is therefore a loss-only,
noise-detune calibration ablation: replace the current binary suppression of detune loss for a
noise detuned oscillator with a bounded nonzero weight. It must not change the architecture,
data release, waveform heads, optimizer, or any other loss term.
