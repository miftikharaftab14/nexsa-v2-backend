export enum InvitationStatus {
  PENDING = 'PENDING',
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum InvitationMethod {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export enum InvitationType {
  LINK = 'LINK',
  NORMAL = 'NORMAL',
}

export enum InvitationRecipient {
  CUSTOMER = 'CUSTOMER',
  SELLER = 'SELLER',
}