# v3.10 Gain-Invariant Legacy-Balance-Curriculum Plan

**Date:** 2026-08-02  
**Candidate:** `v3.10_gain_invariant_balance_curriculum`  
**Status:** Evaluated and rejected; v3.6 remains active

## Question

Did v3.9 regress because it removed the non-identifiable oscillator-total target, or because
that change also unintentionally replaced v3.6's source-total-weighted
`detuned_balance` curriculum with uniform weighting?

The v3.9 diagnosis shows that both changes occurred together. This experiment isolates the
second change while preserving the gain-invariant design.

## Fixed design

v3.10 keeps every v3.9 modelling decision fixed:

- the 11-output `gain_invariant_main_detuned_mix` target layout;
- no `osc_total_level` model target or inference output;
- canonical inference reconstruction with oscillator total fixed at `1.0`;
- architecture, categorical waveform heads, pitch features, dataset partitions, optimizer,
  scheduler, seed, and training duration;
- the v3.9 loss behavior for all targets other than `detuned_balance`.

This means the v3.9 checkpoint is the direct experimental control. v3.6 remains the
promotion baseline because it is the current active model.

## Single changed variable

Only the `detuned_balance` loss reduction changes. During tensor preparation, retain the
original synthetic oscillator total
`(osc1_level + osc2_level) / 2` as detached, training-only sidecar metadata. It is not a
model target and must never be accepted by inference or reconstructed predictions.

For each training and validation minibatch, apply the existing
`_normalized_audibility_weights()` helper to that sidecar and use the resulting normalized
weights for the `detuned_balance` error. This restores v3.6's balance curriculum exactly:
larger source totals contribute more and quieter source totals contribute less. The main-wave,
detuned-wave, and detune losses remain the v3.9 canonical-gain behavior.

Implementation must carry this sidecar through sharded tensor batching separately from model
features and supervised targets, and pass it only to the loss calculation. Tests must prove
that it cannot change the target layout, checkpoint output dimension, or inference API.

Implementation preserves the ordinary two-tensor batch interface unless this loss preset is
selected. With `legacy_balance_curriculum`, sharded and unsharded training pass a third,
one-dimensional sidecar tensor only into the loss. The preset rejects missing sidecar metadata
instead of silently falling back to uniform balance weighting.

## Approved training command

```powershell
& $Python scripts/train_torch.py `
  --model-id v3.10_gain_invariant_balance_curriculum `
  --target-mode gain_invariant_main_detuned_mix `
  --loss-preset legacy_balance_curriculum `
  --tensor-data data/generated/nwsd_v1/train/features `
  --validation-tensor-data data/generated/nwsd_v1/dev/features `
  --epochs 50 `
  --batch-size 128 `
  --device cuda `
  --quiet `
  --model-output models/v3.10_gain_invariant_balance_curriculum.pt `
  --metrics-output runs/nwsd_v1/training/v3.10_gain_invariant_balance_curriculum_metrics.json
```

Do not supply the immutable `benchmark` partition to this command.

## Frozen evaluation result

v3.10 was trained once (best validation epoch 31) and evaluated once on 2026-08-03. It
restored a meaningful part of v3.9's product performance, which supports the diagnosis that
the balance curriculum matters, but it missed every quality gate except renderer reliability.
It is rejected without a blind listening review.

| Gate | Requirement | v3.10 result | Decision |
| --- | ---: | ---: | --- |
| NWSD-v1 mean spectral distance | `<= 26.288` | `29.733` | Fail |
| Product-suite mean spectral distance | `<= 20.738` | `22.226` | Fail |
| Quiet-category mean spectral distance | `<= 10.000` | `22.940` | Fail |
| Gain-invariant detuned-balance MAE | `<= 0.0751` | `0.077946` | Fail |
| Main-wave error vs. v3.9 | no regression > `0.002` | `+0.002875` | Fail |
| Detuned-wave error vs. v3.9 | no regression > `0.002` | `+0.003250` | Fail |
| Renderer failures | `0` | `0` | Pass |

The source-total sidecar is therefore not sufficient to rescue the gain-invariant candidate.
Do not sweep its weighting or promote this checkpoint. The next design decision must isolate
the removed-head/shared-representation effect without restoring global level as an inference
target.

## Evaluation contract

Use the existing fixed evaluation protocols and frozen manifests:

- `NWSD-v1` 2,000-example benchmark;
- product evaluation suite, including quiet, detune, waveform, envelope, filter, and audible
  noise categories;
- the gain-invariance diagnostics and zero-render-failure checks.

Run a blind listening test only if every numerical promotion gate passes.

## Promotion gates

The candidate must satisfy all of the following before a blind test or promotion:

| Metric | Required result |
| --- | --- |
| NWSD-v1 mean spectral distance | `<= 26.288` (v3.6) |
| Product-suite mean spectral distance | `<= 20.738` (v3.6) |
| Quiet-category mean spectral distance | `<= 10.000` |
| Gain-invariant detuned-balance MAE | `<= 0.0751` |
| Main/detuned waveform error | No regression greater than `0.002` versus v3.9 |
| Renderer failures | `0` |

Failure of any gate rejects v3.10 without hyperparameter sweeping. The next research decision
would then isolate the removed-head effect separately; it must not reintroduce total level as
an inference target.
