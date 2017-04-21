const JobStates = {
  PENDING: "PENDING",
  WAITING: "WAITING",
  WAITING_FAILED: "WAITING_FAILED",
  BLOCKED: "BLOCKED",
  BLOCKED_FAILED: "BLOCKED_FAILED",
  UNBLOCKED: "UNBLOCKED",
  UNBLOCKED_FAILED: "UNBLOCKED_FAILED",
  SCHEDULED: "SCHEDULED",
  ASSIGNED: "ASSIGNED",
  ACCEPTED: "ACCEPTED",
  RUNNING: "RUNNING",
  FINISHED: "FINISHED",
  CANCELING: "CANCELING",
  CANCELED: "CANCELED",
  TIMING_OUT: "TIMING_OUT",
  TIMED_OUT: "TIMED_OUT",
  SKIPPED: "SKIPPED",
  BROKEN: "BROKEN",
  THROTTLED: "THROTTLED"
};

export default JobStates;
