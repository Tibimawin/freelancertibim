import AuthModal from "@/components/AuthModal";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <AuthModal isOpen={true} onClose={() => navigate('/')} />
  );
};

export default LoginPage;