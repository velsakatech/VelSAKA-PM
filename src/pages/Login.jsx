import { useEffect, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { auth } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);

  const [popup, setPopup] = useState({
    show: false,
    type: "error",
    title: "",
    message: "",
  });

  // =========================================================
  // REDIRECT EFFECT (runs after login success)
  // =========================================================

  useEffect(() => {
  if (!redirectTo) return;

  const timer = setTimeout(() => {
    console.log("NAVIGATING TO:", redirectTo);

    setPopup({
      show: false,
      type: "error",
      title: "",
      message: "",
    });

    // SPA navigation
    navigate(redirectTo, { replace: true });

    // 🔒 Safety net — 200ms-ல URL மாறலைனா hard reload
    setTimeout(() => {
      if (window.location.pathname !== redirectTo) {
        console.warn("SPA navigate failed — hard redirect");
        window.location.replace(redirectTo);
      }
    }, 200);
  }, 1200);

  return () => clearTimeout(timer);
}, [redirectTo, navigate]);


  // =========================================================
  // POPUP
  // =========================================================

  const showPopup = (type, title, message) => {
    setPopup({ show: true, type, title, message });
  };

  const closePopup = () => {
    setPopup({
      show: false,
      type: "error",
      title: "",
      message: "",
    });
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      showPopup("error", "Email Required", "Please enter your email address.");
      return;
    }

    if (!password) {
      showPopup("error", "Password Required", "Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // STEP 1 - FIREBASE LOGIN
      let firebaseResult;

      try {
        firebaseResult = await signInWithEmailAndPassword(
          auth,
          trimmedEmail,
          password,
        );
      } catch (firebaseError) {
        console.error("FIREBASE LOGIN ERROR:", firebaseError);

        let title = "Login Failed";
        let message =
          firebaseError?.message || "Unable to sign in. Please try again.";

        switch (firebaseError?.code) {
          case "auth/invalid-credential":
            title = "Invalid Login Details";
            message = "The email or password you entered is incorrect.";
            break;
          case "auth/user-not-found":
            title = "Account Not Found";
            message = "No Firebase account was found with this email address.";
            break;
          case "auth/wrong-password":
            title = "Incorrect Password";
            message = "The password you entered is incorrect.";
            break;
          case "auth/invalid-email":
            title = "Invalid Email";
            message = "Please enter a valid email address.";
            break;
          case "auth/user-disabled":
            title = "Account Disabled";
            message = "This Firebase account has been disabled.";
            break;
          case "auth/too-many-requests":
            title = "Too Many Attempts";
            message =
              "Too many unsuccessful login attempts. Please wait and try again.";
            break;
          case "auth/network-request-failed":
            title = "Network Error";
            message =
              "Unable to connect to Firebase. Please check your internet connection.";
            break;
          case "auth/operation-not-allowed":
            title = "Login Method Disabled";
            message =
              "Email and password login is not enabled in Firebase Authentication.";
            break;
          case "auth/api-key-not-valid":
            title = "Firebase Configuration Error";
            message =
              "The Firebase API key is invalid. Please check your Firebase configuration.";
            break;
          default:
            title = "Firebase Login Error";
            message =
              firebaseError?.message ||
              `Firebase error: ${firebaseError?.code || "unknown"}`;
            break;
        }

        showPopup("error", title, message);
        return;
      }

      const firebaseUser = firebaseResult.user;

      // STEP 2 - GET MONGODB PROFILE
      const profileUrl = `http://localhost:5000/api/users/profile/${encodeURIComponent(
        trimmedEmail,
      )}`;

      let response;

      try {
        response = await fetch(profileUrl);
      } catch (networkError) {
        console.error("BACKEND NETWORK ERROR:", networkError);
        await signOut(auth);

        showPopup(
          "error",
          "Server Connection Error",
          "Firebase login was successful, but the VELSAKA backend could not be reached. Please make sure the backend server is running on port 5000.",
        );
        return;
      }

      let data;

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("BACKEND JSON ERROR:", jsonError);
        await signOut(auth);

        showPopup(
          "error",
          "Server Response Error",
          `The backend returned an invalid response. HTTP Status: ${response.status}`,
        );
        return;
      }

      if (!response.ok) {
        console.error("BACKEND PROFILE ERROR:", data);
        await signOut(auth);

        showPopup(
          "error",
          response.status === 404 ? "Profile Not Found" : "Backend Error",
          data?.message ||
            `Unable to load your profile. HTTP Status: ${response.status}`,
        );
        return;
      }

      if (!data?.success || !data?.user) {
        console.error("INVALID PROFILE RESPONSE:", data);
        await signOut(auth);

        showPopup(
          "error",
          "Profile Error",
          "Your Firebase login was successful, but your MongoDB user profile could not be loaded.",
        );
        return;
      }

      const userData = data.user;

      console.log("ACCESS ROLE RAW:", JSON.stringify(userData.accessRole));

      // CHECK STATUS
      if (userData.status !== "active") {
        await signOut(auth);
        showPopup(
          "error",
          "Account Inactive",
          "Your account is currently inactive. Please contact your administrator.",
        );
        return;
      }

      // CHECK ROLE
      if (userData.accessRole !== "admin" && userData.accessRole !== "user") {
        await signOut(auth);
        showPopup(
          "error",
          "Access Not Configured",
          "Your account does not have a valid access role. Please contact your administrator.",
        );
        return;
      }

      // SAVE SESSION
      const sessionUser = {
        ...userData,
        _id: userData._id || userData.id,
        firebaseUid: firebaseUser.uid,
      };

      login(sessionUser, firebaseUser.uid);

      console.log("User session saved via AuthContext.");

      // SHOW POPUP + TRIGGER REDIRECT VIA EFFECT
      const destination =
        userData.accessRole === "admin" ? "/admin" : "/user/dashboard";

      showPopup(
        "success",
        "Login Successful",
        `Welcome back, ${userData.name}! Redirecting...`,
      );

      setRedirectTo(destination);
    } catch (error) {
      console.error("UNEXPECTED LOGIN ERROR:", error);
      showPopup(
        "error",
        "Unexpected Login Error",
        error?.message || "Something unexpected happened while signing in.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI (unchanged from your original)
  // =========================================================

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              VELSAKA Project Management
            </h1>
            <p className="mt-2 text-sm text-gray-500">Sign in to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </div>

      {popup.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex justify-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${
                  popup.type === "success"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {popup.type === "success" ? "✓" : "!"}
              </div>
            </div>

            <h2 className="text-center text-xl font-semibold text-gray-900">
              {popup.title}
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-gray-600">
              {popup.message}
            </p>

            <button
              type="button"
              onClick={closePopup}
              className={`mt-6 w-full rounded-xl px-4 py-3 font-medium text-white transition ${
                popup.type === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {popup.type === "success" ? "Continue" : "Okay"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Login;