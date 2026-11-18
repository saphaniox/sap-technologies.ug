import AwardsAdmin from "../../AwardsAdmin";
// Presentational admin view; state and actions are supplied by the dashboard.
export default function AwardsTab() {
  return <div className="tab-panel">
              <AwardsAdmin />
            </div>;
}
