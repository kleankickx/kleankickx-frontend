import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from 'react-toastify';
import {
  ClipboardIcon,
  GiftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  UserIcon,
  ChevronDownIcon,
  SparklesIcon,
  TicketIcon,
  ClockIcon,
  CheckBadgeIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import JSConfetti from 'js-confetti';

const jsConfetti = new JSConfetti();

// Helper function to get initials from email
const getInitials = (email) => {
  if (!email) return "";
  const parts = email.split("@")[0].split(/[._]/);
  return parts.map((part) => part.charAt(0).toUpperCase()).slice(0, 2).join("");
};

// Avatar component
const Avatar = ({ email }) => {
  const initials = getInitials(email);

  return (
    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-medium text-sm">
      {initials ? initials : <UserIcon className="h-4 w-4" />}
    </div>
  );
};

// Collapsible Section Component
const CollapsibleSection = ({ title, children, isOpen, onToggle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <button
      onClick={onToggle}
      className="flex justify-between items-center w-full p-6 focus:outline-none cursor-pointer hover:bg-gray-50 transition-colors duration-200"
    >
      <h2 className="text-lg font-semibold text-gray-800 flex items-center">
        <GiftIcon className="h-5 w-5 text-emerald-500 mr-2" />
        {title}
      </h2>
      <ChevronDownIcon
        className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
    
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-6">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// Discount Status Badge Component
const DiscountStatusBadge = ({ discount }) => {
  if (!discount) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <TicketIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-emerald-800">Active Discount</h3>
            <p className="text-sm text-emerald-600">{discount.percentage}% OFF</p>
            <p className="text-xs text-emerald-500 mt-1">
              Redeemed {discount.points_redeemed} points
            </p>
          </div>
        </div>
        <div className="flex items-center">
          {discount.is_applied ? (
            <div className="flex items-center text-green-600">
              <CheckBadgeIcon className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Applied</span>
            </div>
          ) : (
            <div className="flex items-center text-blue-600">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">Available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ReferralDashboard() {
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [points, setPoints] = useState(0);
  const [activeDiscount, setActiveDiscount] = useState({});
  const [redeemedHistory, setRedeemedHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showReferrals, setShowReferrals] = useState(true);
  const [loading, setLoading] = useState({
    code: true,
    referrals: true,
    points: true,
    redeeming: false,
    history: true,
  });
  const { api } = useContext(AuthContext);

  useEffect(() => {
    fetchReferralCode();
    fetchReferrals();
    fetchPoints();
    fetchActiveDiscount();
    fetchRedeemedHistory();
  }, []);

  const fetchReferralCode = async () => {
    try {
      const res = await api.get("/api/referrals/code/", { withCredentials: true });
      setCode(res.data.code);
      setLink(res.data.referral_link);
    } finally {
      setLoading((prev) => ({ ...prev, code: false }));
    }
  };

  const fetchReferrals = async () => {
    try {
      const res = await api.get("/api/referrals/stats/", { withCredentials: true });
      setReferrals(res.data);
    } finally {
      setLoading((prev) => ({ ...prev, referrals: false }));
    }
  };

  const fetchPoints = async () => {
    try {
      const res = await api.get("/api/referrals/points/", { withCredentials: true });
      setPoints(res.data.points);
    } finally {
      setLoading((prev) => ({ ...prev, points: false }));
    }
  };

  const fetchActiveDiscount = async () => {
    try {
      const res = await api.get("/api/referrals/active-discount/", { withCredentials: true });
      
      if (res.data) {
        
        setActiveDiscount(res.data);
      } else {
        setActiveDiscount(null);
      }
      
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setActiveDiscount(null);
      } else {
        console.error("Error fetching active discount:", err);
      }
    }
  };

  const fetchRedeemedHistory = async () => {
    try {
      // This endpoint might need to be created to get all redemption history
      const res = await api.get("/api/referrals/redeem/history/", { withCredentials: true });
      setRedeemedHistory(res.data);
    } catch (err) {
      console.error("Error fetching redemption history:", err);
    } finally {
      setLoading((prev) => ({ ...prev, history: false }));
    }
  };

  const redeemPoints = async () => {
    if (loading.redeeming || points < 50) return;
    
    try {
      setLoading((prev) => ({ ...prev, redeeming: true }));
      const res = await api.post(
        "/api/referrals/redeem/",
        {},
        { withCredentials: true }
      );
      
      if (res.data.discount_percentage) {
        // Refresh all data after successful redemption
        await Promise.all([
          fetchPoints(),
          fetchActiveDiscount(),
          fetchRedeemedHistory(),
        ]);
        
        // Show confetti celebration
        jsConfetti.addConfetti();
        
        toast.success('Points redeemed successfully! A ' + res.data.discount_percentage + '% discount would be applied to your next order.');
        
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        console.error("Error redeeming points:", err);
        alert("An error occurred while redeeming points.");
      }
    } finally {
      setLoading((prev) => ({ ...prev, redeeming: false }));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshData = async () => {
    setLoading({
      code: true,
      referrals: true,
      points: true,
      redeeming: false,
      history: true,
    });
    await Promise.all([
      fetchReferralCode(),
      fetchReferrals(),
      fetchPoints(),
      fetchActiveDiscount(),
      fetchRedeemedHistory(),
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
          <p className="text-gray-600 mt-1">Earn rewards by sharing with friends</p>
        </div>
        <button
          onClick={refreshData}
          disabled={Object.values(loading).some(Boolean)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowPathIcon
            className={`h-4 w-4 mr-1 ${Object.values(loading).some(Boolean) ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Referral Link Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <SparklesIcon className="h-5 w-5 text-purple-500 mr-2" />
              Your Referral Link
            </h2>
            {loading.code && (
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            )}
          </div>

          {loading.code ? (
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  value={link}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Share this link with friends and earn 100 points when they sign up
                and complete their first order.
              </p>

              {/* Active Discount */}
              {Object.keys(activeDiscount).length === 0 ? (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <XCircleIcon className="h-8 w-8 text-gray-300 mb-2" />
                    </motion.div>
                  </AnimatePresence>

                  <p className="text-sm font-medium text-gray-500">No active discount</p>
                  <p className="mt-1 text-xs text-gray-400">redeem points to get discounts!</p>
                </div>
                
              ) : (
                <div className="mt-4">
                  <DiscountStatusBadge discount={activeDiscount} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Points Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <GiftIcon className="h-5 w-5 text-amber-500 mr-2" />
              Your Points
            </h2>
            {loading.points && (
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            )}
          </div>

          {loading.points ? (
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Points */}
              <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700 mb-1">Current Balance</p>
                <p className="text-3xl font-bold text-amber-600">{points} pts</p>
              </div>

              

              {/* Redeem Button */}
             
              <motion.button
                onClick={redeemPoints}
                disabled={loading.redeeming || points < 50}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading.redeeming ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Redeem {points} Points
                  </>
                )}
              </motion.button>
              

              {points <= 50 &&  (
                <div className="text-center pt-4 text-gray-500">
                  <p>Minimum 50 points needed to redeem</p>
                  <p className="text-sm mt-1">Refer friends to earn points!</p>
                </div>
              )}

              {/* {activeDiscount && (
                <div className="text-center py-4 text-emerald-600">
                  <p>You have an active discount</p>
                  <p className="text-sm mt-1">Use it on your next purchase!</p>
                </div>
              )} */}
            </div>
          )}
        </div>
      </div>

      {/* Referrals Section */}
      <CollapsibleSection
        title="Your Referrals"
        isOpen={showReferrals}
        onToggle={() => setShowReferrals(!showReferrals)}
      >
        {loading.referrals ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-3">
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-8">
            <GiftIcon className="h-12 w-12 mx-auto text-gray-300" />
            <p className="text-gray-500 mt-2">
              No referrals yet. Share your link to get started!
            </p>
          </div>
        ) : (
          <div className="overflow-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrals.map((ref, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar email={ref.referred_email} />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {ref.referred_email}
                          </div>
                          <div className="text-xs text-gray-500">
                            Joined {new Date(ref.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                          ref.first_order_completed
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ref.first_order_completed
                          ? "Completed"
                          : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                      {ref.first_order_completed ? "50 pts" : "0 pts"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>

      {/* Redemption History Section */}
      <CollapsibleSection
        title="Redemption History"
        isOpen={showHistory}
        onToggle={() => setShowHistory(!showHistory)}
      >
        {loading.history ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-3">
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : redeemedHistory.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <TicketIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p>No redemption history yet</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {redeemedHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.points_redeemed} pts
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                      {item.discount_value}% OFF
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          item.is_applied
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.is_applied ? "Applied" : "Available"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}