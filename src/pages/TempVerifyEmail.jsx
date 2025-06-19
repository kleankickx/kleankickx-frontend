import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TempVerifyEmail = () => {

    // backend URL from environment variable
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
    const userEmail = localStorage.getItem('pending_verification_email') || '';

    const handleResendVerification = async () => {
        try {
            const response = await axios.post(
                `${backendUrl}/api/users/resend-verification-email/`,
                { email: userEmail }
            );
            if (response.status === 200) {
                toast.success('Verification email resent. Please check your inbox.');
            }
        } catch (error) {
            console.error('Error resending verification email:', error);
            toast.error('Error resending verification email. Please try again later.');
        }
    };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 lg:px-24">
      <div className="bg-white p-6 rounded-lg shadow-md w-90 max-w-md">
        <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
        <p className="mb-4">A verification link has been sent to your email address. Please check your inbox and click the link to verify your email.</p>
        <button onClick={handleResendVerification} className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 cursor-pointer">
          Resend Verification Email
        </button>
      </div>
    </div>
  );
}

export default TempVerifyEmail;