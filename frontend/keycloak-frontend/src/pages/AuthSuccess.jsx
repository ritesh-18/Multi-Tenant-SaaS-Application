import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } else {
      navigate("/");
    }
  }, [navigate]);

  return <p className="text-center mt-10">Logging you in...</p>;
}
