// Presentational admin view; state and actions are supplied by the dashboard.
export default function OperationsTab({
  renderOperationsCenter
}) {
  return <div className="tab-panel">
              {renderOperationsCenter()}
            </div>;
}
