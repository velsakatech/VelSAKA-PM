import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Send,
  MessageCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import socket from "../../socket/socket";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/chat";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

const UserChat = () => {
  const navigate = useNavigate();

  const { adminId } = useParams();

  const {
    user,
    authLoading,
  } = useAuth();

  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================================================
  // CURRENT USER MONGODB ID
  // =========================================================

  const currentUserId =
    user?._id ||
    user?.id ||
    null;

  // =========================================================
  // DEBUG
  // =========================================================

  useEffect(() => {
    console.log("=================================");
    console.log("USER CHAT");
    console.log("Logged User:", user);
    console.log(
      "Current User MongoDB ID:",
      currentUserId
    );
    console.log(
      "Admin MongoDB ID:",
      adminId
    );
    console.log(
      "Socket Connected:",
      socket.connected
    );
    console.log(
      "Socket URL:",
      SOCKET_URL
    );
    console.log("=================================");
  }, [
    user,
    currentUserId,
    adminId,
  ]);

  // =========================================================
  // CONNECT SOCKET
  // =========================================================

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const connectSocket = () => {
      console.log(
        "Connecting socket for user:",
        currentUserId
      );

      if (!socket.connected) {
        socket.connect();
      }
    };

    connectSocket();

    return () => {
      // Do not disconnect here.
      // AuthContext may also use the same socket.
    };
  }, [currentUserId]);

  // =========================================================
  // JOIN USER ROOM
  // =========================================================

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const joinUserRoom = () => {
      console.log(
        "USER JOINING SOCKET ROOM:",
        currentUserId
      );

      socket.emit(
        "join_user",
        String(currentUserId)
      );
    };

    if (socket.connected) {
      joinUserRoom();
    }

    socket.on(
      "connect",
      joinUserRoom
    );

    return () => {
      socket.off(
        "connect",
        joinUserRoom
      );
    };
  }, [currentUserId]);

  // =========================================================
  // GET ID FROM MONGOOSE OBJECT / STRING
  // =========================================================

  const getId = (value) => {
    if (!value) {
      return null;
    }

    if (
      typeof value === "object"
    ) {
      return (
        value._id ||
        value.id ||
        null
      );
    }

    return value;
  };

  // =========================================================
  // FORMAT MESSAGE
  // =========================================================

  const normalizeMessage = (
    item
  ) => {
    return {
      ...item,

      _id:
        item._id ||
        `${Date.now()}-${Math.random()}`,

      senderId:
        getId(item.senderId),

      receiverId:
        getId(item.receiverId),

      message:
        item.message || "",

      createdAt:
        item.createdAt ||
        new Date().toISOString(),
    };
  };

  // =========================================================
  // LOAD MESSAGES
  // =========================================================

  const loadMessages =
    useCallback(async () => {
      if (!currentUserId) {
        setError(
          "User MongoDB ID is missing from your login session."
        );

        setLoading(false);

        return;
      }

      if (!adminId) {
        setError(
          "Admin ID is missing from the URL."
        );

        setLoading(false);

        return;
      }

      // Prevent accidental self-chat
      if (
        String(currentUserId) ===
        String(adminId)
      ) {
        setError(
          "Invalid chat: the logged-in user and admin have the same ID. Please open the chat using the actual admin MongoDB ID."
        );

        setMessages([]);

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log(
          "LOADING USER CHAT:",
          currentUserId,
          "<->",
          adminId
        );

        const response =
          await fetch(
            `${API_URL}/${adminId}`,
            {
              method: "GET",

              headers: {
                "Content-Type":
                  "application/json",

                "x-user-id":
                  String(
                    currentUserId
                  ),
              },
            }
          );

        const data =
          await response.json();

        console.log(
          "USER CHAT RESPONSE:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load chat messages"
          );
        }

        const loadedMessages =
          Array.isArray(
            data.messages
          )
            ? data.messages.map(
                normalizeMessage
              )
            : [];

        setMessages(
          loadedMessages
        );
      } catch (error) {
        console.error(
          "LOAD MESSAGES ERROR:",
          error
        );

        setError(
          error.message ||
            "Unable to load chat messages."
        );
      } finally {
        setLoading(false);
      }
    }, [
      currentUserId,
      adminId,
    ]);

  // =========================================================
  // LOAD AFTER AUTH
  // =========================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setError(
        "Please login to use chat."
      );

      setLoading(false);

      return;
    }

    loadMessages();
  }, [
    authLoading,
    user,
    loadMessages,
  ]);

  // =========================================================
  // REAL-TIME SOCKET MESSAGE
  // =========================================================

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    if (!adminId) {
      return;
    }

    const handleNewMessage =
      (incomingMessage) => {
        console.log(
          "USER RECEIVED SOCKET MESSAGE:",
          incomingMessage
        );

        const normalized =
          normalizeMessage(
            incomingMessage
          );

        const senderId =
          getId(
            normalized.senderId
          );

        const receiverId =
          getId(
            normalized.receiverId
          );

        console.log(
          "SOCKET MESSAGE IDS:",
          {
            senderId,
            receiverId,
            currentUserId,
            adminId,
          }
        );

        const isCurrentConversation =
          (
            String(senderId) ===
              String(
                currentUserId
              ) &&
            String(receiverId) ===
              String(adminId)
          ) ||
          (
            String(senderId) ===
              String(adminId) &&
            String(receiverId) ===
              String(
                currentUserId
              )
          );

        if (
          !isCurrentConversation
        ) {
          console.log(
            "Ignoring socket message from another conversation."
          );

          return;
        }

        setMessages(
          (previous) => {
            const alreadyExists =
              previous.some(
                (item) =>
                  String(
                    item._id
                  ) ===
                  String(
                    normalized._id
                  )
              );

            if (
              alreadyExists
            ) {
              return previous;
            }

            return [
              ...previous,
              normalized,
            ];
          }
        );
      };

    socket.on(
      "new_message",
      handleNewMessage
    );

    socket.on(
      "message_sent",
      handleNewMessage
    );

    return () => {
      socket.off(
        "new_message",
        handleNewMessage
      );

      socket.off(
        "message_sent",
        handleNewMessage
      );
    };
  }, [
    currentUserId,
    adminId,
  ]);

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const handleSendMessage = (
    event
  ) => {
    event?.preventDefault();

    const text =
      message.trim();

    if (!text) {
      return;
    }

    if (!currentUserId) {
      setError(
        "Logged-in user ID is missing."
      );

      return;
    }

    if (!adminId) {
      setError(
        "Admin ID is missing."
      );

      return;
    }

    // Prevent self-chat
    if (
      String(currentUserId) ===
      String(adminId)
    ) {
      setError(
        "Cannot send a message to yourself. The adminId in the URL is the same as your user ID."
      );

      return;
    }

    if (!socket.connected) {
      setError(
        "Chat server is not connected. Please wait a moment and try again."
      );

      socket.connect();

      return;
    }

    if (sending) {
      return;
    }

    setSending(true);
    setError("");

    console.log(
      "================================="
    );

    console.log(
      "SOCKET SEND USER → ADMIN"
    );

    console.log(
      "Socket ID:",
      socket.id
    );

    console.log(
      "Sender User:",
      currentUserId
    );

    console.log(
      "Receiver Admin:",
      adminId
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
          String(currentUserId),

        receiverId:
          String(adminId),

        message: text,
      },
      (response) => {
        console.log(
          "SEND MESSAGE ACK:",
          response
        );

        setSending(false);

        if (
          response?.success === false
        ) {
          setError(
            response.message ||
              "Failed to send message."
          );

          return;
        }

        setMessage("");
      }
    );

    // Fallback if your backend doesn't provide an ACK.
    setTimeout(() => {
      setSending(false);
    }, 5000);
  };

  // =========================================================
  // ENTER TO SEND
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
  // GET SENDER ID
  // =========================================================

  const getSenderId =
    (item) => {
      return getId(
        item?.senderId
      );
    };

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    return parsedDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="flex h-screen flex-col bg-[#f7f8fa]">

      {/* HEADER */}

      <header className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-4 sm:px-6">

        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white">
          <MessageCircle
            size={19}
          />
        </div>

        <div className="ml-3">
          <h1 className="text-sm font-semibold text-gray-900">
            Admin Support
          </h1>

          <p className="text-xs text-gray-500">
            Project Management
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">

          <div
            className={`hidden items-center gap-1.5 text-[10px] sm:flex ${
              socket.connected
                ? "text-emerald-600"
                : "text-red-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                socket.connected
                  ? "bg-emerald-500"
                  : "bg-red-500"
              }`}
            />

            {socket.connected
              ? "Connected"
              : "Disconnected"}
          </div>

          <button
            type="button"
            onClick={
              loadMessages
            }
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </div>
      </header>

      {/* ERROR */}

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-center text-xs text-red-700">
          {error}
        </div>
      )}

      {/* MESSAGES */}

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">

        <div className="mx-auto flex max-w-4xl flex-col">

          {authLoading ||
          loading ? (
            <div className="flex min-h-[300px] items-center justify-center">

              <div className="flex items-center gap-2 text-sm text-gray-500">

                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Loading messages...

              </div>

            </div>
          ) : messages.length ===
            0 ? (

            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">

              <MessageCircle
                size={25}
                className="text-gray-400"
              />

              <h2 className="mt-4 text-sm font-semibold text-gray-900">
                Start a conversation
              </h2>

              <p className="mt-1 max-w-sm text-xs text-gray-500">
                Send a message to the admin.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {messages.map(
                (item) => {
                  const senderId =
                    getSenderId(
                      item
                    );

                  const isMine =
                    String(
                      senderId
                    ) ===
                    String(
                      currentUserId
                    );

                  return (
                    <div
                      key={
                        item._id
                      }
                      className={`flex ${
                        isMine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isMine
                            ? "rounded-br-md bg-gray-900 text-white"
                            : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
                        }`}
                      >

                        <p className="whitespace-pre-wrap break-words">
                          {
                            item.message
                          }
                        </p>

                        <p
                          className={`mt-1 text-[10px] ${
                            isMine
                              ? "text-gray-300"
                              : "text-gray-400"
                          }`}
                        >
                          {formatTime(
                            item.createdAt
                          )}
                        </p>

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

      </main>

      {/* INPUT */}

      <footer className="shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4">

        <form
          onSubmit={
            handleSendMessage
          }
          className="mx-auto flex max-w-4xl items-end gap-2"
        >

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            rows={1}
            placeholder={
              "Type a message..."
            }
            disabled={
              sending ||
              authLoading ||
              !currentUserId ||
              !adminId ||
              String(
                currentUserId
              ) ===
                String(adminId)
            }
            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={
              !message.trim() ||
              sending ||
              authLoading ||
              !currentUserId ||
              !adminId ||
              String(
                currentUserId
              ) ===
                String(adminId)
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white disabled:cursor-not-allowed disabled:opacity-40"
          >

            {sending ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Send size={18} />
            )}

          </button>

        </form>

        <p className="mx-auto mt-1.5 max-w-4xl px-1 text-[10px] text-gray-400">
          Press Enter to send · Shift +
          Enter for a new line
        </p>

      </footer>

    </div>
  );
};

export default UserChat;