export type UserRole = 'ADMIN' | 'STAFF' | 'USER';

export interface UserPermissions {
  canAddText: boolean;
  canEditText: boolean;
  canUpdateImage: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  permissions: UserPermissions;
  status: 'active' | 'inactive';
  last_login?: string;
}

export interface PKModule {
  id: string;
  name_pk: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PKText {
  id: string;
  pk_id: string;
  title?: string;
  text: string;
  image_url?: string;
  image_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ActivityLog {
  id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  target_pk: string;
  details?: string;
  timestamp: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
