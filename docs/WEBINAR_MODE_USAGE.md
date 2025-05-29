# RoasFlow Webinar Mode – User & Developer Guide  
*Version 1.0 – May 2025*

---

## Table of Contents
1. Overview  
2. Feature Matrix  
3. Quick-start for Hosts  
4. Participant Experience  
5. API & SDK Reference  
6. Analytics Events  
7. Troubleshooting & FAQ  
8. Glossary  

---

## 1. Overview
Webinar Mode transforms a regular RoasFlow meeting into a **one-to-many broadcast**:

| Role            | Default A/V rights | Can request rights | Can grant rights |
|-----------------|--------------------|--------------------|------------------|
| Host            | ✅ Full            | —                  | ✅ |
| Participant     | ❌ None            | ✅                 | — |
| Guest / Viewer  | ❌ None            | ✅ *(audio only)*  | — |

Switching **back** to Meeting Mode restores everyone’s self-mute/unmute freedom.

---

## 2. Feature Matrix
| Capability                         | Meeting Mode | Webinar Mode |
|------------------------------------|--------------|--------------|
| Everyone can unmute / start video  | ✅            | ❌ (*host only*) |
| Screen-share for all               | ✅            | ❌ (*host only*) |
| Raise hand / permission request    | ✅            | ✅ |
| Promote / demote participant       | Host only    | Host only |
| Bulk-mute participants             | Host only    | Auto-muted |
| Webinar analytics                  | —            | ✅ |

---

## 3. Quick-start for Hosts

### 3.1 Enabling Webinar Mode
1. Join the meeting as **host**.  
2. Locate the **Webinar Mode** toggle (top-right).  
3. Click the switch → it turns sky-blue → toast *“Webinar mode enabled”*.  
   • All non-host participants are instantly **muted**.  
   • Meeting header shows **“Webinar”** badge.

### 3.2 Granting Specific Permissions
1. Open **Participants ➜ Manage**.  
2. Locate the attendee.  
3. From the drop-down choose  
   • *Grant Audio* – allow user to unmute.  
   • *Grant Video* – allow camera.  
4. Revoke by “Mute”, or switch back to Meeting Mode.

### 3.3 Promoting to Co-host
`Manage → Promote to Host` – user gets full controls (including webinar toggle).

### 3.4 Disabling Webinar Mode
Toggle off → toast *“Meeting mode enabled”*.  
Participants remain muted **until they unmute themselves** (avoids audio blast).

---

## 4. Participant Experience

| State | UI Behaviour |
|-------|--------------|
| Webinar enabled | Mic & Camera buttons show **lock** icon. |
| Request mic     | Click mic → dialog “Ask host to speak?” |
| Host grants     | Controls unlock, toast “You can speak now”. |
| Host mutes      | Buttons greyed, toast “You were muted by host”. |

---

## 5. API & SDK Reference

### 5.1 Toggle Webinar Mode (Host)

```ts
await call.update({
  settings: {
    permissions: webinarPermissions(true),        // helper shown below
    custom: { isWebinarMode: true }
  }
});

// Helper
function webinarPermissions(enabled: boolean) {
  if (enabled) {
    return [
      { role:'host', name:'send-audio' },
      { role:'host', name:'send-video' },
      { role:'host', name:'screenshare' },
      { role:'participant', name:'create-reaction' },
      { role:'participant', name:'request-permission' },
      { role:'guest', name:'request-permission' },
    ];
  }
  // Meeting mode → everyone can publish
  return [
    { role:'host', name:'send-audio' },
    { role:'participant', name:'send-audio' },
    { role:'guest', name:'send-audio' },
    // …repeat for video/screenshare
  ];
}
```

### 5.2 Bulk-mute on Enable
```ts
for (const p of call.participants.values()) {
  if (!p.roles?.includes('host')) {
    await call.muteUser({ userId: p.userId, audioMuted: true });
  }
}
```

### 5.3 Grant / Revoke Permissions
```ts
// Grant mic
await call.grantPermissions({
  user_id: targetUserId,
  permissions: ['send-audio'],
});
// Revoke by mute
await call.muteUser({ userId: targetUserId, audioMuted: true });
```

### 5.4 Listen for Permission Requests
```ts
call.on('call.permission_request', ev => {
  const { user, permission } = ev.permission_request;
  // Show UI to host → allow / deny
});
```

---

## 6. Analytics Events

| Event                       | Payload keys |
|-----------------------------|--------------|
| `webinar:mode_toggle`       | `enabled`, `meetingId`, `userId`, `participantCount` |
| `webinar:participant_management` | `action` (`mute` / `grantAudio` / …), `targetUserId` |
| `webinar:mode_detected`     | Auto-fired for joiners when webinar is active |

These events feed Sentry breadcrumbs and Vercel Analytics.

---

## 7. Troubleshooting & FAQ

| Issue / Question | Solution |
|------------------|----------|
| Participant still audible after toggle | They joined as **host** earlier. Demote via *Manage ➜ Demote*. |
| “You do not have permission” error | Only users with `UPDATE_CALL_SETTINGS` capability see the toggle. Check roles. |
| Echo/feedback in webinar | Use **mute all** and advise speakers to wear headsets. |
| Can guests request video? | Audio yes, video only if host grants `send-video`. |
| How to auto-record webinars? | Create meeting with `recording.mode = "automatic"` before enabling webinar. |

---

## 8. Glossary
* **Host** – user with `host` role; full moderation rights.  
* **Participant** – authenticated user invited to meeting.  
* **Guest** – anonymous user joining via link.  
* **Permission Request** – real-time event fired when muted user clicks mic/camera in webinar mode.  

---

**Happy broadcasting with RoasFlow!**  
For feedback or issues, open a ticket in the `#roasflow-support` Slack channel or file a GitHub issue.  
