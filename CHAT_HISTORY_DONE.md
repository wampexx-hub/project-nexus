# Milestone: Chat History & Infinite Scroll

I have upgraded the Chat System:
1.  **Backend**: `GET /api/messages` now serves message history with cursor pagination.
2.  **Frontend**:
    -   Replaced simple state with **React Query**.
    -   Implemented **Infinite Scroll** (via "Load previous" button for now).
    -   Implemented **Real-time Integration**: Socket messages are magically spliced into the history list.

**How to Test:**
1.  Refresh the page. You should see old messages loaded from the DB.
2.  Send a new message. It appears instantly.
3.  Click "Load previous messages" if you have > 10 messages.

**Optimization Note**: Currently, `useChatSocket` handles live updates efficiently.

**Next Steps**:
- Implement **Automatic Scroll & Intersection Observer** (Auto-load on scroll).
