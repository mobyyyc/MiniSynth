# Product Benchmark v1: Objective Baseline

Date: 2026-07-24 UTC

Benchmark: `neurowave_product_benchmark_v1` (36 fixed NWSD-v1 benchmark cases)
Status: objective baseline and blind listening review complete.

| Checkpoint | Mean weighted distance | Median | Maximum | Failed renders |
| --- | ---: | ---: | ---: | ---: |
| `v3.4_audible_loss` | 24.010 | 12.913 | 219.169 | 0 |
| `v3.5_noise_detune_loss` | 33.267 | 14.239 | 262.160 | 0 |

| Category | v3.4 mean | v3.5 mean | v3.5 minus v3.4 |
| --- | ---: | ---: | ---: |
| Wave identity | 10.056 | 48.696 | +38.639 |
| Pitched detune | 18.430 | 15.248 | -3.182 |
| Audible noise | 60.243 | 62.199 | +1.957 |
| Quiet mix | 27.072 | 23.407 | -3.665 |
| Envelope extreme | 15.043 | 39.174 | +24.131 |
| Filter/resonance extreme | 13.215 | 10.879 | -2.336 |

Negative deltas favour v3.5. It improves pitched detune, quiet mixes, and filter/resonance
extremes, but does not improve the targeted audible-noise slice and has material waveform and
envelope regressions on this product benchmark. The benchmark therefore does not support
promoting v3.5 over v3.4 on objective product-benchmark evidence alone.

## Blind listening result

The balanced 12-case A/B review was unblinded after scoring. v3.4 received 6 overall
preferences, v3.5 received 3, and 3 cases tied. Mean timbre scores were `4.75` for v3.4 and
`4.67` for v3.5; both received a mean envelope score of `5.00`.

The review agrees with the objective result in the audible-noise, envelope, and waveform
identity slices: v3.5 did not improve the intended noise behavior, and its waveform/timbre
regressions were audible. The listener also identified recurring pitch-alignment and
brightness/harmonic mismatch issues. The review is deliberately small, so it does not justify
an automatic public-checkpoint rollback; it does make v3.4 the control checkpoint for the
next experiment.

## Next experiment decision

Train one loss-only ablation: keep v3.5's architecture, data, optimizer, random seed, and
noise-detune suppression, but remove its additional audible-noise waveform-classification
boost. This isolates the unproven component most plausibly associated with the v3.5 waveform
and timbre regressions. Evaluate the resulting checkpoint against both v3.4 and v3.5 on the
unchanged 2,000-clip NWSD-v1 benchmark and this product benchmark before any promotion.

The local ignored reports and completed listening-review evidence are retained in
`runs/nwsd_v1/evaluation/archive/product_benchmark_v1_v3_4_v3_5_20260724/`. Regenerable
target/prediction WAV and copied patch artifacts were intentionally pruned after review.

## v3.6 objective gate

The single-variable `v3.6_noise_detune_ablation` experiment completed with v3.5's
noise-detune suppression retained and only its audible-noise waveform boost removed. Training
used the fixed 500,000-clip NWSD-v1 train partition and 10,000-clip development partition;
the best checkpoint was epoch 41 with development MAE `0.05490` and waveform accuracy
`0.9106`.

| Checkpoint | NWSD-v1 mean | NWSD-v1 median | NWSD-v1 maximum | Product mean | Product median |
| --- | ---: | ---: | ---: | ---: | ---: |
| `v3.4_audible_loss` | 30.031 | 10.957 | 1034.783 | 24.010 | 12.913 |
| `v3.5_noise_detune_loss` | 29.828 | 9.966 | 957.497 | 33.267 | 14.239 |
| `v3.6_noise_detune_ablation` | **26.288** | **9.849** | **699.287** | **20.738** | **8.841** |

v3.6 is the objective winner on both frozen benchmarks and has zero failed renders. It improves
product detune, audible noise, quiet mixes, and filter/resonance over v3.4, while wave identity
and envelope-extreme category means remain worse. A fresh balanced blind v3.4-versus-v3.6
listening review is required before promoting it to the app checkpoint.

## v3.6 blind review and promotion decision

The completed balanced 12-case v3.4-versus-v3.6 blind review gave v3.6 five preferences,
v3.4 two, and five ties. v3.6 received mean timbre and envelope scores of `5.00`; v3.4 scored
`4.92` and `5.00` respectively. The listener preferred v3.6 in both quiet-mix cases, one
audible-noise case, one pitched-detune case, and one filter/resonance case; wave identity and
envelope cases tied.

Decision: **promote v3.6 as the research-approved next app checkpoint.** It satisfies the
objective and listening gates without a material listening regression in the two objective
product categories where it remains weaker. The public v3.5 release is unchanged until an
explicitly approved app-model, packaging, and release update is completed.

The local ignored v3.6 objective reports and completed review evidence are retained in
`runs/nwsd_v1/evaluation/archive/product_benchmark_v1_v3_4_v3_6_20260726/`; regenerated
WAV/patch caches and quiet evaluator logs were pruned after review.
