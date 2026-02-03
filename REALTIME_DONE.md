# Milestone: Real-Time Chat Functional

The basic real-time loop is implemented:
1.  **Frontend**: 
    -   `SocketProvider` connects to Backend Gateway.
    -   `ChatInput` emits `send-message`.
    -   `ChatMessages` joins channel and listens for `new-message`.
2.  **Backend**:
    -   `SocketGateway` receives, saves to DB (Prisma), and broadcasts to channel room.

**How to Verify (Once DB is running):**
1.  Open two browser windows/tabs.
2.  Login as different users (or same).
3.  Go to the same server/channel.
4.  Type a message. It should appear instantly in both windows.

**Note**: Infinite scroll (fetching history) is not implemented yet. Messages disappear on refresh (because fetching internal history API is not hooked up to `ChatMessages` yet, only socket listener).

**Next Steps**:
- Implement **Message History Fetching** (REST API).
- Implement **Infinite Scroll**.
