import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

import { API_BASE, SOCKET_BASE } from '../utils/api';
const SENDER_STEPS = [
  { icon: 'tag', title: 'Step 1: Hash Payload', desc: 'SHA-256 applied to raw message bytes.', value: 'SHA256: 5f4dcc3b...e4f' },
  { icon: 'draw', title: 'Step 2: Digital Sign', desc: "RSA-PSS with SHA-256 signing the hash.", value: 'SIG: 0x72B...A09' },
  { icon: 'lock_person', title: 'Step 3: Encrypt Package', desc: "AES-256-GCM data encryption + RSA-OAEP Key Wrapping.", value: null },
];

const RECEIVER_STEPS = [
  { icon: 'key', title: 'Step 1: Decrypt Package', desc: "RSA-OAEP unwrapping + AES-256-GCM decryption.", value: null },
  { icon: 'fact_check', title: 'Step 2: Verify Signature', desc: "RSA-PSS Verification with Sender Public Key.", value: 'SIG: MATCHED' },
  { icon: 'tag', title: 'Step 3: Compare Hashes', desc: 'Comparing re-computed SHA-256 with original.', value: 'MATCH: SHA-256 OK' },
];

const StatusDot = ({ status }) => {
  const c = { online: 'bg-emerald-400', away: 'bg-amber-400', offline: 'bg-slate-300' };
  return <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${c[status]}`} />;
};

const Avatar = ({ contact, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-xl bg-gradient-to-br ${contact.color} flex items-center justify-center font-black text-white shadow-md`}>{contact.avatar}</div>
      <StatusDot status={contact.status} />
    </div>
  );
};

const RSAStep = ({ step, index, stepState }) => {
  const S = {
    completed: { wrap: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100', icon: 'text-emerald-600', label: 'DONE', lc: 'text-emerald-600', line: 'bg-emerald-300' },
    processing: { wrap: 'bg-violet-50 border-violet-200', iconBg: 'bg-violet-100', icon: 'text-violet-600', label: 'LIVE', lc: 'text-violet-600', line: 'bg-violet-300' },
    queued: { wrap: 'bg-slate-50 border-slate-200', iconBg: 'bg-slate-100', icon: 'text-slate-400', label: 'QUEUED', lc: 'text-slate-400', line: 'bg-slate-200' },
  }[stepState] || {};
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center gap-1">
        <div className={`w-8 h-8 rounded-full ${S.iconBg} border ${S.wrap?.split(' ')[1]} flex items-center justify-center flex-shrink-0 relative`}>
          <span className={`material-symbols-outlined text-[14px] ${S.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
          {stepState === 'processing' && <span className="absolute inset-0 rounded-full bg-violet-300/40 animate-ping" />}
        </div>
        {index < 2 && <div className={`w-0.5 h-6 rounded-full ${S.line}`} />}
      </div>
      <div className={`flex-1 p-3 rounded-xl border ${S.wrap} mb-2`}>
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-xs font-bold text-slate-700">{step.title}</h4>
          <span className={`text-[9px] font-black ${S.lc} flex items-center gap-1`}>
            {stepState === 'processing' && <span className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />}
            {S.label}
          </span>
        </div>
        <p className="text-[11px] text-slate-500">{step.desc}</p>
        {step.value && stepState !== 'queued' && (
          <div className="mt-2 font-mono text-[10px] text-slate-500 bg-white/80 rounded-lg px-2 py-1.5 border border-slate-200 truncate">{step.value}</div>
        )}
      </div>
    </div>
  );
};

const MessageBubble = ({ msg, contact, currentUser }) => {
  const isMe = msg.from === 'me';
  const badgeMap = { blue: 'bg-blue-100 text-blue-600 border-blue-200', violet: isMe ? 'bg-violet-500/20 text-violet-100 border-violet-400/30' : 'bg-violet-100 text-violet-600 border-violet-200', green: 'bg-emerald-100 text-emerald-600 border-emerald-200' };
  const [copied, setCopied] = useState(false);

  const handleCopy = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 max-w-[78%] ${isMe ? 'ml-auto flex-row-reverse' : ''} group`}>
      <div className="flex-shrink-0 mt-1">
        {!isMe
          ? <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${contact.color} flex items-center justify-center text-white text-xs font-black shadow-md`}>{contact.avatar}</div>
          : <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-xs font-black shadow-md">
              {(currentUser.username ? `@${currentUser.username}` : 'User').substring(0, 2).toUpperCase().replace(/@/g, '')}
            </div>}
      </div>
      <div className={isMe ? 'text-right' : ''}>
        <div className={`p-4 rounded-2xl shadow-sm ${isMe ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'}`}>
          <p className="text-sm leading-relaxed break-words break-all">{msg.text}</p>
          {msg.badge && (
            <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${badgeMap[msg.badgeColor]}`}>
              <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>{msg.badgeColor === 'blue' ? 'verified_user' : 'lock'}</span>
              {msg.badge}
            </div>
          )}
        </div>
        <div className={`flex items-center gap-2 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-slate-400">{msg.time}</span>
          {!isMe && msg.ciphertext && (
            <button 
              onClick={() => handleCopy(msg.ciphertext)}
              className={`text-[10px] font-black flex items-center gap-1 transition-all px-1.5 py-0.5 rounded cursor-pointer ${copied ? 'text-emerald-500 bg-emerald-50 opacity-100' : 'text-violet-500 hover:text-violet-700 opacity-0 group-hover:opacity-100 bg-violet-50'}`}
              title="Copy Ciphertext"
            >
              <span className="material-symbols-outlined text-[12px]">{copied ? 'check_circle' : 'content_copy'}</span>
              {copied && <span>COPIED</span>}
            </button>
          )}
          {isMe && (
            <button 
              onClick={() => msg.onDelete(msg.id)}
              className="text-[10px] font-black text-red-400 hover:text-red-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all bg-red-50 px-1.5 py-0.5 rounded cursor-pointer ml-1"
              title="Delete for Everyone"
            >
              <span className="material-symbols-outlined text-[12px]">delete</span>
              UNSEND
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── PROFILE & SETTINGS PANEL ── */
const ProfilePanel = ({ contacts = [], currentUser, onUserUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const dName = currentUser.username ? `@${currentUser.username}` : 'User';
  const dEmail = currentUser.email || 'no-email@rsa-secure.io';

  const [profile, setProfile] = useState({ 
    name: dName, 
    email: dEmail, 
    bio: currentUser.bio || 'Enter a short bio about yourself...', 
    keySize: 'RSA-4096', 
    theme: 'Light', 
    notifications: true, 
    autoEncrypt: true, 
    twoFactor: false 
  });
  const [tab, setTab] = useState('profile');
  const tabs = [{ id: 'profile', icon: 'person', label: 'Profile' }, { id: 'security', icon: 'security', label: 'Security' }, { id: 'keys', icon: 'key', label: 'Keys' }, { id: 'preferences', icon: 'tune', label: 'Preferences' }];

  const handleRotateKeys = async () => {
    // Confirmation intentionally removed per user request for a zero-popup flow
    
    try {
      const token = localStorage.getItem('rsa_token');
      const res = await axios.post(`${API_BASE}/users/rotate-keys`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const { privateKey, publicKey } = res.data.data;
        
        // Update local user data
        const updatedUser = { ...currentUser, publicKey };
        localStorage.setItem('rsa_user', JSON.stringify(updatedUser));
        onUserUpdate(updatedUser);
        localStorage.setItem('rsa_private_key', privateKey);
        
        // Trigger download of the new private key
        const blob = new Blob([privateKey], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RSA_PRIVATE_KEY_${currentUser.username || 'user'}_NEW.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // We don't alert here per user request
      }
    } catch (err) {
      console.error("Rotation error:", err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('rsa_token');
      const res = await axios.patch(`${API_BASE}/users/profile`, {
        username: profile.name.replace('@', ''),
        bio: profile.bio
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        localStorage.setItem('rsa_user', JSON.stringify(res.data.data.user));
        onUserUpdate(res.data.data.user);
        setEditMode(false);
      }
    } catch (err) {
      console.error("Save profile error:", err);
    }
  };


  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f4f5f7]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 pt-8 pb-0 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-violet-200">
                {profile.name.substring(0, 2).toUpperCase().replace(/@/g, '')}
              </div>
              {editMode && (
                <button className="absolute -bottom-2 -right-2 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-white text-[14px]">photo_camera</span>
                </button>
              )}
            </div>
            <div>
              {editMode
                ? <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-violet-300" />
                : <h2 className="text-2xl font-black text-slate-800">{profile.name}</h2>}
              <p className="text-sm text-slate-400 mt-1">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                  Search ID: {currentUser.id || 'N/A'}
                </span>
                <span className="text-[10px] font-black text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  KEY VERIFIED
                </span>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">RSA-4096</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${editMode ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700 border border-slate-200'}`}
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: `'FILL' ${editMode ? 1 : 0}` }}>{editMode ? 'save' : 'edit'}</span>
            {editMode ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${tab === t.id ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: `'FILL' ${tab === t.id ? 1 : 0}` }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
        {tab === 'profile' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-5">Personal Information</h3>
              <div className="space-y-4">
                {[{ label: 'Display Name', key: 'name', type: 'text' }, { label: 'Email Address', key: 'email', type: 'email' }].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
                    {editMode
                      ? <input type={type} value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all" />
                      : <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">{profile[key]}</p>}
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Bio</label>
                  {editMode
                    ? <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all resize-none" />
                    : <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">{profile.bio}</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-5">Account Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                {[{ label: 'Messages Sent', value: '0', icon: 'send', color: 'text-violet-600 bg-violet-50' }, { label: 'Signatures Created', value: '0', icon: 'draw', color: 'text-blue-600 bg-blue-50' }, { label: 'Verified Received', value: '0', icon: 'verified_user', color: 'text-emerald-600 bg-emerald-50' }].map(s => (
                  <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                    <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    </div>
                    <p className="text-xl font-black text-slate-800">{s.value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-5">Security Settings</h3>
              <div className="space-y-4">
                {[{ label: 'Two-Factor Authentication', desc: 'Require 2FA for all logins', key: 'twoFactor', icon: 'phonelink_lock' }, { label: 'Auto-Encrypt Messages', desc: 'Encrypt all outgoing messages automatically', key: 'autoEncrypt', icon: 'lock' }, { label: 'Notifications', desc: 'Get notified for new encrypted messages', key: 'notifications', icon: 'notifications' }].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px] text-violet-600" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => setProfile(p => ({ ...p, [item.key]: !p[item.key] }))}
                      className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${profile[item.key] ? 'bg-violet-600' : 'bg-slate-200'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${profile[item.key] ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-5">Danger Zone</h3>
              <div className="space-y-3">
                <button onClick={handleRotateKeys} className="w-full flex items-center gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left">
                  <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>key_off</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">Revoke Current Key Pair</p>
                    <p className="text-xs text-amber-600">Generate a new RSA key pair and revoke all old sessions</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-4 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left">
                  <span className="material-symbols-outlined text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
                  <div>
                    <p className="text-sm font-bold text-red-800">Delete Account</p>
                    <p className="text-xs text-red-500">Permanently remove your account and all encrypted data</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'keys' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-5">Your RSA Key Pair</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Public Key (RSA-4096)</span>
                    <button 
                      onClick={() => { 
                        if(currentUser.publicKey) { 
                          navigator.clipboard.writeText(currentUser.publicKey); 
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        } 
                      }} 
                      className={`flex items-center gap-1 text-xs font-bold transition-colors ${copiedKey ? 'text-emerald-500' : 'text-violet-600 hover:text-violet-700'}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{copiedKey ? 'check_circle' : 'content_copy'}</span> {copiedKey && 'COPIED'}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 break-all leading-relaxed bg-white border border-slate-100 rounded-xl p-3 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {currentUser.publicKey || 'No public key generated yet.'}
                  </div>
                </div>
                <div className="p-4 bg-violet-50 rounded-2xl border border-violet-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-violet-600 uppercase tracking-wider">Private Key</span>
                    <span className="material-symbols-outlined text-[16px] text-violet-500" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  </div>
                  <div className="font-mono text-[10px] text-violet-700 break-all leading-relaxed bg-white/60 border border-violet-100 rounded-xl p-3 blur-[3px] hover:blur-none transition-all duration-300 cursor-pointer max-h-[150px] overflow-y-auto no-scrollbar" title="Hover to reveal">
                    {localStorage.getItem('rsa_private_key') || 'No private key found in this session.'}
                  </div>
                  <p className="text-[10px] text-violet-400 mt-2">Hover to reveal · Never share this key</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    const pk = localStorage.getItem('rsa_private_key');
                    if (pk) {
                      const blob = new Blob([pk], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `RSA_PRIVATE_KEY_${currentUser?.username || 'user'}_EXPORT.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm font-bold transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span> Export Keys
                </button>
                <button onClick={handleRotateKeys} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold transition-colors">
                  <span className="material-symbols-outlined text-[16px]">refresh</span> Regenerate Keys
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-4">Trusted Public Keys</h3>
              <div className="space-y-3">
                {contacts.filter(c => c.keyVerified).map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xs font-black`}>{c.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">Key ID: 3fa8...b2c1</p>
                    </div>
                    <span className="material-symbols-outlined text-[14px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'preferences' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-5">Appearance & Behaviour</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Theme</label>
                  <div className="flex gap-3">
                    {['Light', 'Dark', 'System'].map(t => (
                      <button key={t} onClick={() => setProfile(p => ({ ...p, theme: t }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${profile.theme === t ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-300'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Default Key Size</label>
                  <div className="flex gap-3">
                    {['RSA-2048', 'RSA-4096'].map(k => (
                      <button key={k} onClick={() => setProfile(p => ({ ...p, keySize: k }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${profile.keySize === k ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-300'}`}>
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-4">Session</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Current Session</p>
                    <p className="text-xs text-slate-400">Windows · Chrome · Mumbai, IN</p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">ACTIVE</span>
                </div>
              </div>
              <button className="w-full mt-4 py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Sign Out of All Devices
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── MANUAL SENDER FLOW PANEL ── */
const ManualSenderFlow = ({ manualMsg, activeContact, onFinish }) => {
  const [step, setStep] = useState(1);
  const [hash, setHash] = useState('');
  const [signature, setSignature] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedSig, setCopiedSig] = useState(false);
  const [copiedCipher, setCopiedCipher] = useState(false);
  const [copiedOrig, setCopiedOrig] = useState(false);
  const [ciphertext, setCiphertext] = useState('');

  const [s2Hash, setS2Hash] = useState('');
  const [s3Msg, setS3Msg] = useState('');
  const [s3Sig, setS3Sig] = useState('');
  const [s2PrivKey, setS2PrivKey] = useState('');
  const [s3PubKey, setS3PubKey] = useState('');

  useEffect(() => {
    if (manualMsg) {
      setStep(1); setHash(''); setSignature(''); setCiphertext(''); setS2Hash(''); setS3Msg(''); setS3Sig('');
      setS2PrivKey(''); setS3PubKey('');
    }
  }, [manualMsg]);

  const handleGenHash = async () => {
    try {
      const token = localStorage.getItem('rsa_token');
      const res = await axios.post(`${API_BASE}/messages/flow/hash`, { message: manualMsg }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHash(res.data.data.hash);
    } catch (err) { console.error('Hash error:', err); }
  };

  const handleSign = async () => {
    try {
      const token = localStorage.getItem('rsa_token');
      const res = await axios.post(`${API_BASE}/messages/flow/sign`, { message: manualMsg, privateKey: s2PrivKey }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSignature(res.data.data.signature);
    } catch (err) { 
      console.error('Sign error:', err);
    }
  };

  const handleEncrypt = async () => {
    try {
      const token = localStorage.getItem('rsa_token');
      const res = await axios.post(`${API_BASE}/messages/flow/encrypt`, { 
        message: s3Msg, 
        signature: s3Sig, 
        publicKey: s3PubKey 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCiphertext(res.data.data.ciphertext);
    } catch (err) { 
      console.error('Encrypt error:', err);
    }
  };
  const copy = (val) => navigator.clipboard.writeText(val);

  if (!manualMsg) {
    return (
      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
        <span className="material-symbols-outlined text-3xl mb-2">keyboard</span>
        <p className="text-xs">Type a message and click send<br/>to begin manual execution.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── STEP 1 ── */}
      <div className={`p-4 rounded-2xl border transition-all ${step >= 1 ? 'bg-white border-slate-200 shadow-sm' : 'opacity-50 pointer-events-none grayscale'}`}>
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Step 1: Hash Message</h4>
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Original Message</label>
            <button 
              onClick={() => { navigator.clipboard.writeText(manualMsg); setCopiedOrig(true); setTimeout(() => setCopiedOrig(false), 2000); }} 
              className={`flex items-center gap-1 text-[10px] font-bold transition-all ${copiedOrig ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="material-symbols-outlined text-[14px]">{copiedOrig ? 'check_circle' : 'content_copy'}</span>
              {copiedOrig && <span>COPIED</span>}
            </button>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-100 mt-1 overflow-hidden">
            <div className="text-sm px-3 py-2 break-all max-h-[120px] overflow-y-auto custom-scrollbar">{manualMsg}</div>
          </div>
        </div>
        <button onClick={handleGenHash} disabled={!!hash} className="w-full mb-3 bg-violet-100 hover:bg-violet-200 text-violet-700 disabled:opacity-50 text-xs font-bold py-2 rounded-xl transition-all">GENERATE HASH</button>
        {hash && (
           <div className="relative">
             <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Output Hash</label>
                <button 
                  onClick={() => { navigator.clipboard.writeText(hash); setCopiedHash(true); setTimeout(() => setCopiedHash(false), 2000); }} 
                  className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${copiedHash ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}`}
                >
                  <span className="material-symbols-outlined text-[14px]">{copiedHash ? 'check_circle' : 'content_copy'}</span>
                  {copiedHash && 'COPIED'}
                </button>
              </div>
             <div className="bg-emerald-50 rounded-xl border border-emerald-200 mt-1 overflow-hidden">
               <div className="text-xs font-mono text-emerald-700 px-3 py-2 break-all max-h-[120px] overflow-y-auto custom-scrollbar">{hash}</div>
             </div>
           </div>
        )}
        {hash && step === 1 && (
          <button onClick={() => { setStep(2); }} className="w-full mt-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 rounded-xl transition-all">PROCEED TO SIGNING</button>
        )}
      </div>

      {/* ── STEP 2 ── */}
      <div className={`p-4 rounded-2xl border transition-all ${step >= 2 ? 'bg-white border-slate-200 shadow-sm' : 'opacity-50 pointer-events-none grayscale'}`}>
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Step 2: Digital Sign</h4>
        <div className="space-y-3 mb-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Hash to Sign (From Step 1)</label>
            <input value={s2Hash} onChange={e => setS2Hash(e.target.value)} className="w-full text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl mt-1 focus:ring-2 focus:ring-violet-300 outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
              Sender Private Key
              <span className="text-[9px] text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded-md">Copy from top</span>
            </label>
            <textarea 
              value={s2PrivKey} 
              onChange={e => setS2PrivKey(e.target.value)} 
              placeholder="Paste your private key here (include headers)..."
              rows={3}
              className="w-full text-[10px] font-mono bg-violet-50 text-violet-700 border border-violet-100 px-3 py-2 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-violet-300 resize-none" 
            />
          </div>
        </div>
        <button onClick={handleSign} disabled={!!signature} className="w-full mb-3 bg-violet-100 hover:bg-violet-200 text-violet-700 disabled:opacity-50 text-xs font-bold py-2 rounded-xl transition-all">SIGN HASH</button>
        {signature && (
           <div className="relative">
             <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Digital Signature</label>
                <button 
                  onClick={() => { navigator.clipboard.writeText(signature); setCopiedSig(true); setTimeout(() => setCopiedSig(false), 2000); }} 
                  className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${copiedSig ? 'text-emerald-600' : 'text-slate-400 hover:text-blue-600'}`}
                >
                  <span className="material-symbols-outlined text-[14px]">{copiedSig ? 'check_circle' : 'content_copy'}</span>
                  {copiedSig && 'COPIED'}
                </button>
              </div>
             <div className="bg-blue-50 rounded-xl border border-blue-200 mt-1 overflow-hidden">
               <div className="text-xs font-mono text-blue-700 px-3 py-2 break-all max-h-[120px] overflow-y-auto custom-scrollbar">{signature}</div>
             </div>
           </div>
        )}
        {signature && step === 2 && (
          <button onClick={() => { setStep(3); }} className="w-full mt-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 rounded-xl transition-all">PROCEED TO ENCRYPTION</button>
        )}
      </div>

      {/* ── STEP 3 ── */}
      <div className={`p-4 rounded-2xl border transition-all ${step >= 3 ? 'bg-white border-slate-200 shadow-sm' : 'opacity-50 pointer-events-none grayscale'}`}>
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Step 3: Encrypt</h4>
        <div className="space-y-3 mb-3">
          <div>
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Original Message</label>
              <button 
                onClick={() => { navigator.clipboard.writeText(s3Msg); setCopiedOrig(true); setTimeout(() => setCopiedOrig(false), 2000); }} 
                className={`flex items-center gap-1 text-[10px] font-bold transition-all ${copiedOrig ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="material-symbols-outlined text-[14px]">{copiedOrig ? 'check_circle' : 'content_copy'}</span>
                {copiedOrig && <span>COPIED</span>}
              </button>
            </div>
            <input value={s3Msg} onChange={e => setS3Msg(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Digital Signature</label>
            <input value={s3Sig} onChange={e => setS3Sig(e.target.value)} className="w-full text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
              Receiver Public Key
              <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">Copy from top</span>
            </label>
            <textarea 
              value={s3PubKey} 
              onChange={e => setS3PubKey(e.target.value)} 
              placeholder={`Paste ${activeContact?.name?.split(' ')[0] || ''}'s public key here...`}
              rows={3}
              className="w-full text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-2 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-emerald-300 resize-none" 
            />
          </div>
        </div>
        <button onClick={handleEncrypt} disabled={!!ciphertext} className="w-full mb-3 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 text-xs font-bold py-2 rounded-xl transition-all shadow-md shadow-violet-200">ENCRYPT PACKAGE</button>
        {ciphertext && (
           <div className="relative">
             <div className="flex justify-between items-center">
               <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">Ciphertext (JSON Block)</label>
               <button 
                  onClick={() => { navigator.clipboard.writeText(ciphertext); setCopiedCipher(true); setTimeout(() => setCopiedCipher(false), 2000); }} 
                  className={`flex items-center gap-1 text-[10px] font-bold transition-all ${copiedCipher ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="material-symbols-outlined text-[14px]">{copiedCipher ? 'check_circle' : 'content_copy'}</span>
                  {copiedCipher && <span>COPIED</span>}
                </button>
             </div>
             <div className="bg-slate-800 rounded-xl border border-slate-700 mt-1 overflow-hidden">
               <pre className="text-[10px] font-mono text-slate-300 px-3 py-3 overflow-y-auto whitespace-pre-wrap leading-relaxed max-h-[120px] custom-scrollbar">{ciphertext}</pre>
             </div>
           </div>
        )}
        {ciphertext && step === 3 && (
          <button onClick={() => onFinish({ text: manualMsg })} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black py-3 rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">send</span>SEND TO CHAT
          </button>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   ManualReceiverFlow Component
   ══════════════════════════════════════════ */
const ManualReceiverFlow = ({ activeContact }) => {
  const [step, setStep] = useState(1);
  const [ciphertext, setCiphertext] = useState('');
  const [privKey, setPrivKey] = useState('');
  const [decMsg, setDecMsg] = useState('');
  const [decSig, setDecSig] = useState('');

  const [s2Msg, setS2Msg] = useState('');
  const [s2Sig, setS2Sig] = useState('');
  const [s2PubKey, setS2PubKey] = useState('');
  const [vResult, setVResult] = useState(null);
  const [copiedDecMsg, setCopiedDecMsg] = useState(false);
  const [copiedDecSig, setCopiedDecSig] = useState(false);

  const handleDecrypt = async () => {
    try {
      const token = localStorage.getItem('rsa_token');
      const res = await axios.post(`${API_BASE}/messages/flow/decrypt`, { ciphertext, privateKey: privKey }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDecMsg(res.data.data.message);
      setDecSig(res.data.data.signature);
    } catch (err) {
      alert(err.response?.data?.message || 'Decryption failed - ensure headers are included!');
    }
  };

  const handleVerify = async () => {
    try {
      const token = localStorage.getItem('rsa_token');
      const res = await axios.post(`${API_BASE}/messages/flow/verify`, { message: s2Msg, signature: s2Sig, publicKey: s2PubKey }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVResult(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed - check public key!');
    }
  };

  return (
    <div className="space-y-6">
      {/* STEP 1: DECRYPT */}
      <div className={`p-4 rounded-2xl border transition-all ${step === 1 ? 'bg-white border-violet-200 shadow-sm' : 'bg-slate-50 border-slate-200 shadow-sm opacity-90'}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${step === 1 ? 'bg-violet-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>1</div>
          <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Decrypt Message (AES-RSA)</h4>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">Encrypted Package <span className="text-[9px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-md">From Sender</span></label>
            <textarea value={ciphertext} onChange={e => setCiphertext(e.target.value)} placeholder="Paste the encrypted base64 payload..." rows={2} className="w-full text-[10px] font-mono bg-slate-50 text-slate-600 border border-slate-200 px-3 py-2 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-violet-300 resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">Your Private Key <span className="text-[9px] text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded-md">Copy from top</span></label>
            <textarea value={privKey} onChange={e => setPrivKey(e.target.value)} placeholder="Paste your private key to unlock..." rows={2} className="w-full text-[10px] font-mono bg-violet-50 text-violet-700 border border-violet-200 px-3 py-2 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-violet-300 resize-none" />
          </div>
        </div>

        <button onClick={handleDecrypt} className="w-full mt-3 mb-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-md shadow-violet-100">{decMsg ? 'RE-DECRYPT PACKAGE' : 'DECRYPT PACKAGE'}</button>

        {decMsg && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-emerald-600 uppercase">Plaintext Result</span>
                <button 
                  onClick={() => { navigator.clipboard.writeText(decMsg); setCopiedDecMsg(true); setTimeout(() => setCopiedDecMsg(false), 2000); }} 
                  className={`flex items-center gap-1 transition-all ${copiedDecMsg ? 'text-emerald-500' : 'text-emerald-600 hover:text-emerald-800'}`} 
                  title="Copy Message"
                >
                  <span className="material-symbols-outlined text-[14px]">{copiedDecMsg ? 'check_circle' : 'content_copy'}</span>
                  {copiedDecMsg && <span className="text-[9px] font-black">COPIED</span>}
                </button>
              </div>
              <p className="text-xs text-slate-700 font-medium bg-white/50 p-2 rounded-lg border border-emerald-50">{decMsg}</p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-emerald-600 uppercase">Extracted Signature</span>
                <button 
                  onClick={() => { navigator.clipboard.writeText(decSig); setCopiedDecSig(true); setTimeout(() => setCopiedDecSig(false), 2000); }} 
                  className={`flex items-center gap-1 transition-all ${copiedDecSig ? 'text-emerald-500' : 'text-emerald-600 hover:text-emerald-800'}`} 
                  title="Copy Signature"
                >
                  <span className="material-symbols-outlined text-[14px]">{copiedDecSig ? 'check_circle' : 'content_copy'}</span>
                  {copiedDecSig && <span className="text-[9px] font-black">COPIED</span>}
                </button>
              </div>
              <div className="bg-white/50 p-2 rounded-lg border border-emerald-50">
                <p className="text-[9px] font-mono text-emerald-700 break-all leading-relaxed">{decSig.substring(0, 120)}...</p>
              </div>
              <p className="text-[8px] text-emerald-400 mt-1 italic">Click copy to get the full PSS signature block</p>
            </div>

            {step === 1 && (
              <button onClick={() => setStep(2)} className="w-full mt-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                PROCEED TO VERIFY <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* STEP 2: VERIFY */}
      <div className={`p-4 rounded-2xl border transition-all ${step === 2 ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${step === 2 ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>2</div>
          <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Verify Integrity (RSA-PSS)</h4>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">Message to Verify <span className="text-[9px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">Paste Decrypted msg</span></label>
            <textarea value={s2Msg} onChange={e => setS2Msg(e.target.value)} placeholder="Paste the plaintext message..." rows={1} className="w-full text-xs bg-slate-50 text-slate-600 border border-slate-200 px-3 py-2 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">Signature <span className="text-[9px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">Paste Sign from above</span></label>
            <textarea value={s2Sig} onChange={e => setS2Sig(e.target.value)} placeholder="Paste the digital signature..." rows={1} className="w-full text-[10px] font-mono bg-slate-50 text-slate-600 border border-slate-200 px-3 py-2 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">Sender Public Key <span className="text-[9px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-md">Copy from top</span></label>
            <textarea value={s2PubKey} onChange={e => setS2PubKey(e.target.value)} placeholder={`Paste ${activeContact?.name?.split(' ')[0] || 'Sender'}'s public key...`} rows={2} className="w-full text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>
        </div>

        <button onClick={handleVerify} disabled={!!vResult} className="w-full mt-3 bg-blue-100 hover:bg-blue-200 text-blue-700 disabled:opacity-50 text-xs font-bold py-2 rounded-xl transition-all">VERIFY SIGNATURE</button>

        {vResult && (
          <div className={`mt-3 p-3 border rounded-xl space-y-2 ${vResult.valid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">{vResult.valid ? 'check_circle' : 'error'}</span>
              <span className="text-[11px] font-black uppercase tracking-wider">{vResult.valid ? 'AUTHENTICATED' : 'SPOOFED / ALTERED'}</span>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Recv Hash: {vResult.hashA.substring(0, 20)}...</span>
              <span>Calc Hash: {vResult.hashB.substring(0, 20)}...</span>
            </div>
            {vResult.valid && (
              <button onClick={() => setStep(3)} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl shadow-md transition-all">FINISH REVIEW</button>
            )}
          </div>
        )}
      </div>

      {/* STEP 3: DONE */}
      {step === 3 && (
        <div className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 shadow-sm animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-emerald-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Verification Success</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-4">The message content was perfectly preserved during transit and guaranteed to be sent by <span className="font-bold text-slate-700">{activeContact.name}</span>.</p>
            <div className="w-full h-px bg-slate-200 mb-4" />
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
              <span className="px-2 py-1 rounded-md bg-white border border-emerald-100 italic">Integrity: 100%</span>
              <span className="px-2 py-1 rounded-md bg-white border border-emerald-100 italic">Origin: VALID</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── MAIN DASHBOARD ── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('rsa_user') || '{}'));
  const [contacts, setContacts] = useState([]);
  const [socket, setSocket] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const activeContactRef = useRef(null);

  // Sync activeContact with updated contacts list (ensure status/online updates in header)
  useEffect(() => {
    if (activeContact && contacts.length > 0) {
      const updated = contacts.find(c => c.id === activeContact.id);
      if (updated) {
        // Only update if something relevant changed to avoid unnecessary re-renders
        if (updated.status !== activeContact.status || updated.name !== activeContact.name || updated.publicKey !== activeContact.publicKey) {
          setActiveContact(updated);
          activeContactRef.current = updated;
        }
      }
    }
  }, [contacts, activeContact]);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [rsaMode, setRsaMode] = useState('auto');
  const [rsaPanelOpen, setRsaPanelOpen] = useState(false);
  const [flowTab, setFlowTab] = useState('sender');
  const [activeNav, setActiveNav] = useState('Messages');
  const [manualMsg, setManualMsg] = useState(null);
  const [searchVal, setSearchVal] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const handleDeleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('rsa_token');
      await axios.delete(`${API_BASE}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };
  const [rsaStepStates, setRsaStepStates] = useState(['completed', 'processing', 'queued']);
  const [isTyping, setIsTyping] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [rsaPanelWidth, setRsaPanelWidth] = useState(520);
  const [isResizing, setIsResizing] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('rsa_token');
    if (!token) { navigate('/auth'); return; }

    const verifySession = async () => {
      try {
        const res = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const user = res.data.data.user;
          localStorage.setItem('rsa_user', JSON.stringify(user));
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        localStorage.clear();
        navigate('/auth');
      }
    };
    verifySession();

    const fetchInitialData = async () => {
      try {
        const [contactsRes, activeRes] = await Promise.all([
          axios.get(`${API_BASE}/contacts/list`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE}/messages/active-conversations`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (contactsRes.data.success && activeRes.data.success) {
           const myUser = currentUser;
           const interactions = activeRes.data.data.interactions || [];
           const archivedIds = JSON.parse(localStorage.getItem('rsa_archived') || '[]');

           const formatted = contactsRes.data.data.users
             .filter(u => u.username !== myUser.username)
             .map(u => {
               const interaction = interactions.find(inter => inter.senderId === (u._id || u.id));

               return {
                 id: u._id || u.id,
                 name: u.username,
                 avatar: u.username.substring(0, 2).toUpperCase(),
                 color: 'from-violet-500 to-indigo-600',
                 status: u.isOnline ? 'online' : 'offline',
                 keyVerified: !!u.publicKey,
                 time: '',
                 lastMsg: u.isOnline ? 'Active now' : 'Offline',
                 unread: interaction ? interaction.unread : 0,
                 connected: true,
                 sentToMe: !!interaction,
                 archived: archivedIds.includes(u._id || u.id),
                 publicKey: u.publicKey
               };
             });

           // Inject people who sent messages but aren't in our contacts list
           interactions.forEach(inter => {
             if (inter.user && inter.user.username !== myUser.username && !formatted.find(f => f.id === inter.senderId)) {
               formatted.push({
                 id: inter.user.id,
                 name: inter.user.username,
                 avatar: inter.user.username.substring(0, 2).toUpperCase(),
                 color: 'from-violet-500 to-indigo-600',
                 status: inter.user.isOnline ? 'online' : 'offline',
                 keyVerified: !!inter.user.publicKey,
                 time: '',
                 lastMsg: inter.user.isOnline ? 'Active now' : 'Offline',
                 unread: inter.unread,
                 connected: false, // Not formally added as a contact
                 sentToMe: true,
                 archived: archivedIds.includes(inter.user.id),
                 publicKey: inter.user.publicKey
               });
             }
           });

           setContacts(formatted);
        }
      } catch(err) { console.error('Fetch users error:', err); }
    };

    fetchInitialData();

    // Socket connection
    const socketUrl = SOCKET_BASE;
    const newSocket = io(socketUrl, { auth: { token } });
    
    newSocket.on('message:new', async (newMsg) => {
      // Fetch plaintext via the new `/open` endpoint since the socket only gives us ciphertext
      const privateKey = localStorage.getItem('rsa_private_key');
      let msgText = "*** ENCRYPTED ***";
      try {
        const openRes = await axios.post(`${API_BASE}/messages/${newMsg.id}/open`, {
           receiverPrivateKey: privateKey
        }, {
           headers: { Authorization: `Bearer ${token}` }
        });
        if (openRes.data.success) {
           msgText = openRes.data.data.message;
        }
      } catch (err) {
        console.error("Socket decryption error:", err);
      }
      
      const currentActive = activeContactRef.current;
      if (currentActive && (currentActive.id === newMsg.sender.id || currentActive.name === newMsg.sender.username)) {
        setMessages(prev => [...prev, {
           id: newMsg.id || Date.now(),
           from: 'them',
           text: msgText,
           ciphertext: newMsg.ciphertext,
           time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
           badge: 'VERIFIED',
           badgeColor: 'green',
           onDelete: (id) => handleDeleteMessage(id)
        }]);
      }

      // Refetch contacts data to update unread counts and conversation list
      fetchInitialData();
    });
    
    newSocket.on('message:deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    newSocket.on('typing', ({ userId }) => {
      if (activeContactRef.current?.id === userId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });
    
    newSocket.on('user:online', () => fetchInitialData());
    newSocket.on('user:offline', () => fetchInitialData());

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [navigate]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e) => {
      const newWidth = document.body.clientWidth - e.clientX;
      if (newWidth >= 250 && newWidth <= 600) setRsaPanelWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const NAV_ITEMS = [
    { icon: 'chat', label: 'Messages' },
    { icon: 'contacts', label: 'Contacts' },
    { icon: 'inventory_2', label: 'Archive' },
  ];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (rsaMode !== 'auto') return;
    const idx = rsaStepStates.indexOf('processing');
    if (idx === -1) return;
    const t = setTimeout(() => {
      setRsaStepStates(prev => { const n = [...prev]; n[idx] = 'completed'; if (idx + 1 < n.length) n[idx + 1] = 'processing'; return n; });
    }, 2800);
    return () => clearTimeout(t);
  }, [rsaStepStates, rsaMode]);

  const handleSearchKeyPress = async (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      setIsSearching(true);
      setSearchResult(null);
      try {
        const token = localStorage.getItem('rsa_token');
        const res = await axios.get(`${API_BASE}/users/search/${searchVal.trim()}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
           setSearchResult(res.data.data.user);
        }
      } catch (err) {
        setSearchResult({ error: err.response?.data?.message || 'User not found' });
      } finally {
        setIsSearching(false);
      }
    } else if (e.key === 'Enter' && !searchVal.trim()) {
      setSearchResult(null);
    }
  };

  const handleAddContact = async (userId) => {
    try {
        const token = localStorage.getItem('rsa_token');
        const res = await axios.post(`${API_BASE}/contacts/add/${userId}`, {}, {
           headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
           setSearchResult(null);
           setSearchVal('');
           // Update the contact's connected flag in-place so the "Add Contact" button disappears
           setContacts(prev => prev.map(c => c.id === userId ? { ...c, connected: true } : c));
           // Also update activeContact if we just added the person we're chatting with
           setActiveContact(prev => prev && prev.id === userId ? { ...prev, connected: true } : prev);
        }
    } catch (err) {
        console.error('Add contact error:', err);
    }
  };

  const handleRemoveContact = async (userId) => {
    // Confirmation removed per user request
    try {
        const token = localStorage.getItem('rsa_token');
        const res = await axios.delete(`${API_BASE}/contacts/remove/${userId}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
           // Mark as not connected in local state (keep in Messages list since they messaged you)
           setContacts(prev => prev.map(c => c.id === userId ? { ...c, connected: false } : c));
           // Update activeContact so the Remove button switches back to Add Contact
           setActiveContact(prev => prev && prev.id === userId ? { ...prev, connected: false } : prev);
        }
    } catch (err) {
        console.error('Remove contact error:', err);
    }
  };

  const handleToggleArchive = (e, contactId) => {
    e.stopPropagation();
    const archived = JSON.parse(localStorage.getItem('rsa_archived') || '[]');
    let newArchived;
    let currentlyArchived = false;
    if (archived.includes(contactId)) {
      newArchived = archived.filter(id => id !== contactId);
      currentlyArchived = true;
    } else {
      newArchived = [...archived, contactId];
    }
    localStorage.setItem('rsa_archived', JSON.stringify(newArchived));
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, archived: !currentlyArchived } : c));
    if (activeContact?.id === contactId) {
      setActiveContact(prev => ({ ...prev, archived: !currentlyArchived }));
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'private') {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    } else if (type === 'public') {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    }
  };

  const sendToChat = async (text) => {
    const token = localStorage.getItem('rsa_token');
    const privateKey = localStorage.getItem('rsa_private_key');
    if (!activeContact || !token || !privateKey) return;

    const tempId = Date.now();
    setMessages(prev => [...prev, { 
      id: tempId, 
      from: 'me', 
      text, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      badge: 'ENCRYPTING...', 
      badgeColor: 'violet',
      onDelete: (id) => handleDeleteMessage(id)
    }]);
    setInputValue('');
    setManualMsg(null);
    if (textareaRef.current) textareaRef.current.style.height = '40px';
    setRsaStepStates(['processing', 'queued', 'queued']);

    try {
      const res = await axios.post(`${API_BASE}/messages/send`, {
         receiverUsername: activeContact.name,
         message: text,
         senderPrivateKey: privateKey
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
         setMessages(prev => prev.map(m => m.id === tempId ? { 
           ...m, 
           id: res.data.data.messageId, 
           badge: 'ENCRYPTED', 
           badgeColor: 'violet', 
           ciphertext: res.data.data.ciphertext 
         } : m));
         setRsaStepStates(['completed', 'completed', 'completed']);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, badge: 'FAILED', badgeColor: 'red' } : m));
    }
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    if (rsaMode === 'manual') {
      setManualMsg(text);
      setInputValue('');
      setFlowTab('sender');
      setRsaPanelOpen(true);
      if (textareaRef.current) textareaRef.current.style.height = '40px';
      return;
    }

    sendToChat(text);
  };

  const handleKeyDown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleTextareaChange = e => {
    setInputValue(e.target.value);
  };

  const handleContactSelect = async (c) => { 
    setActiveContact(c); 
    activeContactRef.current = c;
    setMessages([]);
    setShowProfile(false); 
    setManualMsg(null); 
    setRsaStepStates(['completed', 'processing', 'queued']);
    const token = localStorage.getItem('rsa_token');
    const privateKey = localStorage.getItem('rsa_private_key');
    
    try {
      const res = await axios.post(`${API_BASE}/messages/conversation/${c.id}/open`, {
         privateKey
      }, {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
         const history = res.data.data.conversation.map(msg => ({
            id: msg._id || msg.id,
            from: msg.direction === 'sent' ? 'me' : 'them',
            text: msg.message,
            ciphertext: msg.ciphertext,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            badge: msg.direction === 'sent' ? 'ENCRYPTED' : 'VERIFIED',
            badgeColor: msg.direction === 'sent' ? 'violet' : 'green',
            onDelete: (id) => handleDeleteMessage(id)
         }));
         setMessages(history);
         
         // Clear unread count locally for this contact so the UI updates
         setContacts(prev => prev.map(contact => contact.id === c.id ? { ...contact, unread: 0 } : contact));
      }
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  };
  const handleProfileClick = () => { setShowProfile(true); setActiveNav(''); };

  return (
    <div className="h-screen flex overflow-hidden font-body bg-[#f4f5f7]">

      {/* ── SIDEBAR ── */}
      <aside className="w-[272px] flex-shrink-0 flex flex-col h-full bg-white border-r border-slate-200/80 shadow-sm">
        <Link to="/" className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center shadow-md shadow-violet-200">
            <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
          </div>
          <div>
            <h1 className="font-headline font-black text-lg text-slate-800 leading-none">RSA Sign</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">End-to-end encrypted</p>
          </div>
        </Link>

        <div className="px-4 py-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input value={searchVal} onChange={e => { setSearchVal(e.target.value); if(!e.target.value) setSearchResult(null); }} onKeyDown={handleSearchKeyPress} className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300/50 focus:border-violet-300 transition-all" placeholder="Search ID + Enter..." />
          </div>
        </div>

        <nav className="px-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button key={item.label} onClick={() => { setActiveNav(item.label); setShowProfile(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeNav === item.label ? 'bg-violet-50 text-violet-700 border border-violet-100 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' ${activeNav === item.label ? 1 : 0}` }}>{item.icon}</span>
              {item.label}
              {item.label === 'Messages' && contacts.filter(c => !c.archived && c.sentToMe).reduce((s, c) => s + c.unread, 0) > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center">{contacts.filter(c => !c.archived && c.sentToMe).reduce((s, c) => s + c.unread, 0)}</span>
              )}
            </button>
          ))}
        </nav>


        {/* ── CONTEXT-AWARE SIDEBAR PANEL ── */}
        <div className="flex-1 overflow-y-auto mt-2 no-scrollbar">

          {/* SEARCH RESULT OVERLAY (if active) */}
          {searchResult && (
            <div className="px-3 mb-4">
               <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest px-2 mb-2 mt-2">Global Search</p>
               {searchResult.error ? (
                  <p className="text-xs text-red-500 px-2">{searchResult.error}</p>
               ) : (
                  <div className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-2xl transition-all text-left bg-violet-50 border border-violet-100 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-md">
                        {searchResult.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-violet-800 truncate block">{searchResult.username}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">New User</span>
                      </div>
                    </div>
                    <button onClick={() => handleAddContact(searchResult.id)} className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition shadow-sm flex-shrink-0">
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                    </button>
                  </div>
               )}
            </div>
          )}

          {/* MESSAGES — conversations list */}
          {activeNav === 'Messages' && !searchResult && (
            <div className="px-3 space-y-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 mt-2">Messages</p>
              {contacts.filter(c => !c.archived && c.sentToMe && c.name.toLowerCase().includes(searchVal.toLowerCase())).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-300 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                  <p className="text-xs text-slate-400">No conversations yet</p>
                </div>
              )}
              {contacts.filter(c => !c.archived && c.sentToMe && c.name.toLowerCase().includes(searchVal.toLowerCase())).map(contact => (
                <div key={contact.id} className="relative group">
                  <button onClick={() => handleContactSelect(contact)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left ${!showProfile && activeContact?.id === contact.id ? 'bg-violet-50 border border-violet-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}>
                    <Avatar contact={contact} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-bold truncate ${!showProfile && activeContact?.id === contact.id ? 'text-violet-800' : 'text-slate-700'}`}>{contact.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0 group-hover:opacity-0 transition-opacity">{contact.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {contact.keyVerified && <span className="material-symbols-outlined text-[11px] text-violet-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>}
                        <p className="text-xs text-slate-400 truncate">{contact.lastMsg}</p>
                        {contact.unread > 0 && <span className="ml-auto flex-shrink-0 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center group-hover:opacity-0 transition-opacity">{contact.unread}</span>}
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => handleToggleArchive(e, contact.id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-violet-600 opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Archive Chat"
                  >
                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  </button>
                </div>
              ))}
            </div>
          )}


          {/* contacts — same row layout as Messages */}
          {activeNav === 'Contacts' && !searchResult && (
            <div className="px-3 space-y-0.5">
              <div className="flex items-center justify-between px-2 mb-2 mt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connected ({contacts.filter(c => c.connected && !c.archived).length})</p>
                <button className="text-[10px] font-black text-violet-600 hover:text-violet-800 flex items-center gap-1 transition-colors">
                  <span className="material-symbols-outlined text-[12px]">person_add</span>Add
                </button>
              </div>
              {contacts.filter(c => c.connected && !c.archived && c.name.toLowerCase().includes(searchVal.toLowerCase())).map(contact => (
                <div key={contact.id} className="relative group">
                  <button onClick={() => handleContactSelect(contact)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left ${!showProfile && activeContact?.id === contact.id ? 'bg-violet-50 border border-violet-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}>
                    <Avatar contact={contact} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-bold truncate ${!showProfile && activeContact?.id === contact.id ? 'text-violet-800' : 'text-slate-700'}`}>{contact.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0 group-hover:opacity-0 transition-opacity">{contact.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {contact.keyVerified && <span className="material-symbols-outlined text-[11px] text-violet-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>}
                        <p className="text-xs text-slate-400 truncate">{contact.lastMsg}</p>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => handleToggleArchive(e, contact.id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-violet-600 opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Archive Chat"
                  >
                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ARCHIVE — same row layout as Messages, slightly muted */}
          {activeNav === 'Archive' && !searchResult && (
            <div className="px-3 space-y-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 mt-2">Archived ({contacts.filter(c => c.archived).length})</p>
              {contacts.filter(c => c.archived && c.name.toLowerCase().includes(searchVal.toLowerCase())).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-300 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                  <p className="text-xs text-slate-400">No archived chats</p>
                </div>
              )}
              {contacts.filter(c => c.archived && c.name.toLowerCase().includes(searchVal.toLowerCase())).map(contact => (
                <div key={contact.id} className="relative group">
                  <button onClick={() => handleContactSelect(contact)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left hover:bg-slate-50 border border-transparent opacity-70 hover:opacity-100">
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${contact.color} flex items-center justify-center font-black text-white shadow-md grayscale`}>{contact.avatar}</div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold truncate text-slate-500">{contact.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0 group-hover:opacity-0 transition-opacity">{contact.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[11px] text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                        <p className="text-xs text-slate-400 truncate">{contact.lastMsg}</p>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => handleToggleArchive(e, contact.id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Unarchive Chat"
                  >
                    <span className="material-symbols-outlined text-[18px]">unarchive</span>
                  </button>
                </div>
              ))}
              {contacts.filter(c => c.archived).length > 0 && (
                <p className="text-[10px] text-center text-slate-300 mt-4 pb-2">Archived messages are kept for 90 days</p>
              )}
            </div>
          )}

        </div>




        {/* Alex Rivera — clickable profile */}
        <div className="px-4 pb-4">
          <button onClick={handleProfileClick}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${showProfile ? 'bg-violet-50 border-violet-200 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-violet-200 hover:bg-violet-50'}`}>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow transition-all ${showProfile ? 'from-violet-600 to-violet-700 shadow-violet-200' : ''}`}>
              {(currentUser.username ? `@${currentUser.username}` : 'User').substring(0, 2).toUpperCase().replace(/@/g, '')}
            </div>
            <div className="overflow-hidden flex-1">
              <p className={`text-xs font-bold truncate transition-colors ${showProfile ? 'text-violet-700' : 'text-slate-700'}`}>
               {currentUser.username ? `@${currentUser.username}` : 'User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">S-ID: {currentUser.id || 'N/A'}</p>
            </div>
            <span className={`material-symbols-outlined text-[18px] transition-colors ${showProfile ? 'text-violet-500' : 'text-slate-400 group-hover:text-violet-400'}`}>settings</span>
          </button>
          
          <button onClick={() => { localStorage.clear(); window.location.href = '/auth'; }} className="w-full mt-2 flex items-center justify-center gap-2 p-2 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── CENTER PANEL ── */}
      {showProfile ? <ProfilePanel contacts={contacts} currentUser={currentUser} onUserUpdate={setCurrentUser} /> : (
        activeContact ? (
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(139,92,246,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.04) 0%, transparent 50%)' }} />

          <header className="flex justify-between items-center px-6 h-[72px] flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <Avatar contact={activeContact} size="lg" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-800 text-[15px] tracking-tight">{activeContact.name}</h2>
                  {activeContact.keyVerified && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100/50 shadow-sm shadow-violet-100/20">
                      <span className="material-symbols-outlined text-[10px] text-violet-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      <span className="text-[9px] font-black text-violet-600 tracking-wider">VERIFIED</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${activeContact.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse' : 'bg-slate-300'}`} />
                  <p className="text-[11px] font-medium text-slate-500">
                    {activeContact.status === 'online' ? 'Active Now' : 'Offline'}
                    <span className="mx-1 text-slate-300">•</span>
                    <span className="text-slate-400 font-normal">RSA-4096 Security</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/50 mr-2">
                {activeContact.connected ? (
                  <button
                    onClick={() => handleRemoveContact(activeContact.id)}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-500 hover:text-red-600 text-[11px] font-black rounded-lg transition-all"
                    title="Remove Contact"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_remove</span>
                    REMOVE
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddContact(activeContact.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black rounded-lg shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    ADD CONTACT
                  </button>
                )}
              </div>

              <div className="h-8 w-[1px] bg-slate-200 mx-1" />

              <button title="Conversation Info" className="w-9 h-9 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </button>

              <div className="relative flex bg-slate-100/60 p-1 rounded-xl border border-slate-200/40 shadow-sm w-[180px] overflow-hidden">
                {/* Sliding Background Indicator */}
                <div 
                  className={`absolute top-1 bottom-1 w-[86px] rounded-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-md ${
                    rsaMode === 'auto' 
                      ? 'translate-x-0 bg-indigo-600 shadow-indigo-200' 
                      : 'translate-x-[86px] bg-violet-600 shadow-violet-200'
                  }`}
                />
                
                <button 
                  onClick={() => { setRsaMode('auto'); setRsaPanelOpen(false); }}
                  className={`relative z-10 flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-colors duration-300 flex items-center justify-center gap-1.5 ${rsaMode === 'auto' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  AUTO
                </button>
                <button 
                  onClick={() => { setRsaMode('manual'); setRsaPanelOpen(true); }}
                  className={`relative z-10 flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-colors duration-300 flex items-center justify-center gap-1.5 ${rsaMode === 'manual' ? 'text-white' : 'text-slate-400 hover:text-violet-600'}`}
                >
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                  DEMO
                </button>
              </div>
            </div>
          </header>

          <div className="flex justify-center py-4 flex-shrink-0">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 tracking-widest bg-white border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-[11px] text-violet-500" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              SESSION ESTABLISHED · RSA-4096 · END-TO-END ENCRYPTED
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5 no-scrollbar relative z-10">
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} contact={activeContact} currentUser={currentUser} />)}
            {isTyping && (
              <div className="flex gap-3 max-w-[78%]">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${activeContact.color} flex items-center justify-center text-white text-xs font-black shadow-md`}>{activeContact.avatar}</div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5 shadow-sm">
                  {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <footer className="px-6 py-4 border-t border-slate-200/80 bg-white flex-shrink-0 relative z-10">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
              <button className="p-1.5 text-slate-400 hover:text-violet-600 transition-colors flex-shrink-0"><span className="material-symbols-outlined text-[20px]">add_circle</span></button>
              <textarea ref={textareaRef} value={inputValue} onChange={handleTextareaChange} onKeyDown={handleKeyDown} className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm text-slate-700 placeholder-slate-400 py-1.5 resize-none overflow-y-auto no-scrollbar" style={{ height: '40px' }} placeholder="Type an encrypted message..." />
              <button className="p-1.5 text-slate-400 hover:text-violet-600 transition-colors flex-shrink-0"><span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span></button>
              <button onClick={handleSend} disabled={!inputValue.trim()} className="w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-md shadow-violet-200">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">Messages are encrypted with RSA-4096 · Press <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">Enter</kbd> to send</p>
          </footer>
        </main>
        ) : (
          <main className="flex-1 flex flex-col items-center justify-center bg-[#f4f5f7] relative">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-300" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </div>
            <h2 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-1">No Active Chat</h2>
            <p className="text-xs text-slate-400">Select a contact to start securely messaging over RSA</p>
          </main>
        )
      )}

      {/* ── RIGHT RSA PANEL ── */}
      {rsaPanelOpen && !showProfile && activeContact && (
        <aside style={{ width: `${rsaPanelWidth}px` }} className="relative flex-shrink-0 flex flex-col h-full bg-white border-l border-slate-200/80">
          {isResizing && <style>{`body { cursor: col-resize !important; user-select: none !important; }`}</style>}
          <div 
            onMouseDown={() => setIsResizing(true)}
            className="absolute left-0 top-0 bottom-0 w-3 -translate-x-1.5 hover:bg-violet-400/40 active:bg-violet-500/50 cursor-col-resize z-50 transition-colors"
          />
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-brand text-lg text-slate-800">RSA Engine</h2>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest">Live Execution Monitor</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-violet-50 text-violet-600 border border-violet-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                {rsaMode} mode
              </div>
            </div>

            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[14px] text-slate-400">key</span>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Management</h3>
              </div>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-violet-50 border border-violet-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-violet-600 uppercase tracking-wider">Your Private Key</span>
                    <button
                      onClick={() => handleCopy(localStorage.getItem('rsa_private_key'), 'private')}
                      className={`flex items-center gap-1 transition-all ${copiedPrivate ? 'text-emerald-500' : 'text-violet-500 hover:text-violet-700'}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{copiedPrivate ? 'check_circle' : 'content_copy'}</span>
                      {copiedPrivate && <span className="text-[9px] font-black">COPIED</span>}
                    </button>
                  </div>
                  <div
                    className="font-mono text-[10px] text-violet-700 break-all w-full leading-relaxed blur-[3px] hover:blur-none transition-all duration-300 cursor-pointer select-none max-h-[100px] overflow-y-auto no-scrollbar"
                    title="Hover to reveal key"
                  >
                    {localStorage.getItem('rsa_private_key') || 'No private key found'}
                  </div>
                  <p className="text-[9px] text-violet-400 mt-1.5">Hover to reveal · Never shared</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{activeContact.name.split(' ')[0]}'s Pub Key</span>
                    <button
                      onClick={() => handleCopy(activeContact.publicKey, 'public')}
                      className={`flex items-center gap-1 transition-all ${copiedPublic ? 'text-emerald-500' : 'text-slate-400 hover:text-violet-600'}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{copiedPublic ? 'check_circle' : 'content_copy'}</span>
                      {copiedPublic && <span className="text-[9px] font-black">COPIED</span>}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 break-all w-full leading-relaxed max-h-[100px] overflow-y-auto no-scrollbar">
                    {activeContact.publicKey || 'Key not verified'}
                  </div>
                </div>
              </div>
            </section>

            <div className="h-px bg-slate-100 mb-6" />

            <section className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">timeline</span>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Flow</h3>
                </div>
                {rsaMode === 'manual' && (
                  <button onClick={() => setRsaStepStates(prev => { const idx = prev.indexOf('processing'); if (idx === -1) return prev; const n = [...prev]; n[idx] = 'completed'; if (idx + 1 < n.length) n[idx + 1] = 'processing'; return n; })}
                    className="text-[10px] font-black text-violet-600 hover:text-violet-800 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">play_arrow</span>NEXT STEP
                  </button>
                )}
              </div>
              <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl">
                <button onClick={() => { setFlowTab('sender'); setRsaStepStates(['completed', 'processing', 'queued']); }} className={`flex-1 text-[9px] font-black py-1.5 rounded-lg transition-all ${flowTab === 'sender' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>SENDER FLOW</button>
                <button onClick={() => { setFlowTab('receiver'); setRsaStepStates(['completed', 'processing', 'queued']); }} className={`flex-1 text-[9px] font-black py-1.5 rounded-lg transition-all ${flowTab === 'receiver' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>RECEIVER FLOW</button>
              </div>
              {rsaMode === 'manual' ? (
                flowTab === 'sender' ? (
                  <ManualSenderFlow manualMsg={manualMsg} activeContact={activeContact} onFinish={({text}) => sendToChat(text)} />
                ) : (
                  <ManualReceiverFlow activeContact={activeContact} />
                )
              ) : (
                (flowTab === 'sender' ? SENDER_STEPS : RECEIVER_STEPS).map((step, i) => <RSAStep key={i} step={step} index={i} stepState={rsaStepStates[i]} />)
              )}
            </section>

            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-700">Integrity Confirmed</h5>
                  <p className="text-[10px] text-emerald-600">End-to-end verified</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">Your connection to <span className="text-slate-700 font-bold">{activeContact.name}</span> is secured with RSA-4096. No third parties can intercept this channel.</p>
              <button className="w-full text-[10px] font-black text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-emerald-200 hover:border-emerald-300 bg-white/70 hover:bg-white transition-all">
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>VIEW PROTOCOL LOGS
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {[{ label: 'Messages', value: messages.length, icon: 'chat', color: 'text-slate-500' }, { label: 'Encrypted', value: messages.filter(m => m.badge === 'ENCRYPTED').length, icon: 'lock', color: 'text-violet-500' }, { label: 'Verified', value: messages.filter(m => m.badge === 'VERIFIED').length, icon: 'verified_user', color: 'text-emerald-500' }].map(stat => (
                <div key={stat.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center hover:border-violet-200 hover:bg-violet-50 transition-all">
                  <span className={`material-symbols-outlined text-[14px] ${stat.color} block mb-1`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                  <p className="text-lg font-black text-slate-700">{stat.value}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
