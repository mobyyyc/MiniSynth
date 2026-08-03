# v3.9 Gain-Invariant Balance Regression Diagnosis

Date: 2026-08-02  
Candidate: `v3.9_gain_invariant_mix`  
Control: `v3.6_noise_detune_ablation`  
Decision: reject v3.9; retain v3.6. Do not treat v3.9 as a clean target-schema test.

## Question

Why did removing the non-identifiable `osc_total_level` target regress rendered-audio quality
when the gain-invariance proof remains mathematically valid?

## Findings

v3.9 changed two coupled training mechanisms, not one:

1. It removed the `osc_total_level` output and its direct loss.
2. It changed how `detuned_balance` is weighted inside `audible_main_detuned_loss()`.

v3.6 obtains `total_audibility` from the source total level and uses it to weight each balance
error. v3.9 has no total-level target, so it assigns a canonical total of `1.0`; every balance
example consequently has the same normalized weight.

The 10,000-clip NWSD-v1 development tensor confirms that this is a material curriculum change:

| Measure | v3.6 balance weighting | v3.9 balance weighting |
| --- | ---: | ---: |
| Weight range (minimum to maximum) | 0.3766 to 1.7630 | 1.0000 to 1.0000 |
| Median weight | 0.9990 | 1.0000 |
| Correlation with source total level | 1.0000 | 0.0000 |
| Source total level, 10th to 90th percentile | 0.4402 to 1.5579 | same source data |
| Quiet examples (total <= 0.5) | 12.91% | same source data |

The old total is not observable at inference, but it was a training-only importance weight.
Removing it made quiet and loud source patches contribute equally to balance learning. That may
be more semantically pure, but it is not the same optimization problem as v3.6.

## Evaluation evidence

| Slice / diagnostic | v3.6 | v3.9 | Change |
| --- | ---: | ---: | --- |
| NWSD mean weighted distance | 26.288 | 27.540 | Regression |
| Product mean weighted distance | 20.738 | 29.218 | Regression |
| Product quiet-mix mean distance | 11.136 | 38.846 | Regression |
| NWSD balance MAE | 0.0751 | 0.0758 | Regression |
| Quiet product balance MAE | 0.0512 | 0.0708 | Regression |
| NWSD main-wave error | 0.0315 | 0.0315 | Equal |
| NWSD detuned-wave error | 0.0363 | 0.0369 | Near equal |
| NWSD normalized detune MAE | 0.0842 | 0.0840 | Near equal |

The regression is concentrated in balance-sensitive product categories, not a global waveform
failure. Pitched detune distance rises `7.394 -> 21.924`, quiet mix `11.136 -> 38.846`, and
filter/resonance extreme balance MAE `0.0878 -> 0.1363`. Quiet product waveform labels remain
correct, while quiet balance MAE rises. This is consistent with changed balance optimization,
not evidence that absolute total level should be restored as an inference target.

## Implications

- The gain-invariance proof is retained: global oscillator scale remains absent from the current
  renderer and mel input, so it must not return as a predicted application parameter.
- v3.9 does **not** isolate target removal because it also removes v3.6's training-only
  audibility weighting for balance and changes the shared-head output dimension.
- The next experiment must isolate one of these effects. Do not increase model capacity or tune
  another quiet-total penalty first.

## Next hypothesis to design

The appropriate next design task is a pre-registered `v3.10` **gain-invariant target with
legacy balance curriculum** experiment: keep the v3.9 target and canonical inference output,
but retain v3.6's source-total-derived balance weight during training only. This is legitimate
importance weighting because it is available in synthetic labels during training and is never
predicted or required at inference.

Before implementing it, define whether the old source-total weight should apply only to
`detuned_balance` (the recommended single-variable scope), and set promotion gates identical to
v3.9. Its result will determine whether v3.6's advantage came from the balance curriculum or
from retaining the extra total-level head.
