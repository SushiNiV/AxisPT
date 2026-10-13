require('dotenv').config();
const HistoryModel = require('./models/historyModel');

console.log('getHistoryLogs is a:', typeof HistoryModel.getHistoryLogs);

(async () => {
  const rows = await HistoryModel.getHistoryLogs({ limit: 3 });
  console.log(rows);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });