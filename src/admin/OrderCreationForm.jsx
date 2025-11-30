import { useState, useEffect, useCallback } from 'react';
// import { lookupCustomer, createOrder } from '../utils/api';
import GoogleMapsInput from './GoogleMapsInput'; 
import debounce from 'lodash/debounce';

const initialFormData = {
    // Customer Fields
    use_existing: 'NEW', customer_email: '', customer_phone_number: '', 
    customer_first_name: '', customer_last_name: '',
    
    // Address Raw Fields
    raw_delivery_address: '', raw_pickup_address: '',
    
    // Address Metadata (Hidden)
    delivery_lat: '', delivery_lng: '', delivery_place_id: '',
    pickup_lat: '', pickup_lng: '', pickup_place_id: '',
    
    // Order Fields
    delivery_option: 'DELIVERY_PICKUP', payment_method: 'CASH',
    cash_paid_amount: '0.00', status: 'PENDING',
};

const CUSTOMER_TYPE_CHOICES = [
    { value: 'NEW', label: 'New Customer' },
    { value: 'EXISTING', label: 'Existing Customer (Search by Email/Phone)' },
];

const OrderCreationForm = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [orderItems, setOrderItems] = useState([{ name: 'Item 1', quantity: 1, unit_price: 50.00 }]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userLookupStatus, setUserLookupStatus] = useState('idle');

    const deliveryOption = formData.delivery_option;
    const isNewCustomer = formData.use_existing === 'NEW';
    const isExistingCustomer = formData.use_existing === 'EXISTING';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined, non_field_errors: undefined }));
    };

    const handleAddressChange = (id, placeData) => {
        setErrors(prev => ({ ...prev, [id]: undefined }));

        if (placeData.place_id) {
             setFormData(prev => ({ 
                ...prev, 
                [id]: placeData.raw_address, 
                [`${id.split('_')[1]}_lat`]: placeData.lat, 
                [`${id.split('_')[1]}_lng`]: placeData.lng, 
                [`${id.split('_')[1]}_place_id`]: placeData.place_id, 
            }));
        } else {
             setFormData(prev => ({ ...prev, [id]: placeData.raw_address }));
        }
    };
    
    const handleAddressError = (id, message) => {
        setErrors(prev => ({ ...prev, [id]: [message] }));
    };

    const lookup = useCallback(debounce(async (email, phone) => {
        if (!email && !phone) return;
        
        setUserLookupStatus('searching');
        setErrors(prev => ({ ...prev, customer_email: undefined, customer_phone_number: undefined }));

        try {
            const data = await lookupCustomer({ email, phone_number: phone });
            
            if (data.exists) {
                setUserLookupStatus('found');
                setFormData(prev => ({
                    ...prev,
                    use_existing: 'EXISTING',
                    customer_first_name: data.first_name,
                    customer_last_name: data.last_name,
                    customer_email: data.email,
                    customer_phone_number: data.phone_number,
                }));
            } else {
                setUserLookupStatus('not_found');
            }
        } catch (error) {
            setUserLookupStatus('idle');
            setErrors(prev => ({ ...prev, customer_email: error.email || error.non_field_errors }));
        }
    }, 500), []);

    useEffect(() => {
        lookup(formData.customer_email, formData.customer_phone_number);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.customer_email, formData.customer_phone_number]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        const payload = {
            ...formData,
            order_items_data: orderItems,
            customer_email: formData.customer_email || null,
            customer_phone_number: formData.customer_phone_number || null,
        };

        try {
            const result = await createOrder(payload);
            window.location.href = `/admin/orders/order/${result.id}/change/`;
        } catch (errorData) {
            setErrors(errorData);
            if (errorData.non_field_errors) {
                setErrors(prev => ({ ...prev, non_field_errors: errorData.non_field_errors }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getError = (fieldName) => errors[fieldName]?.[0];
    const isDeliveryRequired = ['DELIVERY_PICKUP', 'SAME_AS_DELIVERY', 'OFFICE_DROP_OFF'].includes(deliveryOption);
    const isSeparatePickupRequired = deliveryOption === 'DELIVERY_PICKUP';
    
    let lookupMessage = null;
    if (userLookupStatus === 'found' && isExistingCustomer) {
        lookupMessage = <span className="text-green-600 text-sm font-medium">✅ User found: {formData.customer_first_name} {formData.customer_last_name}</span>;
    } else if (userLookupStatus === 'not_found' && isExistingCustomer) {
        lookupMessage = <span className="text-amber-600 text-sm font-medium">⚠️ No existing user found. Please check spelling.</span>;
    } else if (userLookupStatus === 'searching') {
        lookupMessage = <span className="text-blue-600 text-sm font-medium">...Searching...</span>;
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Creation</h2>
            <div className="w-full h-px bg-gray-200 mb-6"></div>

            {getError('non_field_errors') && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {getError('non_field_errors')}
                </div>
            )}

            {/* Customer Information */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm">👤</span>
                    Customer Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Customer Type</label>
                        <div className="space-y-2">
                            {CUSTOMER_TYPE_CHOICES.map(choice => (
                                <label key={choice.value} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="use_existing"
                                        value={choice.value}
                                        checked={formData.use_existing === choice.value}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{choice.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                        <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-2">
                            Customer Email {isExistingCustomer && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="email"
                            id="customer_email"
                            name="customer_email"
                            value={formData.customer_email}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                getError('customer_email') ? 'border-red-300' : 'border-gray-300'
                            } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            required={isExistingCustomer}
                            disabled={isSubmitting}
                        />
                        {lookupMessage && <div className="mt-2">{lookupMessage}</div>}
                        {getError('customer_email') && (
                            <p className="mt-1 text-sm text-red-600">{getError('customer_email')}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="customer_phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                            Customer Phone Number {isNewCustomer && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="text"
                            id="customer_phone_number"
                            name="customer_phone_number"
                            value={formData.customer_phone_number}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                getError('customer_phone_number') ? 'border-red-300' : 'border-gray-300'
                            } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            required={isNewCustomer}
                            disabled={isSubmitting}
                        />
                        {getError('customer_phone_number') && (
                            <p className="mt-1 text-sm text-red-600">{getError('customer_phone_number')}</p>
                        )}
                    </div>
                </div>

                {(isNewCustomer || userLookupStatus === 'found') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                            <label htmlFor="customer_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                First Name {isNewCustomer && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="text"
                                id="customer_first_name"
                                name="customer_first_name"
                                value={formData.customer_first_name}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    getError('customer_first_name') ? 'border-red-300' : 'border-gray-300'
                                } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                required={isNewCustomer}
                                disabled={isSubmitting}
                            />
                            {getError('customer_first_name') && (
                                <p className="mt-1 text-sm text-red-600">{getError('customer_first_name')}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="customer_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name {isNewCustomer && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="text"
                                id="customer_last_name"
                                name="customer_last_name"
                                value={formData.customer_last_name}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    getError('customer_last_name') ? 'border-red-300' : 'border-gray-300'
                                } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                required={isNewCustomer}
                                disabled={isSubmitting}
                            />
                            {getError('customer_last_name') && (
                                <p className="mt-1 text-sm text-red-600">{getError('customer_last_name')}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full h-px bg-gray-200 my-6"></div>

            {/* Address Requirements */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-sm">📍</span>
                    Address Requirements
                </h3>

                <div className="mb-6">
                    <label htmlFor="delivery_option" className="block text-sm font-medium text-gray-700 mb-2">
                        Address Requirement
                    </label>
                    <select
                        id="delivery_option"
                        name="delivery_option"
                        value={deliveryOption}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            getError('delivery_option') ? 'border-red-300' : 'border-gray-300'
                        } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={isSubmitting}
                    >
                        <option value="DELIVERY_PICKUP">Delivery & Pickup required (Standard)</option>
                        <option value="OFFICE_DROP_OFF">Customer dropped off at office (No Pickup needed)</option>
                        <option value="WAIT_AND_TAKE">Customer waits/office pickup (No Delivery needed)</option>
                        <option value="SAME_AS_DELIVERY">Pickup same as Delivery</option>
                    </select>
                    {getError('delivery_option') && (
                        <p className="mt-1 text-sm text-red-600">{getError('delivery_option')}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isDeliveryRequired && (
                        <div>
                            <GoogleMapsInput 
                                id="raw_delivery_address" 
                                label="Delivery Address (Search)"
                                value={formData.raw_delivery_address}
                                onChange={handleAddressChange}
                                isRequired={true}
                                onError={(id, msg) => handleAddressError(id, msg)}
                            />
                            {getError('raw_delivery_address') && (
                                <p className="mt-1 text-sm text-red-600">{getError('raw_delivery_address')}</p>
                            )}
                        </div>
                    )}

                    {isSeparatePickupRequired && (
                        <div>
                            <GoogleMapsInput 
                                id="raw_pickup_address" 
                                label="Pickup Address (Search)"
                                value={formData.raw_pickup_address}
                                onChange={handleAddressChange}
                                isRequired={true}
                                onError={(id, msg) => handleAddressError(id, msg)}
                            />
                            {getError('raw_pickup_address') && (
                                <p className="mt-1 text-sm text-red-600">{getError('raw_pickup_address')}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full h-px bg-gray-200 my-6"></div>

            {/* Order Items */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-sm">📦</span>
                    Order Items
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-700">
                        Mock Item: {orderItems[0].name} @ ${orderItems[0].unit_price} x {orderItems[0].quantity} = 
                        <span className="font-semibold"> ${(orderItems[0].unit_price * orderItems[0].quantity).toFixed(2)}</span>
                    </p>
                </div>
                {getError('order_items_data') && (
                    <p className="mt-2 text-sm text-red-600">{getError('order_items_data')}</p>
                )}
            </div>

            <div className="w-full h-px bg-gray-200 my-6"></div>

            {/* Payment Details */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 text-sm">💰</span>
                    Payment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method
                        </label>
                        <select
                            id="payment_method"
                            name="payment_method"
                            value={formData.payment_method}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                getError('payment_method') ? 'border-red-300' : 'border-gray-300'
                            } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            disabled={isSubmitting}
                        >
                            <option value="CASH">Cash</option>
                            <option value="MOMO">Mobile Money (MOMO)</option>
                        </select>
                        {getError('payment_method') && (
                            <p className="mt-1 text-sm text-red-600">{getError('payment_method')}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="cash_paid_amount" className="block text-sm font-medium text-gray-700 mb-2">
                            Cash Paid Amount (if applicable)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            id="cash_paid_amount"
                            name="cash_paid_amount"
                            value={formData.cash_paid_amount}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                getError('cash_paid_amount') ? 'border-red-300' : 'border-gray-300'
                            } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            disabled={isSubmitting}
                        />
                        {getError('cash_paid_amount') && (
                            <p className="mt-1 text-sm text-red-600">{getError('cash_paid_amount')}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full h-px bg-gray-200 my-6"></div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Order...
                    </span>
                ) : (
                    'Create Order'
                )}
            </button>
        </form>
    );
};

export default OrderCreationForm;