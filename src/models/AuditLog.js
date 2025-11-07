'use strict';

class AuditLog {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.action = data.action;
    this.resource_type = data.resource_type;
    this.resource_id = data.resource_id;
    this.details = data.details ? JSON.parse(data.details) : null;
    this.created_at = data.created_at;
  }

  static createLog(userId, action, resourceType, resourceId = null, details = null) {
    return {
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details ? JSON.stringify(details) : null,
      created_at: new Date().toISOString()
    };
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      action: this.action,
      resource_type: this.resource_type,
      resource_id: this.resource_id,
      details: this.details,
      created_at: this.created_at
    };
  }
}

module.exports = AuditLog;