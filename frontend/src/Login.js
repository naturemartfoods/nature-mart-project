import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const API_URL = "https://nature-mart-project.onrender.com";
  const handleLogin = () => {
    fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
    console.log("LOGIN RESPONSE:", data);

    // if (data.token) {
    //     login(data.user || data, data.token);  // ✅ SAVE TOKEN + USER

    //     if (data.role === "admin") {
    //       alert("Admin Login Successful");
    //       navigate("/admin");
    //     } else {
    //       alert("User Login Successful");
    //       navigate("/");
    //     }
    //   } else {
    //     alert("Login failed");
    //   }
    if (data.token) {
        const userData = data.user || data;

        login(userData, data.token);   // ✅ store user + token

        if (userData.role === "admin") {
          alert("Admin Login Successful");
          navigate("/admin");
        } else {
          alert("User Login Successful");
          navigate("/");
        }
      }
    });
  };

  return (
    <div style={{padding: "50px"}}>
      <h1>Login</h1>

      <input 
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      /><br /><br />

      <input 
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      /><br /><br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;