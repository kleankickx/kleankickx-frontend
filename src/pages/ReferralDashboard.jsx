import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ClipboardIcon, GiftIcon, ArrowPathIcon, CheckCircleIcon, UserIcon } from "@heroicons/react/24/outline";

// Helper function to get initials from email
const getInitials = (email) => {
  if (!email) return "";
  const parts = email.split("@")[0].split(/[._]/);
  return parts
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
};

// Avatar component
const Avatar = ({ email }) => {
  const initials = getInitials(email);
  
  return (
    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600 font-medium text-sm">
      {initials ? (
        initials
      ) : (
        <UserIcon className="h-4 w-4 text-green-500" />
      )}
    </div>
  );
};

export default function ReferralDashboard() {
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [points, setPoints] = useState(0);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState({
    code: true,
    referrals: true,
    points: true,
    redeeming: false
  });
  const { api } = useContext(AuthContext);

  useEffect(() => {
    fetchReferralCode();
    fetchReferrals();
    fetchPoints();
  }, []);

  const fetchReferralCode = async () => {
    try {
      const res = await api.get("/api/referrals/code/", { withCredentials: true });
      setCode(res.data.code);
      setLink(res.data.referral_link);
    } finally {
      setLoading(prev => ({ ...prev, code: false }));
    }
  };

  const fetchReferrals = async () => {
    try {
      const res = await api.get("/api/referrals/stats/", { withCredentials: true });
      setReferrals(res.data);
    } finally {
      setLoading(prev => ({ ...prev, referrals: false }));
    }
  };

  const fetchPoints = async () => {
    try {
      const res = await api.get("/api/referrals/points/", { withCredentials: true });
      setPoints(res.data.points);
    } finally {
      setLoading(prev => ({ ...prev, points: false }));
    }
  };

  const redeemPoints = async () => {
    if (!redeemAmount || loading.redeeming) return;
    try {
      setLoading(prev => ({ ...prev, redeeming: true }));
      await api.post(
        "/api/referrals/redeem/",
        { points_to_redeem: redeemAmount },
        { withCredentials: true }
      );
      await fetchPoints();
      setRedeemAmount("");
    } finally {
      setLoading(prev => ({ ...prev, redeeming: false }));
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
      redeeming: false
    });
    await Promise.all([fetchReferralCode(), fetchReferrals(), fetchPoints()]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <button
          onClick={refreshData}
          disabled={loading.code || loading.referrals || loading.points}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading.code || loading.referrals || loading.points ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Referral Link Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <GiftIcon className="h-5 w-5 text-green-500 mr-2" />
              Your Referral Link
            </h2>
            {loading.code ? (
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            ) : null}
          </div>
          
          {loading.code ? (
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  value={link}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex cursor-pointer items-center transition-colors duration-200"
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
              <p className="text-xs text-gray-500 mt-1">
                Share this link with friends and earn points when they sign up and complete their first order.
              </p>
            </>
          )}
        </div>

        {/* Points Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Your Points</h2>
            {loading.points ? (
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            ) : null}
          </div>
          
          {loading.points ? (
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex space-x-2">
                <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-green-500 mb-6">{points} pts</p>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder="Enter points to redeem"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="1"
                  max={points}
                />
                <button
                  onClick={redeemPoints}
                  disabled={loading.redeeming || !redeemAmount || parseInt(redeemAmount) > points}
                  className="bg-green-500 cursor-pointer hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center w-24 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading.redeeming ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    "Redeem"
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {points > 0 ? `${points} points available to redeem` : "Earn points by referring friends"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Your Referrals</h2>
          {loading.referrals ? (
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
          ) : null}
        </div>
        
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
            <p className="text-gray-500 mt-2">No referrals yet. Share your link to get started!</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrals.map((ref, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Avatar email={ref.referred_email} />
                        </div>
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
                        className={`px-2 py-1 text-xs rounded-full ${
                          ref.first_order_completed
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ref.first_order_completed
                          ? "Completed First Order"
                          : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}