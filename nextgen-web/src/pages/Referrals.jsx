import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Wallet, Users, Copy, CheckCircle, Info, Landmark, ArrowRight, ShieldAlert, Share2 } from 'lucide-react';

export default function Referrals() {
  const { user, refreshProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  // Withdrawal Form
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [accName, setAccName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [confirmAccNumber, setConfirmAccNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.get('/wallet');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareCode = () => {
    if (stats?.referralCode) {
      const shareUrl = `${window.location.origin}/signup?ref=${stats.referralCode}`;
      if (navigator.share) {
        navigator.share({
          title: 'NextGen PowerCare',
          text: `Use my referral code ${stats.referralCode} to sign up for NextGen PowerCare!`,
          url: shareUrl
        }).catch(err => console.log('Error sharing:', err));
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      }
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!accName || !accNumber || !confirmAccNumber || !ifsc || !amount) {
      setWithdrawError('All fields are required');
      return;
    }
    if (accNumber !== confirmAccNumber) {
      setWithdrawError('Account numbers do not match');
      return;
    }
    if (parseFloat(amount) < 100) {
      setWithdrawError('Minimum withdrawal amount is ₹100');
      return;
    }
    if (parseFloat(amount) > stats.walletBalance) {
      setWithdrawError('Insufficient wallet balance');
      return;
    }

    setSubmitting(true);
    setWithdrawError('');
    try {
      await api.post('/wallet/withdraw', {
        accountName: accName,
        accountNumber: accNumber,
        ifscCode: ifsc,
        amount: parseFloat(amount)
      });
      setShowWithdrawForm(false);
      setAccName('');
      setAccNumber('');
      setConfirmAccNumber('');
      setIfsc('');
      setAmount('');
      fetchStats();
      refreshProfile();
      alert('Withdrawal request submitted successfully!');
    } catch (err) {
      setWithdrawError(err.response?.data?.message || err.message || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !stats) {
    return <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>Loading wallet...</div>;
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 16px', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>My Wallet & Referrals</h2>
        <button onClick={() => setShowTerms(true)} className="btn-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
          <Info size={18} />
          <span>Terms & Rewards</span>
        </button>
      </div>

      <div className="wallet-card" style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #00cec9 100%)',
        color: '#fff',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 184, 148, 0.3)',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem', fontWeight: 500 }}>Available Balance</p>
          <h1 style={{ margin: '8px 0 0', fontSize: '3rem', color: '#fff' }}>₹{stats.walletBalance}</h1>
        </div>
        
        <button 
          onClick={() => setShowWithdrawForm(true)} 
          className="btn" 
          style={{ backgroundColor: '#fff', color: 'var(--primary)', fontWeight: 700, padding: '12px 24px', borderRadius: '30px' }}
        >
          Withdraw Funds
        </button>
      </div>

      {showWithdrawForm && (
        <div className="glass-card animate-slide-up" style={{ padding: '24px', marginBottom: '32px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3><Landmark size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> Request Withdrawal</h3>
            <button onClick={() => setShowWithdrawForm(false)} className="btn-close" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#666' }}>×</button>
          </div>
          
          {withdrawError && (
            <div className="auth-error-banner" style={{ marginBottom: '16px' }}>
              <ShieldAlert size={16} />
              <span>{withdrawError}</span>
            </div>
          )}

          <form onSubmit={handleWithdraw} style={{ display: 'grid', gap: '16px' }}>
            <div className="form-group">
              <label>Account Holder Name</label>
              <input type="text" value={accName} onChange={e => setAccName(e.target.value)} required placeholder="Enter name as per bank account" />
            </div>
            
            <div className="form-group">
              <label>Account Number</label>
              <input type="password" value={accNumber} onChange={e => setAccNumber(e.target.value)} required placeholder="Enter account number" />
            </div>
            
            <div className="form-group">
              <label>Confirm Account Number</label>
              <input type="text" value={confirmAccNumber} onChange={e => setConfirmAccNumber(e.target.value)} required placeholder="Re-enter account number" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>IFSC Code</label>
                <input type="text" value={ifsc} onChange={e => setIfsc(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} required placeholder="e.g. SBIN0001234" />
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Min 100" min="100" max={stats.walletBalance} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Processing...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '16px' }}>Your Referral Code</h3>
          <div style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            padding: '16px', 
            borderRadius: '12px',
            fontSize: '1.8rem',
            fontWeight: 800,
            letterSpacing: '4px',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {stats.referralCode}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleCopyCode} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--primary)' : 'var(--text-secondary)' }}
                title="Copy Code"
              >
                {copied ? <CheckCircle size={24} /> : <Copy size={24} />}
              </button>
              <button 
                onClick={handleShareCode} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                title="Share Link"
              >
                <Share2 size={24} />
              </button>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Share this code with friends to earn wallet money!</p>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Users size={24} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>My Referrals ({stats.referrals.length})</h3>
          </div>
          
          {stats.referrals.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>You haven't referred anyone yet.</p>
          ) : (
            <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
              {stats.referrals.map((ref, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{ref.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(ref.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'block' }}>+₹{ref.amount}</span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      backgroundColor: ref.type === 'Direct' ? '#d1fae5' : '#dbeafe',
                      color: ref.type === 'Direct' ? '#047857' : '#1d4ed8',
                      padding: '2px 6px',
                      borderRadius: '8px'
                    }}>
                      {ref.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.withdrawals.length > 0 && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Withdrawal History</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Amount</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.withdrawals.map((w) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 8px' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>₹{w.amount}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: w.status === 'Pending' ? '#fef3c7' : w.status === 'In Progress' ? '#dbeafe' : w.status === 'Paid' ? '#d1fae5' : '#fee2e2',
                        color: w.status === 'Pending' ? '#b45309' : w.status === 'In Progress' ? '#1d4ed8' : w.status === 'Paid' ? '#047857' : '#b91c1c',
                      }}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTerms && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-content animate-slide-up" style={{ padding: '30px', maxWidth: '500px', backgroundColor: 'var(--bg-primary)', borderRadius: '16px', maxHeight: '85vh', overflowY: 'auto', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Referral Rewards & Terms</h3>
              <button onClick={() => setShowTerms(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Invite your friends to NextGen PowerCare and earn money directly into your wallet!
            </p>
            
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Reward Tiers</h4>
              <ul style={{ paddingLeft: '20px', margin: 0, color: '#4B5563', lineHeight: '1.6', fontSize: '0.9rem' }}>
                <li><strong>Direct Referrals:</strong></li>
                <li>&nbsp;&nbsp;1st referral: ₹200 <span style={{ color: '#047857', fontWeight: '600' }}>(Awarded after they purchase a subscription)</span></li>
                <li>&nbsp;&nbsp;2nd referral: ₹230</li>
                <li>&nbsp;&nbsp;... Increases by ₹30 until the 8th referral</li>
                <li>&nbsp;&nbsp;9th referral: ₹450</li>
                <li>&nbsp;&nbsp;10th+ referrals: ₹500 each</li>
                <li style={{ marginTop: '8px' }}><strong>2nd Level Referrals (Sub-referrals):</strong></li>
                <li>&nbsp;&nbsp;Flat ₹100 for every referral made by your direct referrals <span style={{ color: '#047857', fontWeight: '600' }}>(Awarded after they purchase a subscription)</span></li>
              </ul>
            </div>

            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, paddingLeft: '20px' }}>
              <li>Minimum withdrawal amount is ₹100.</li>
              <li>Withdrawal requests are processed within 2-3 business days.</li>
              <li>Providing incorrect bank details may result in rejection and wallet refund.</li>
            </ul>

            <button onClick={() => setShowTerms(false)} className="btn btn-primary btn-block" style={{ marginTop: '24px' }}>
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
