import { NOT_REPORTED } from "../utils/dashboardFormatters";
import { formatDashboardNumber } from "../utils/dashboardFormatters";
import { formatDateTime } from "../utils/dashboardFormatters";
import { formatMetricValue } from "../utils/dashboardFormatters";
import { getHealthValue } from "../utils/dashboardFormatters";
import { getStatusClass } from "../utils/dashboardFormatters";
// Presentational admin view; state and actions are supplied by the dashboard.
export default function OperationsCenter({
  dashboardStats,
  formatCpuLoad,
  formatMemoryPair,
  formatStatusLabel,
  formatStoragePair,
  formatUptime,
  getEmailDelivery,
  getStatusValue,
  normalizeCollections,
  renderDetailRow,
  renderOpsMetric,
  systemHealth,
  systemHealthFetchedAt
}) {
  const stats = dashboardStats?.stats || {};
  const emailDelivery = getEmailDelivery();
  const processMemory = getHealthValue(systemHealth, ["process.memory", "runtime.memory", "memory"], null);
  const systemMemory = getHealthValue(systemHealth, ["system.memory", "host.memory", "os.memory", "ram"], null);
  const mongodbStorage = getHealthValue(systemHealth, ["mongodb.storage", "mongo.storage", "database.storage", "atlas.storage", "storage"], null);
  const collectionRows = normalizeCollections(getHealthValue(systemHealth, ["database.collections", "mongodb.collections", "mongo.collections", "collections"], []));
  const reportedServerStatus = getStatusValue(["server.status", "status", "health", "server"]);
  const serverStatus = reportedServerStatus === NOT_REPORTED && systemHealth ? "Online" : reportedServerStatus;
  const databaseStatus = getStatusValue(["database.status", "database.connection", "database.state", "mongodb.status", "mongo.status", "database"]);
  const clusterStatus = getStatusValue(["cluster.status", "mongodb.cluster.status", "atlas.clusterStatus", "atlas.status"]);
  const backupStatus = getStatusValue(["backup.status", "database.backup.status", "backups.status"]);
  const uptime = getHealthValue(systemHealth, ["uptime", "server.uptime", "process.uptime"], null);
  const cpuLoad = getHealthValue(systemHealth, ["cpu.load", "cpu.usage", "system.cpu.load", "host.cpu.load", "loadAverage"], NOT_REPORTED);
  const nodeVersion = getHealthValue(systemHealth, ["nodeVersion", "node.version", "runtime.nodeVersion"], NOT_REPORTED);
  const hostSystem = getHealthValue(systemHealth, ["host.name", "host.hostname", "server.host", "hostname"], NOT_REPORTED);
  const platform = getHealthValue(systemHealth, ["host.platform", "system.platform", "os.platform", "platform"], NOT_REPORTED);
  const apiLatency = getHealthValue(systemHealth, ["api.latency", "server.latency", "latency"], NOT_REPORTED);
  const visitorsOnline = getHealthValue(systemHealth, ["visitors.online", "traffic.online", "analytics.onlineVisitors"], NOT_REPORTED);
  const visitorsToday = getHealthValue(systemHealth, ["visitors.today", "traffic.today", "analytics.today"], NOT_REPORTED);
  const totalVisitors = getHealthValue(systemHealth, ["visitors.total", "traffic.total", "analytics.totalVisitors"], stats.totalVisitors ?? NOT_REPORTED);
  const databaseName = getHealthValue(systemHealth, ["database.name", "mongodb.database", "mongo.database", "dbName"], NOT_REPORTED);
  const clusterName = getHealthValue(systemHealth, ["cluster.name", "mongodb.cluster.name", "atlas.clusterName"], NOT_REPORTED);
  const lastBackup = getHealthValue(systemHealth, ["backup.lastRun", "backup.lastBackupAt", "backups.lastRun"], NOT_REPORTED);
  const nextBackup = getHealthValue(systemHealth, ["backup.nextRun", "backup.nextBackupAt", "backups.nextRun"], NOT_REPORTED);
  const processId = getHealthValue(systemHealth, ["process.pid", "pid"], NOT_REPORTED);
  const cpuCores = getHealthValue(systemHealth, ["cpu.cores", "system.cpu.cores", "host.cpu.cores"], NOT_REPORTED);
  const ramUsage = formatMemoryPair(systemMemory, ["used", "usedBytes", "active"], ["total", "totalBytes"]);
  const processMemoryUsage = formatMemoryPair(processMemory);
  const storageUsage = formatStoragePair(mongodbStorage);
  const hasCollections = collectionRows.length > 0;
  return <section className="admin-ops-center">
        <div className="ops-header">
          <div>
            <span className="ops-eyebrow">Platform control room</span>
            <h3>Operations Center</h3>
            <p>Track server health, database readiness, backups, traffic and host resources from one professional admin view.</p>
          </div>
          <div className="ops-refresh-pill">
            <span className={`ops-status-dot ${getStatusClass(serverStatus)}`} />
            <div>
              <span>Last refreshed</span>
              <strong>{systemHealthFetchedAt ? formatDateTime(systemHealthFetchedAt) : NOT_REPORTED}</strong>
            </div>
          </div>
        </div>

        <div className="ops-metrics-grid">
          {renderOpsMetric({
        label: "Server Status",
        value: serverStatus,
        detail: hostSystem,
        status: serverStatus,
        accent: "green"
      })}
          {renderOpsMetric({
        label: "Database",
        value: databaseStatus,
        detail: databaseName,
        status: databaseStatus,
        accent: "blue"
      })}
          {renderOpsMetric({
        label: "Server Uptime",
        value: uptime !== null ? formatUptime(uptime) : NOT_REPORTED,
        detail: "Process runtime",
        accent: "violet"
      })}
          {renderOpsMetric({
        label: "Cluster Status",
        value: clusterStatus,
        detail: clusterName,
        status: clusterStatus,
        accent: "cyan"
      })}
          {renderOpsMetric({
        label: "CPU Load",
        value: formatCpuLoad(cpuLoad),
        detail: `${formatMetricValue(cpuCores)} CPU cores`,
        accent: "amber"
      })}
          {renderOpsMetric({
        label: "System RAM",
        value: ramUsage,
        detail: platform,
        accent: "slate"
      })}
          {renderOpsMetric({
        label: "Process Memory",
        value: processMemoryUsage,
        detail: `PID ${formatMetricValue(processId)}`,
        accent: "indigo"
      })}
          {renderOpsMetric({
        label: "MongoDB Atlas Storage",
        value: storageUsage,
        detail: "Storage used / limit",
        accent: "teal"
      })}
          {renderOpsMetric({
        label: "Backup Status",
        value: backupStatus,
        detail: `Last: ${formatDateTime(lastBackup)}`,
        status: backupStatus,
        accent: "green"
      })}
          {renderOpsMetric({
        label: "Visitors Online",
        value: visitorsOnline,
        detail: `${formatMetricValue(visitorsToday)} today`,
        accent: "pink"
      })}
          {renderOpsMetric({
        label: "Email Delivery",
        value: emailDelivery.activeProviderLabel || NOT_REPORTED,
        detail: emailDelivery.deliveryChainLabel,
        status: emailDelivery.canSend ? "online" : "offline",
        accent: "blue"
      })}
        </div>

        <div className="ops-panels-grid">
          <article className="ops-panel">
            <div className="ops-panel-header">
              <h4>Server Runtime</h4>
              <span className={`ops-status-badge ${getStatusClass(serverStatus)}`}>{formatMetricValue(serverStatus)}</span>
            </div>
            {renderDetailRow("Host system", hostSystem)}
            {renderDetailRow("Platform", platform)}
            {renderDetailRow("Node.js", nodeVersion)}
            {renderDetailRow("Process ID", processId)}
            {renderDetailRow("Uptime", uptime !== null ? formatUptime(uptime) : NOT_REPORTED)}
            {renderDetailRow("API latency", apiLatency)}
          </article>

          <article className="ops-panel">
            <div className="ops-panel-header">
              <h4>Database & Collections</h4>
              <span className={`ops-status-badge ${getStatusClass(databaseStatus)}`}>{formatMetricValue(databaseStatus)}</span>
            </div>
            {renderDetailRow("Database name", databaseName)}
            {renderDetailRow("Atlas cluster", clusterName)}
            {renderDetailRow("Atlas storage", storageUsage)}
            <div className="ops-collection-list">
              {hasCollections ? collectionRows.slice(0, 6).map(collection => <div className="ops-collection-row" key={collection.name || collection.collection || collection._id}>
                  <span>{collection.name || collection.collection || "Collection"}</span>
                  <strong>{formatDashboardNumber(collection.count ?? collection.documents ?? collection.size ?? 0)}</strong>
                </div>) : <div className="ops-empty-state">Collection telemetry is not reported yet.</div>}
            </div>
          </article>

          <article className="ops-panel">
            <div className="ops-panel-header">
              <h4>Data Management & Backup</h4>
              <span className={`ops-status-badge ${getStatusClass(backupStatus)}`}>{formatMetricValue(backupStatus)}</span>
            </div>
            {renderDetailRow("Users", stats.totalUsers || 0)}
            {renderDetailRow("Products", stats.totalProducts || 0)}
            {renderDetailRow("Services", stats.totalServices || 0)}
            {renderDetailRow("Projects", stats.totalProjects || 0)}
            {renderDetailRow("Gallery items", stats.totalGalleryItems || 0)}
            {renderDetailRow("Job posts", stats.totalJobs || 0)}
            {renderDetailRow("Job applications", stats.totalJobApplications || 0)}
            {renderDetailRow("Last backup", formatDateTime(lastBackup))}
            {renderDetailRow("Next backup", formatDateTime(nextBackup))}
          </article>

          <article className="ops-panel">
            <div className="ops-panel-header">
              <h4>Visitors & Traffic</h4>
              <span className="ops-status-badge unknown">Analytics</span>
            </div>
            {renderDetailRow("Online now", visitorsOnline)}
            {renderDetailRow("Visitors today", visitorsToday)}
            {renderDetailRow("Total visitors", totalVisitors)}
            {renderDetailRow("Contact messages", stats.totalContacts || 0)}
            {renderDetailRow("Product inquiries", stats.totalProductInquiries || 0)}
            {renderDetailRow("Service quotes", stats.totalServiceQuotes || 0)}
          </article>

          <article className="ops-panel">
            <div className="ops-panel-header">
              <h4>Email Delivery</h4>
              <span className={`ops-status-badge ${emailDelivery.canSend ? "online" : "offline"}`}>
                {emailDelivery.canSend ? "Ready" : "Missing"}
              </span>
            </div>
            {renderDetailRow("Mode", formatStatusLabel(emailDelivery.mode || "auto"))}
            {renderDetailRow("Active provider", emailDelivery.activeProviderLabel || NOT_REPORTED)}
            {renderDetailRow("Delivery chain", emailDelivery.deliveryChainLabel || NOT_REPORTED)}
            {renderDetailRow("Mailjet", emailDelivery.configured?.mailjet ? "Configured" : "Missing keys", emailDelivery.configured?.mailjet ? "online" : "offline")}
            {renderDetailRow("Gmail SMTP", emailDelivery.configured?.gmail ? "Configured" : "Missing credentials", emailDelivery.configured?.gmail ? "online" : "offline")}
          </article>
        </div>
      </section>;
}
