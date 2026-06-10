import { db } from '@/lib/db';

export async function logActivity(params: {
  userId?: string;
  userName: string;
  userRole: string;
  activityType: string;
  details?: string;
}) {
  try {
    await db.activityLog.create({
      data: {
        user_id: params.userId || null,
        user_name: params.userName,
        user_role: params.userRole,
        activity_type: params.activityType,
        details: params.details || null,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export async function logStudentAudit(params: {
  studentId: string;
  changedById?: string;
  changedByName: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
}) {
  try {
    await db.studentAuditLog.create({
      data: {
        student_id: params.studentId,
        changed_by_id: params.changedById || null,
        changed_by_name: params.changedByName,
        field_name: params.fieldName,
        old_value: params.oldValue || null,
        new_value: params.newValue || null,
      },
    });
  } catch (error) {
    console.error('Failed to log student audit:', error);
  }
}

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: string;
}) {
  try {
    await db.notification.create({
      data: {
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        is_read: false,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
