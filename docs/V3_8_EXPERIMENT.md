# v3.8 Quiet-Total-Level Calibration Plan

Date: 2026-07-28  
Candidate: `v3.8_quiet_total_overshoot`  
Control: `v3.6_noise_detune_ablation`  
Status: rejected after frozen evaluation; v3.6 remains active.

## Question

Can a modestly stronger penalty for overpredicting quiet oscillator totals correct the
under-dispersed level predictions without harming the current v3.6 model elsewhere?

## Evidence

The rejected v3.7 candidate worsened quiet-mix rendered distance from `11.136` to `89.937`.
Its worst quiet case also added a waveform mistake, but the wider diagnosis remains clear:
both oscillator-level outputs are under-dispersed. The v3.6 baseline output/target standard
deviation ratios are `0.5610` for oscillator 1 and `0.5996` for oscillator 2. On the six
quiet product cases, v3.6 has oscillator-total-level MAE `0.5698`, predominantly from
overprediction, despite having no waveform-label mistakes in that category.

## One controlled change

`audible_main_detuned_loss()` already computes the total-level component as:

```text
mean(square(total prediction - total target))
+ weighted_mean(square(max(total prediction - total target, 0)), quiet-target weight)
```

v3.8 changes only the coefficient of the second term from `1.0` to `2.0`:

```text
mean(square(total prediction - total target))
+ 2.0 * weighted_mean(square(max(total prediction - total target, 0)), quiet-target weight)
```

The quiet-target weighting function itself, all other total-level error, waveform
classification, balance, detune, filter, ADSR, optimizer, scheduler, data, checkpoint
selection, and random seed stay unchanged from v3.6. In particular, detuned-noise detune
weight remains `0.0` and waveform heads remain categorical.

This is a calibration experiment, not a broad loss redesign. A stronger one-sided penalty
gives the model additional gradient specifically where its current quiet targets are rendered
too loud. It may widen the learned level distribution by moving the low-level tail downward;
it does not claim to solve high-level underprediction on its own.

## Fixed run protocol

1. Use the named `quiet_total_overshoot` loss preset with coefficient `2.0`; the v3.6 preset
   remains unchanged.
2. Focused loss tests verify that the candidate increases loss for quiet total-level
   overprediction and that both the candidate and v3.6 preset remain supported.
3. Train once on NWSD-v1 train and select the checkpoint only by the existing NWSD-v1
   development flow. Retain the checkpoint and compact metrics; use `--quiet` for console
   output.
4. Evaluate the selected checkpoint once on the frozen 2,000-clip NWSD-v1 benchmark and once
   on the fixed 36-case product benchmark. Save the usual ignored reports and paired
   diagnostics.
5. Apply the gates below before creating any listening package.

## Promotion gates

| Gate | v3.6 control | v3.8 requirement |
| --- | ---: | ---: |
| Quiet product total-level MAE | 0.5698 | <= 0.5000 |
| Quiet product mean weighted distance | 11.136 | <= 10.00 |
| Quiet product waveform-label mistakes | 0 | 0 |
| NWSD osc1 level prediction-spread ratio | 0.5610 | >= 0.60 |
| NWSD osc2 level prediction-spread ratio | 0.5996 | >= 0.60 |
| NWSD total-level MAE | 0.3319 | no worse than 0.3319 |
| NWSD mean weighted distance | 26.288 | <= 27.08 |
| Product mean weighted distance | 20.738 | <= 21.36 |
| Failed renders on either benchmark | 0 | 0 |

The first two rows are the primary success criteria. The aggregate limits are guardrails, not
targets to optimize. A candidate that fails any row is rejected without blind review. A
candidate passing every row receives a new balanced v3.6-versus-v3.8 blind review; it can only
replace v3.6 if that review does not favor v3.6 overall.

## Frozen evaluation result

Training selected epoch 31. The candidate was evaluated once on the immutable 2,000-clip
NWSD-v1 benchmark and once on the fixed 36-case product benchmark on 2026-07-30. It fails the
pre-registered objective gates and is rejected without a blind review.

| Gate | v3.6 control | v3.8 result | Decision |
| --- | ---: | ---: | --- |
| Quiet product total-level MAE | 0.5698 | 0.5322 | Improved, but misses `<= 0.5000` |
| Quiet product mean weighted distance | 11.136 | 36.767 | Fail |
| Quiet product waveform-label mistakes | 0 | 0 | Pass |
| NWSD osc1 level prediction-spread ratio | 0.5610 | 0.4880 | Fail |
| NWSD osc2 level prediction-spread ratio | 0.5996 | 0.5303 | Fail |
| NWSD total-level MAE | 0.3319 | 0.3631 | Fail |
| NWSD mean weighted distance | 26.288 | 28.811 | Fail (`<= 27.08`) |
| Product mean weighted distance | 20.738 | 26.493 | Fail (`<= 21.36`) |
| Failed renders on either benchmark | 0 | 0 | Pass |

The stronger one-sided loss reduced quiet-target level error slightly but contracted both
oscillator-level prediction distributions further and made quiet rendered sound substantially
worse. This rejects the coefficient direction itself: do not tune another multiplier value.
The next experiment must use the saved diagnostics to identify a different, single-variable
mechanism for restoring level spread.

## Interpretation rules

- If quiet metrics improve but either aggregate benchmark crosses its guardrail, the coefficient
  is not acceptable; do not tune it within this experiment.
- If aggregate metrics improve but quiet total-level MAE misses its gate, the hypothesis is not
  supported; do not promote it as a quiet-level fix.
- If waveform mistakes appear on quiet cases, reject it even if numerical distance improves.
- The next hypothesis after a rejection must come from the saved diagnostics, not another
  multiplier value.
