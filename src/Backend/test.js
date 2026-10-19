const { getLiveStats } = require('./services/rag/liveStats');

getLiveStats({ programIds: [1,2,3,4,5], isAdmin: true })
  .then(r => console.log(JSON.stringify(r, null, 2)));