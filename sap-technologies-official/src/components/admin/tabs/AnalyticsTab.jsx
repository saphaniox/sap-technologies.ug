import VisitorAnalytics from "../../VisitorAnalytics";
// Presentational admin view; state and actions are supplied by the dashboard.
export default function AnalyticsTab() {
  return <div className="tab-panel">
              <VisitorAnalytics />
            </div>;
}
