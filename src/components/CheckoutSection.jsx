
const CheckoutSection = () => {
    return (
        <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900">Complete Your Order</h1>
                <p className="text-gray-600 mt-2">Review your items and provide delivery information</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column - Customer Information */}
                <div className="lg:w-1/2 space-y-6">
                    {/* Delivery Information Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h2 className="text-xl font-semibold flex items-center">
                        <FiTruck className="mr-3 text-primary" />
                        Delivery Information
                        </h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                            Delivery Address
                            </label>
                            <button
                            onClick={handleUseCurrentLocation}
                            disabled={locationLoading}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
                            >
                            <FiNavigation className="mr-1.5" />
                            {locationLoading ? 'Detecting...' : 'Use Current Location'}
                            </button>
                        </div>
                        <PlaceAutocompleteElementWrapper
                            key={`delivery-${paymentView}`}
                            onPlaceSelect={(loc) => handlePlaceSelect(loc, 'delivery')}
                            currentInputValue={deliveryInputValue}
                            initialLocation={delivery}
                            placeholder="Enter delivery address"
                            type="delivery"
                            region={deliveryRegion}
                            onFocus={() => setActiveInput('delivery')}
                        />
                        </div>

                        <div className="flex items-start pt-2">
                        <div className="flex items-center h-5">
                            <input
                            type="checkbox"
                            id="same"
                            checked={useSame}
                            onChange={(e) => setUseSame(e.target.checked)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                        </div>
                        <label htmlFor="same" className="ml-3 text-sm text-gray-700">
                            Use delivery address for pickup
                        </label>
                        </div>

                        {!useSame && (
                        <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pickup Address
                            </label>
                            <PlaceAutocompleteElementWrapper
                            key={`pickup-${paymentView}`}
                            onPlaceSelect={(loc) => handlePlaceSelect(loc, 'pickup')}
                            currentInputValue={pickupInputValue}
                            initialLocation={pickup}
                            placeholder="Enter pickup address"
                            type="pickup"
                            region={pickupRegion}
                            onFocus={() => setActiveInput('pickup')}
                            />
                        </div>
                        )}
                    </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h2 className="text-xl font-semibold flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        Contact Details
                        </h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
                        />
                        </div>
                        
                        <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <div className="relative rounded-lg overflow-hidden">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 bg-gray-100 border-r border-gray-200">
                            <span className="text-gray-700 flex items-center">
                                <span className="mr-2">🇬🇭</span> +233
                            </span>
                            </div>
                            <input
                            type="tel"
                            id="phone"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            placeholder="24 123 4567"
                            className="pl-24 w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            maxLength={13}
                            />
                            {phoneNumber && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                {isPhoneValid ? (
                                <FaCheckCircle className="text-green-500" />
                                ) : (
                                <FaTimesCircle className="text-red-500" />
                                )}
                            </div>
                            )}
                        </div>
                        {phoneNumber && !isPhoneValid && (
                            <p className="mt-2 text-sm text-red-600">
                            Please enter a valid Ghana phone number (e.g., 024 123 4567)
                            </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                            Format: 0XX XXX XXXX
                        </p>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Right Column - Order Summary */}
                <div className="lg:w-1/2 space-y-6">
                    {/* Map Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="h-64 md:h-80 w-full relative">
                        <Map
                        mapId={"YOUR_MAP_ID"}
                        defaultZoom={delivery || pickup ? 16 : 12}
                        defaultCenter={currentLocation}
                        gestureHandling={'greedy'}
                        disableDefaultUI={false}
                        style={{ height: '100%', width: '100%' }}
                        >
                        <MapHandler
                            delivery={delivery}
                            pickup={pickup}
                            useSame={useSame}
                            currentLocation={currentLocation}
                            activeInput={activeInput}
                        />
                        </Map>
                    </div>
                    </div>

                    {/* Order Summary Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h2 className="text-xl font-semibold">Order Summary</h2>
                    </div>
                    <div className="p-6">
                        <div className="divide-y divide-gray-200">
                        {cart.map((item) => (
                            <div key={item.service_id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex justify-between items-start">
                                <div>
                                <p className="font-medium text-gray-900">{item.service_name}</p>
                                <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                </div>
                                <p className="font-medium text-gray-900">GHS {(item.quantity * item.price).toFixed(2)}</p>
                            </div>
                            </div>
                        ))}
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                        <div className="flex justify-between">
                            <p className="text-gray-600">Subtotal</p>
                            <p className="font-medium">GHS {subtotal.toFixed(2)}</p>
                        </div>
                        
                        {canUseSignup && (
                            <div className="bg-green-50 rounded-lg p-3 -mx-1">
                            <div className="flex justify-between items-center">
                                <span className="text-green-700 font-medium flex items-center">
                                <FaGift className="mr-2" />
                                {signupDiscount.discount_type}
                                </span>
                                <span className="text-green-700 font-medium">-GHS {signupDiscountAmount.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-green-600 mt-1 ml-6">
                                {signupDiscount.percentage}% off your order
                            </div>
                            </div>
                        )}

                        {canUseReferral && (
                            <div className="bg-blue-50 rounded-lg p-3 -mx-1">
                            <div className="flex justify-between items-center">
                                <span className="text-blue-700 font-medium flex items-center">
                                <FaUserFriends className="mr-2" />
                                {referralDiscount.discount_type}
                                </span>
                                <span className="text-blue-700 font-medium">-GHS {referralDiscountAmount.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-blue-600 mt-1 ml-6">
                                {referralDiscount.percentage}% off your order
                            </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-2">
                            <p className="text-gray-600">Delivery Fee</p>
                            <p className="font-medium">
                            {delivery ? `GHS ${delivery.cost.toFixed(2)}` : '--'}
                            </p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-gray-600">Pickup Fee</p>
                            <p className="font-medium">
                            {useSame ? (delivery ? `GHS ${delivery.cost.toFixed(2)}` : '--') : (pickup ? `GHS ${pickup.cost.toFixed(2)}` : '--')}
                            </p>
                        </div>

                        <div className="flex justify-between pt-4 mt-3 border-t border-gray-200">
                            <p className="text-lg font-semibold">Total Amount</p>
                            <div className="text-right">
                            {(canUseSignup || canUseReferral) && (
                                <div className="text-sm text-gray-400 line-through">GHS {subtotal}</div>
                            )}
                            <p className="text-xl font-bold text-primary">
                                GHS {total}
                            </p>
                            </div>
                        </div>
                        </div>

                        {canUseSignup && signupDiscount && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-start">
                            <FaInfoCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                            <span>Your {signupDiscount.percentage}% sign-up discount has been applied!</span>
                        </div>
                        )}
                    </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                    onClick={handleSubmit}
                    disabled={placing || cart.length === 0 || !delivery || (!useSame && !pickup) || !isPhoneValid}
                    className={`w-full py-3.5 px-6 rounded-lg font-medium text-white transition-all ${
                        placing || cart.length === 0 || !delivery || (!useSame && !pickup) || !isPhoneValid
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg'
                    }`}
                    >
                    {placing ? (
                        <span className="flex items-center justify-center">
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        Processing...
                        </span>
                    ) : (
                        'Proceed to Payment'
                    )}
                    </button>

                    {cart.length === 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm flex items-center">
                        <FaExclamationTriangle className="mr-2" />
                        Your cart is empty. Add items to proceed with checkout.
                    </div>
                    )}
                </div>
                </div>
            </div>
        </>
    )
}

export default CheckoutSection