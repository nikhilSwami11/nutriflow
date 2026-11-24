import { dashboardFromLogs, type DashboardData, type DashboardRepository } from "@/domain/dashboard";
import { getTargetRange, lastNDays, type MealLogRepository, type ProfileRepository } from "@/domain/nutrition";

/** The signed-in person's dashboard, built from their own meal logs and calorie range. No demo numbers. */
export class LogDashboardRepository implements DashboardRepository {
  constructor(
    private logs: MealLogRepository,
    private profile: ProfileRepository,
  ) {}

  async get(): Promise<DashboardData> {
    const today = new Date();
    const dates = lastNDays(30, today);
    const [logs, range] = await Promise.all([this.logs.listBetween(dates[0], dates[dates.length - 1]), getTargetRange(this.profile)]);
    return dashboardFromLogs(logs, today, range);
  }
}
