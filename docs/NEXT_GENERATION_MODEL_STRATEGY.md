# Next-Generation Inverse-Model Strategy

Date: 2026-07-30  
Status: v3.9 target-mode setup implemented and tested; not trained.  
Control: `v3.6_noise_detune_ablation`

## Executive decision

Do not begin with another loss weight, a larger encoder, a continuous waveform target, or a
multi-hypothesis model. The next generation should be `v3.9_gain_invariant_mix`: retain the
v3.6 encoder, categorical waveform heads, pitch context, and detuned-noise suppression, but
replace the unidentifiable `osc_total_level` target with a canonical gain-invariant oscillator
representation. It is a target-schema correction, not a loss tweak.

The candidate predicts `detuned_balance` but not global oscillator total. At reconstruction it
uses a fixed total level of `1.0`:

```text
osc1_level = 1.0 * (1 - detuned_balance)
osc2_level = 1.0 * detuned_balance
```

For every current valid patch, this preserves oscillator ratio. Because the current renderer
normalizes the final waveform peak, it produces the same rendered audio as any positive common
scaling of those two levels, subject only to numerical precision.

## Root-cause audit

### The current input cannot identify total oscillator level

Two independent normalizations discard global loudness:

1. `minisynth.engine.render_patch()` divides each non-silent rendered clip by its own peak and
   scales it to `0.8`.
2. `minisynth.features.mel_spectrogram()` calls `librosa.power_to_db(..., ref=np.max)`, which
   makes the mel tensor invariant to a common audio-amplitude scale.

The numerical counterfactual was checked locally. A saw/square patch with levels `0.2/0.3` and
the same patch with `0.4/0.6` produced maximum audio difference `0.0`, maximum mel-tensor
difference `0.0`, and peak `0.8` in both cases. Yet the current model is trained to map those
identical inputs to different `osc_total_level` labels.

This is not ordinary underfitting. It is a one-to-many supervised target produced by an
intentional gain-invariant observation pipeline. Squared-error regression responds by predicting
the conditional mean, which appears as collapsed level spread and quiet-sound overprediction.

### Evidence from v3.6 through v3.8

| Metric | v3.6 | v3.7 | v3.8 |
| --- | ---: | ---: | ---: |
| NWSD osc1 level spread ratio | 0.5610 | 0.5386 | 0.4880 |
| NWSD osc2 level spread ratio | 0.5996 | 0.5721 | 0.5303 |
| NWSD total-level MAE | 0.3319 | 0.3358 | 0.3631 |
| Product quiet total-level MAE | 0.5698 | — | 0.5322 |
| Product quiet mean distance | 11.136 | 89.937 | 36.767 |

v3.8 slightly reduced one label error while making rendered audio and output spread worse. That
is consistent with forcing a deterministic point prediction toward an unobservable label, not
with a missing quiet-target penalty.

## Research review

### Inverse-problem ambiguity

Bishop's original [Mixture Density Networks](https://research.aston.ac.uk/en/publications/mixture-density-networks/)
notes that squared-error regression produces conditional averages, and that in a multi-valued
inverse problem an average can itself be invalid. That mechanism describes the observed
regression-to-the-mean, but a probabilistic output is not the first remedy here: the ambiguous
scale produces the same current renderer output. Canonicalizing that equivalence class removes
the false label rather than asking the model to guess one arbitrary member.

### Audio-model inductive bias

[InverSynth](https://arxiv.org/abs/1812.06349) supports spectrogram CNNs for synthesizer
parameter inference and reports that depth matters. NeuroWave already has a large four-stage
CNN, time-frequency pooling, pitch context, and grouped heads; its non-level predictions retain
high spread (for example cutoff `0.9815`, attack `0.9853`, and release `0.9812` in v3.6).
Capacity is therefore not the first variable to change.

[DDSP](https://research.google/pubs/ddsp-differentiable-digital-signal-processing/) demonstrates
the value of explicit signal-processing structure and interpretable controls. For NeuroWave,
the immediate implication is to respect the renderer's invariances in the target schema.
A differentiable renderer and perceptual reconstruction loss are valuable later, but would be a
separate architecture-and-training change and must not be confounded with this correction.

### Alternatives deliberately deferred

- **Mixture-density or multi-hypothesis heads:** appropriate when materially different patches
  can explain one observation. [Multiple-choice learning](https://proceedings.neurips.cc/paper_files/paper/2016/hash/20d135f0f28185b84a4cf7aa51f29500-Abstract.html)
  can return diverse hypotheses, but would need a candidate-selection/render-ranking workflow.
  It cannot make absolute gain identifiable after both current normalizations.
- **Aleatoric uncertainty head:** [Kendall and Gal](https://arxiv.org/abs/1703.04977) provide a
  useful future confidence mechanism, but uncertainty reporting does not fix an invalid point
  target or improve the single patch exported by the app.
- **Continuous waveform mixtures:** the v3.6 failure ledger shows the dominant failures are
  wave-correct. This change would also alter synth semantics and obscure the gain-invariance
  test.
- **More layers, attention, or a larger dataset:** these may help after target correction, but
  none can recover information intentionally absent from the input.
- **Preserving absolute loudness instead:** this would require removing renderer peak
  normalization, retaining absolute mel reference/RMS, calibrating dataset gain, and defining
  how arbitrary recorded-input gain maps to synth output gain. That is a product-level loudness
  design, not a safe inverse-model ablation.

## Strategic sequence

1. **Representation proof:** add a gain-invariant target mode and tests that target patches and
   their canonical reconstructions render identically after the existing renderer. Verify the
   mode excludes `osc_total_level` and never creates an invalid level.
2. **Metric correction:** retain existing diagnostics for legacy comparison, but stop using
   total-level MAE or raw per-oscillator level spread as v4 promotion gates. Add canonical
   ratio/balance error and render-equivalence checks instead.
3. **Isolated v3.9 experiment:** hold the NWSD-v1 data, encoder, categorical waveform heads,
   pitch context, optimizer, schedule, seed, and v3.6 detune behavior fixed. Train one
   `v3.9_gain_invariant_mix` checkpoint using the new target mode.
4. **Frozen evaluation:** evaluate once on the 2,000-clip NWSD-v1 benchmark and once on the
   36-case product benchmark. Keep the v3.6 audio reports as the control; do not compare raw
   total-level labels across representations.
5. **Promotion decision:** run a fresh balanced blind v3.6-versus-v3.9 review only if all
   objective gates pass. If v3.9 fails, inspect waveform/balance/detune/envelope errors before
   considering an architecture change.
6. **Post-v3.9 research:** only after a fair target representation has been tested, compare a
   renderer-aware reconstruction objective or a small multi-hypothesis/refinement path against
   v3.9 in separately pre-registered experiments.

## v3.9 proposed design and gates

### Controlled design

- Model ID: `v3.9_gain_invariant_mix`.
- Target mode: `gain_invariant_main_detuned_mix`.
- Inputs: current relative log-mel tensor plus current known-pitch channel.
- Targets: length, main waveform class, detuned balance, detuned waveform class, detune amount,
  cutoff, resonance, attack, decay, sustain, release.
- Reconstruction: fixed oscillator total `1.0`; levels derived only from predicted balance.
- Architecture/loss: current v3.6 large grouped CNN, categorical heads, audibility-aware loss,
  and detuned-noise detune weight `0.0`, with only removed-target bookkeeping changed.
- Data and training: unchanged NWSD-v1 train/development partitions, same 500k samples,
  optimizer, schedule, batch size, seed, and best-development checkpoint selection.

### Pre-registered gates

| Gate | v3.6 control | v3.9 requirement |
| --- | ---: | ---: |
| Canonical reconstruction render equivalence | n/a | exact/near-zero error on a dedicated test set |
| NWSD mean weighted distance | 26.288 | `<= 26.288` |
| Product mean weighted distance | 20.738 | `<= 20.738` |
| Product quiet-mix mean distance | 11.136 | `<= 10.00` |
| NWSD detuned-balance MAE | 0.0751 | `<= 0.0751` |
| NWSD main/detuned waveform errors | 0.0315 / 0.0363 | no worse than v3.6 by more than 0.002 |
| Failed renders on either layer | 0 | 0 |

The first three audio measures are primary. The balance and waveform rows prevent an apparent
audio gain from hiding a regression in the audible oscillator representation. There is no
global-level spread gate because global level is intentionally not inferable or predicted.

## What approval would authorize next

The approved v3.9 setup now includes the target mode, canonical reconstruction,
gain-invariant diagnostics, unit tests, and documentation. Training remains a separate
user-run step with the documented command.
