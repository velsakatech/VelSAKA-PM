import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  Users,
  MessageSquare,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "./AdminLayout";
import { useAuth } from "../../context/AuthContext";

import socket from "../../socket/socket";

const USERS_API_URL =
  "http://localhost:5000/api/users";

const CHAT_API_URL =
  "http://localhost:5000/api/chat";

const AdminChat = () => {
  const { userId } = useParams();

  const navigate = useNavigate();

  const { user, authLoading } = useAuth();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // =========================================================
  // CURRENT ADMIN MONGODB ID
  // =========================================================

  const currentAdminId =
    user?._id ||
    user?.id ||
    null;

  // =========================================================
  // STATE
  // =========================================================

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [loadingUsers, setLoadingUsers] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sendingMessage, setSendingMessage] =
    useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================================================
  // DEBUG
  // =========================================================

  useEffect(() => {
    console.log(
      "================================="
    );

    console.log("ADMIN CHAT");

    console.log(
      "Admin User:",
      user
    );

    console.log(
      "Admin MongoDB ID:",
      currentAdminId
    );

    console.log(
      "Selected User ID:",
      userId
    );

    console.log(
      "Socket Connected:",
      socket.connected
    );

    console.log(
      "================================="
    );
  }, [
    user,
    currentAdminId,
    userId,
  ]);

  // =========================================================
  // JOIN ADMIN PERSONAL SOCKET ROOM
  // =========================================================

  useEffect(() => {
    if (!currentAdminId) return;

    const joinRoom = () => {
      console.log(
        "ADMIN JOINING SOCKET ROOM:",
        currentAdminId
      );

      socket.emit(
        "join_user",
        String(currentAdminId)
      );
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on(
      "connect",
      joinRoom
    );

    return () => {
      socket.off(
        "connect",
        joinRoom
      );
    };
  }, [currentAdminId]);

  // =========================================================
  // RECEIVE SOCKET MESSAGES
  // =========================================================

  useEffect(() => {
    if (!currentAdminId) return;

    const handleIncomingMessage = (
      newMessage
    ) => {
      console.log(
        "ADMIN RECEIVED SOCKET MESSAGE:",
        newMessage
      );

      const senderId =
        newMessage?.senderId?._id ||
        newMessage?.senderId;

      const receiverId =
        newMessage?.receiverId?._id ||
        newMessage?.receiverId;

      if (!senderId || !receiverId) {
        return;
      }

      // -----------------------------------------------------
      // Check whether this message belongs to
      // the currently opened conversation
      // -----------------------------------------------------

      if (!userId) return;

      const belongsToConversation =
        (
          String(senderId) ===
            String(currentAdminId) &&
          String(receiverId) ===
            String(userId)
        ) ||
        (
          String(senderId) ===
            String(userId) &&
          String(receiverId) ===
            String(currentAdminId)
        );

      if (!belongsToConversation) {
        console.log(
          "Message belongs to another conversation."
        );

        return;
      }

      const formattedMessage = {
        id:
          newMessage._id,

        sender:
          String(senderId) ===
          String(currentAdminId)
            ? "admin"
            : "user",

        text:
          newMessage.message,

        time:
          formatMessageTime(
            newMessage.createdAt
          ),

        status:
          newMessage.read
            ? "read"
            : "sent",
      };

      setMessages(
        (previous) => {
          const exists =
            previous.some(
              (item) =>
                String(item.id) ===
                String(formattedMessage.id)
            );

          if (exists) {
            return previous;
          }

          return [
            ...previous,
            formattedMessage,
          ];
        }
      );
    };

    socket.on(
      "new_message",
      handleIncomingMessage
    );

    socket.on(
      "message_sent",
      handleIncomingMessage
    );

    return () => {
      socket.off(
        "new_message",
        handleIncomingMessage
      );

      socket.off(
        "message_sent",
        handleIncomingMessage
      );
    };
  }, [
    currentAdminId,
    userId,
  ]);

  // =========================================================
  // SOCKET ERROR
  // =========================================================

  useEffect(() => {
    const handleSocketError = (
      socketError
    ) => {
      console.error(
        "SOCKET MESSAGE ERROR:",
        socketError
      );

      setSendingMessage(false);

      setError(
        socketError?.message ||
          "Failed to send message."
      );
    };

    socket.on(
      "message_error",
      handleSocketError
    );

    return () => {
      socket.off(
        "message_error",
        handleSocketError
      );
    };
  }, []);

  // =========================================================
  // LOAD USERS
  // =========================================================

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      setError("");

      const response =
        await fetch(
          USERS_API_URL
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load users."
        );
      }

      const loadedUsers =
        data.users || [];

      const teamUsers =
        loadedUsers.filter(
          (item) =>
            item.accessRole !==
            "admin"
        );

      setUsers(teamUsers);

      const selected =
        teamUsers.find(
          (item) =>
            String(item._id) ===
            String(userId)
        );

      setSelectedUser(
        selected || null
      );
    } catch (error) {
      console.error(
        "LOAD USERS ERROR:",
        error
      );

      setError(
        error.message ||
          "Unable to load users."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // =========================================================
  // LOAD OLD MESSAGES
  // =========================================================

  const loadMessages = async () => {
    if (!userId) {
      setMessages([]);
      return;
    }

    if (!currentAdminId) {
      setError(
        "Admin MongoDB ID is missing."
      );

      return;
    }

    try {
      setLoadingMessages(true);

      setError("");

      console.log(
        "LOADING OLD CHAT:",
        currentAdminId,
        "<->",
        userId
      );

      const response =
        await fetch(
          `${CHAT_API_URL}/${userId}`,
          {
            method: "GET",

            headers: {
              "Content-Type":
                "application/json",

              "x-user-id":
                currentAdminId,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load messages."
        );
      }

      const formattedMessages =
        (data.messages || []).map(
          (item) => {
            const senderId =
              item.senderId?._id ||
              item.senderId;

            return {
              id:
                item._id,

              sender:
                String(senderId) ===
                String(currentAdminId)
                  ? "admin"
                  : "user",

              text:
                item.message,

              time:
                formatMessageTime(
                  item.createdAt
                ),

              status:
                item.read
                  ? "read"
                  : "sent",
            };
          }
        );

      setMessages(
        formattedMessages
      );
    } catch (error) {
      console.error(
        "LOAD MESSAGES ERROR:",
        error
      );

      setError(
        error.message ||
          "Unable to load messages."
      );
    } finally {
      setLoadingMessages(false);
    }
  };

  // =========================================================
  // INITIAL USERS LOAD
  // =========================================================

  useEffect(() => {
    if (authLoading) return;

    if (!currentAdminId) {
      setError(
        "Admin MongoDB ID is missing from your session."
      );

      setLoadingUsers(false);

      return;
    }

    loadUsers();
  }, [
    authLoading,
    currentAdminId,
    userId,
  ]);

  // =========================================================
  // LOAD CHAT WHEN USER CHANGES
  // =========================================================

  useEffect(() => {
    if (authLoading) return;

    if (!currentAdminId) return;

    if (!userId) {
      setMessages([]);
      return;
    }

    loadMessages();
  }, [
    authLoading,
    currentAdminId,
    userId,
  ]);

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // =========================================================
  // FILTER USERS
  // =========================================================

  const filteredUsers =
    useMemo(() => {
      const search =
        searchTerm
          .toLowerCase()
          .trim();

      if (!search) {
        return users;
      }

      return users.filter(
        (item) =>
          item.name
            ?.toLowerCase()
            .includes(search) ||
          item.email
            ?.toLowerCase()
            .includes(search) ||
          item.jobRole
            ?.toLowerCase()
            .includes(search) ||
          item.department
            ?.toLowerCase()
            .includes(search)
      );
    }, [
      users,
      searchTerm,
    ]);

  // =========================================================
  // SELECT USER
  // =========================================================

  const handleSelectUser = (
    selected
  ) => {
    setSelectedUser(
      selected
    );

    setMessages([]);

    setError("");

    setMobileSidebarOpen(
      false
    );

    navigate(
      `/admin/chat/${selected._id}`
    );
  };

  // =========================================================
  // SEND MESSAGE THROUGH SOCKET
  // =========================================================

  const handleSendMessage =
    () => {
      const text =
        message.trim();

      if (!text) {
        return;
      }

      if (!selectedUser) {
        setError(
          "Please select a user."
        );

        return;
      }

      if (!currentAdminId) {
        setError(
          "Admin MongoDB ID is missing."
        );

        return;
      }

      if (!socket.connected) {
        setError(
          "Chat server is not connected."
        );

        return;
      }

      if (sendingMessage) {
        return;
      }

      setSendingMessage(true);

      setError("");

      console.log(
        "================================="
      );

      console.log(
        "ADMIN SOCKET SEND"
      );

      console.log(
        "Sender:",
        currentAdminId
      );

      console.log(
        "Receiver:",
        selectedUser._id
      );

      console.log(
        "Message:",
        text
      );

      console.log(
        "================================="
      );

      socket.emit(
        "send_message",
        {
          senderId:
            String(currentAdminId),

          receiverId:
            String(selectedUser._id),

          message:
            text,
        },
        (response) => {
          console.log(
            "ADMIN SOCKET ACK:",
            response
          );

          if (
            response?.success ===
            false
          ) {
            setSendingMessage(
              false
            );

            setError(
              response.message ||
                "Failed to send message."
            );

            return;
          }

          setSendingMessage(
            false
          );

          setMessage("");

          inputRef.current?.focus();
        }
      );
    };

  // =========================================================
  // ENTER
  // =========================================================

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSendMessage();
    }
  };

  // =========================================================
  // INITIAL
  // =========================================================

  const getInitial = (
    name = ""
  ) =>
    name
      .charAt(0)
      .toUpperCase() ||
    "U";

  // =========================================================
  // TIME
  // =========================================================

  function formatMessageTime(
    date
  ) {
    if (!date) return "";

    return new Date(
      date
    ).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AdminLayout
      title="Chat"
      subtitle="Communicate with your team"
    >
      <div className="h-[calc(100vh-0px)] min-h-[650px] bg-[#f7f8fa] p-3 sm:p-5 lg:p-6">
        <div className="mx-auto flex h-full max-w-[1600px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* SIDEBAR */}

          <aside
            className={`
              ${
                mobileSidebarOpen
                  ? "absolute inset-0 z-40 flex"
                  : "hidden"
              }
              lg:relative lg:flex
              w-full lg:w-[330px]
              shrink-0
              flex-col
              border-r border-gray-200
              bg-white
            `}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 lg:hidden">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  VELSAKA
                </p>

                <h2 className="text-base font-semibold text-gray-900">
                  Messages
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileSidebarOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="hidden border-b border-gray-200 px-5 py-5 lg:block">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Messages
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Team conversations
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <MessageSquare
                    size={18}
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-100 p-4">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={
                    searchTerm
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchTerm(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search people..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-gray-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingUsers ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Loading conversations...
                  </div>
                </div>
              ) : filteredUsers.length ===
                0 ? (
                <div className="flex h-52 flex-col items-center justify-center px-5 text-center">
                  <Users
                    size={20}
                    className="text-gray-400"
                  />

                  <p className="mt-3 text-sm font-medium text-gray-700">
                    No users found
                  </p>
                </div>
              ) : (
                filteredUsers.map(
                  (item) => {
                    const isSelected =
                      String(
                        item._id
                      ) ===
                      String(
                        userId
                      );

                    return (
                      <button
                        key={
                          item._id
                        }
                        type="button"
                        onClick={() =>
                          handleSelectUser(
                            item
                          )
                        }
                        className={`
                          flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3.5 text-left transition
                          ${
                            isSelected
                              ? "bg-gray-100"
                              : "hover:bg-gray-50"
                          }
                        `}
                      >
                        <div className="relative shrink-0">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                            {getInitial(
                              item.name
                            )}
                          </div>

                          {item.status ===
                            "active" && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {
                              item.name
                            }
                          </p>

                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {item.jobRole ||
                              "Team Member"}
                          </p>

                          <p className="mt-1 truncate text-xs text-gray-400">
                            {
                              item.email
                            }
                          </p>
                        </div>
                      </button>
                    );
                  }
                )
              )}
            </div>
          </aside>

          {/* CHAT */}

          <section className="flex min-w-0 flex-1 flex-col bg-white">
            {!selectedUser ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <MessageSquare
                  size={30}
                  className="text-gray-400"
                />

                <h2 className="mt-5 text-lg font-semibold text-gray-900">
                  Select a conversation
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setMobileSidebarOpen(
                      true
                    )
                  }
                  className="mt-5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white lg:hidden"
                >
                  View conversations
                </button>
              </div>
            ) : (
              <>
                {/* HEADER */}

                <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setMobileSidebarOpen(
                          true
                        )
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
                    >
                      <ArrowLeft
                        size={19}
                      />
                    </button>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                      {getInitial(
                        selectedUser.name
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-gray-900">
                        {
                          selectedUser.name
                        }
                      </h2>

                      <p className="truncate text-xs text-gray-500">
                        {selectedUser.jobRole ||
                          "Team Member"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={
                        loadMessages
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                      title="Refresh"
                    >
                      <RefreshCw
                        size={17}
                      />
                    </button>

                    <button
                      type="button"
                      className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 sm:flex"
                    >
                      <Phone
                        size={17}
                      />
                    </button>

                    <button
                      type="button"
                      className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 sm:flex"
                    >
                      <Video
                        size={18}
                      />
                    </button>

                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                      <MoreVertical
                        size={18}
                      />
                    </button>
                  </div>
                </header>

                {/* ERROR */}

                {error && (
                  <div className="border-b border-red-100 bg-red-50 px-4 py-2.5">
                    <p className="text-xs font-medium text-red-600">
                      {error}
                    </p>
                  </div>
                )}

                {/* MESSAGES */}

                <div className="flex-1 overflow-y-auto bg-[#f8f9fb] px-4 py-6 sm:px-6">
                  <div className="mx-auto max-w-4xl">
                    {loadingMessages ? (
                      <div className="flex justify-center py-10">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />

                          Loading messages...
                        </div>
                      </div>
                    ) : messages.length ===
                      0 ? (
                      <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                        <MessageSquare
                          size={25}
                          className="text-gray-300"
                        />

                        <p className="mt-4 text-sm font-medium text-gray-500">
                          No messages yet
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Send the first message.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map(
                          (item) => {
                            const isAdmin =
                              item.sender ===
                              "admin";

                            return (
                              <div
                                key={
                                  item.id
                                }
                                className={`flex ${
                                  isAdmin
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[82%] sm:max-w-[65%] ${
                                    isAdmin
                                      ? "items-end"
                                      : "items-start"
                                  }`}
                                >
                                  <div
                                    className={`
                                      rounded-2xl px-4 py-3 text-sm leading-6
                                      ${
                                        isAdmin
                                          ? "rounded-br-md bg-gray-900 text-white"
                                          : "rounded-bl-md border border-gray-200 bg-white text-gray-800 shadow-sm"
                                      }
                                    `}
                                  >
                                    {
                                      item.text
                                    }
                                  </div>

                                  <div
                                    className={`mt-1.5 flex items-center gap-1.5 text-[10px] text-gray-400 ${
                                      isAdmin
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                                  >
                                    <span>
                                      {
                                        item.time
                                      }
                                    </span>

                                    {isAdmin &&
                                      (item.status ===
                                      "read" ? (
                                        <CheckCheck
                                          size={
                                            13
                                          }
                                        />
                                      ) : (
                                        <Check
                                          size={
                                            13
                                          }
                                        />
                                      ))}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}

                        <div
                          ref={
                            messagesEndRef
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* INPUT */}

                <div className="shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4">
                  <div className="mx-auto max-w-4xl">
                    <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2">
                      <button
                        type="button"
                        className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100"
                      >
                        <Paperclip
                          size={18}
                        />
                      </button>

                      <textarea
                        ref={
                          inputRef
                        }
                        value={
                          message
                        }
                        onChange={(
                          event
                        ) =>
                          setMessage(
                            event
                              .target
                              .value
                          )
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        rows={1}
                        disabled={
                          sendingMessage
                        }
                        placeholder={`Message ${selectedUser.name}...`}
                        className="max-h-28 min-h-[38px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                      />

                      <button
                        type="button"
                        className="mb-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 sm:flex"
                      >
                        <Smile
                          size={18}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleSendMessage
                        }
                        disabled={
                          !message.trim() ||
                          sendingMessage
                        }
                        className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white disabled:opacity-30"
                      >
                        {sendingMessage ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Send
                            size={17}
                          />
                        )}
                      </button>
                    </div>

                    <p className="mt-2 hidden text-center text-[10px] text-gray-400 sm:block">
                      Press Enter to send · Shift +
                      Enter for a new line
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChat;