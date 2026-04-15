import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/wall", { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
