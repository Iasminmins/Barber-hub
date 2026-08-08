export function ownerPhoneReminderStorageKey(memberId: string) {
  return `meubarberhub:owner-phone-reminder-dismissed:${memberId}`
}

export function shouldShowOwnerPhoneReminder(phone: string | null | undefined, dismissed: boolean) {
  return !dismissed && !phone?.trim()
}
