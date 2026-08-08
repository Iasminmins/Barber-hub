import { describe, expect, it } from 'vitest'
import { ownerPhoneReminderStorageKey, shouldShowOwnerPhoneReminder } from './owner-phone-reminder'

describe('owner phone reminder', () => {
  it('shows only when the owner has no phone and has not dismissed it', () => {
    expect(shouldShowOwnerPhoneReminder('', false)).toBe(true)
    expect(shouldShowOwnerPhoneReminder(null, false)).toBe(true)
    expect(shouldShowOwnerPhoneReminder('(24) 99836-9828', false)).toBe(false)
    expect(shouldShowOwnerPhoneReminder('', true)).toBe(false)
  })

  it('uses a member-specific dismissal key', () => {
    expect(ownerPhoneReminderStorageKey('member-1')).toBe('meubarberhub:owner-phone-reminder-dismissed:member-1')
  })
})
