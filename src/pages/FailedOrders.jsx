import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa6';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';


const FailedOrders = () => {
    const [failedOrders, setFailedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const navigate = useNavigate();
    const { api } = useContext(AuthContext)
    const { clearCart } = useContext(CartContext)

    useEffect(() => {
        const loadFailedOrders = () => {
            try {
                // Check localStorage for failed orders
                const storedOrder = localStorage.getItem('failedOrder');
                const orders = storedOrder ? [JSON.parse(storedOrder)] : [];
                
                // You could also check for other indicators of failed orders
                setFailedOrders(orders);
            } catch (error) {
                console.error('Error loading failed orders:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFailedOrders();
    }, []);

    const handleRetryOrder = async (order) => {
        setRetrying(true);
        try {
            const response = await api.post('/api/orders/create/', {
                user_id: order.user_id,
                delivery_location: order.delivery_location,
                pickup_location: order.pickup_location,
                total_amount: order.total_amount,
                cart_items: order.cart_items,
                transaction_id: order.transaction_id,
            });

            // Clear the failed order from storage
            localStorage.removeItem('failedOrder');
            clearCart()
            toast.success('Order successfully recovered!');
            navigate(`/orders/${response.data.order_slug}`);
        } catch (error) {
            console.error('Error retrying order:', error);
            toast.error('Failed to recover order. Please contact support.');
        } finally {
            setRetrying(false);
        }
    };

    const handleContactSupport = () => {
        const subject = encodeURIComponent('Help with failed order');
        const body = encodeURIComponent(
            `I need help with a failed order. Here are the details:\n\n` +
            `Transaction ID: ${failedOrders[0]?.transaction_id || 'N/A'}\n` +
            `Amount: ${failedOrders[0]?.total_amount || 'N/A'}\n` +
            `Date: ${new Date().toLocaleString()}`
        );
        window.location.href = `mailto:support@yourdomain.com?subject=${subject}&body=${body}`;
    };

    const handleNewOrder = () => {
        navigate('/cart'); // Or wherever your cart is located
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <FaSpinner className="animate-spin h-8 w-8 text-gray-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-red-600 mb-6">
                Order Processing Issue
            </h1>

            {failedOrders.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-start mb-4">
                        <div className="bg-red-100 p-3 rounded-full mr-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-red-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">
                                We encountered an issue with your order
                            </h2>
                            <p className="text-gray-600 mt-2">
                                Your payment was successful but we couldn't complete your order.
                                You can try again below or contact our support team for help.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="font-medium text-lg mb-3">Order Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-600">Transaction ID:</p>
                                <p className="font-medium">{failedOrders[0].transaction_id}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Amount:</p>
                                <p className="font-medium">GHS {failedOrders[0].total_amount}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Items:</p>
                                <p className="font-medium">{failedOrders[0].cart_items.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => handleRetryOrder(failedOrders[0])}
                            disabled={retrying}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center disabled:opacity-50"
                        >
                            {retrying ? 'Processing...' : 'Try Again'}
                        </button>
                        <button
                            onClick={handleContactSupport}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center disabled:opacity-50"
                        >
                            Contact Support
                        </button>
                        <button
                            onClick={handleNewOrder}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center justify-center disabled:opacity-50"
                        >
                            Start New Order
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No Failed Orders Found</h2>
                    <p className="text-gray-600 mb-6">
                        We couldn't find any incomplete orders in your account.
                    </p>
                    <button
                        onClick={handleNewOrder}
                        className="bg-primary hover:bg-primary-dark text-white mx-auto px-4 py-2 rounded-md flex items-center justify-center disabled:opacity-50"
                    >
                        Start New Order
                    </button>
                </div>
            )}

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-yellow-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            If you believe this is an error or need any assistance, please don't
                            hesitate to contact our support team.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FailedOrders;