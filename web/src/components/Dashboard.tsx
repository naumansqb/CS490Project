"use client";

import JobStatisticsDashboard from "./jobs/JobsAnalytics";
import UpcomingDeadlines from "./jobs/UpComingDeadlines";

export default function Dashboard() {
  return (
    <div>
      <UpcomingDeadlines />
      <JobStatisticsDashboard />
    </div>

  );
}
