import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ClipboardIcon, GiftIcon } from "@heroicons/react/24/outline";

export default function ReferralDashboard() {
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [points, setPoints] = useState(0);
  const [redeemAmount, setRedeemAmount] = useState("");
  const { api } = useContext(AuthContext);

  useEffect(() => {
    fetchReferralCode();
    fetchReferrals();
    fetchPoints();
  }, []);

  const fetchReferralCode = async () => {
    const res = await api.get("/api/referrals/code/", { withCredentials: true });
    setCode(res.data.code);
    setLink(res.data.referral_link);
  };

  const fetchReferrals = async () => {
    const res = await api.get("/api/referrals/stats/", { withCredentials: true });
    setReferrals(res.data);
  };

  const fetchPoints = async () => {
    const res = await api.get("/api/referrals/points/", { withCredentials: true });
    setPoints(res.data.points);
  };

  const redeemPoints = async () => {
    if (!redeemAmount) return;
    try {
      await api.post(
        "/api/referrals/redeem/",
        { points_to_redeem: redeemAmount },
        { withCredentials: true }
      );
      fetchPoints();
      setRedeemAmount("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Referral Code Card */}
      <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <GiftIcon className="h-6 w-6 text-pink-500 mr-2" />
          Your Referral Link
        </h2>
        <div className="flex items-center space-x-2">
          <input
            value={link}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
          />
          <button
            onClick={() => navigator.clipboard.writeText(link)}
            className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded-lg text-sm flex items-center"
          >
            <ClipboardIcon className="h-4 w-4 mr-1" />
            Copy
          </button>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Referred Users</h2>
        {referrals.length === 0 ? (
          <p className="text-gray-500 text-sm">No referrals yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {referrals.map((ref, idx) => (
              <li key={idx} className="py-3 flex justify-between items-center">
                <span className="text-gray-700">{ref.referred_email}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    ref.first_order_completed
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ref.first_order_completed
                    ? "First Order Completed"
                    : "No Order Yet"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Points & Redeem */}
      <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Points</h2>
        <p className="text-3xl font-bold text-pink-500 mb-4">{points} pts</p>
        <div className="flex space-x-2">
          <input
            type="number"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            placeholder="Points to redeem"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={redeemPoints}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Redeem
          </button>
        </div>
      </div>
    </div>
  );
}
