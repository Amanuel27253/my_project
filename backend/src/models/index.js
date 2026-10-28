// Central Mongoose Model Registry
// Pre-loads and registers all schemas with Mongoose to prevent MissingSchemaError on cross-model population

const Location = require('./Location');
const User = require('./User');
const Goods = require('./Goods');
const Inventory = require('./Inventory');
const StockLevel = require('./StockLevel');
const StockMovement = require('./StockMovement');
const StockRequest = require('./StockRequest');
const StockTransfer = require('./StockTransfer');
const Beneficiary = require('./Beneficiary');
const QuotaRule = require('./QuotaRule');
const QuotaBalance = require('./QuotaBalance');
const Distribution = require('./Distribution');
const Alert = require('./Alert');
const AuditLog = require('./AuditLog');
const Counter = require('./Counter');
const Notification = require('./Notification');
const Setting = require('./Setting');

module.exports = {
  Location,
  User,
  Goods,
  Inventory,
  StockLevel,
  StockMovement,
  StockRequest,
  StockTransfer,
  Beneficiary,
  QuotaRule,
  QuotaBalance,
  Distribution,
  Alert,
  AuditLog,
  Counter,
  Notification,
  Setting
};
