-- ============================================================
-- ROOTINE OS — 0005 Milestone weights
-- Each milestone may carry an explicit % weight. NULL = auto (equal
-- split of the remaining percentage among auto milestones). Goal
-- progress is derived from milestones and persisted to goals.progress.
-- ============================================================

alter table public.milestones add column weight int;
alter table public.milestones
  add constraint milestones_weight_range check (weight is null or weight between 0 and 100);
