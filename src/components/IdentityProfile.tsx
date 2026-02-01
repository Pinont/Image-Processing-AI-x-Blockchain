import React, { useState, useEffect } from 'react';
import { useIdentity } from '../hooks/useIdentity';
import './IdentityProfile.css';

const IdentityProfile: React.FC = () => {
    const { identity, loading, syncing, updateIdentity } = useIdentity();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        bio: ''
    });

    useEffect(() => {
        if (identity) {
            setFormData({
                username: identity.profile.username,
                bio: identity.profile.bio
            });
        }
    }, [identity]);

    if (loading) return <div className="identity-loading">Loading Identity...</div>;
    if (!identity) return <div className="identity-empty">Connect Wallet to view Identity</div>;

    const handleSave = async () => {
        // Update identity
        const newIdentity = {
            ...identity,
            profile: {
                ...identity.profile,
                username: formData.username,
                bio: formData.bio
            }
        };
        await updateIdentity(newIdentity);
        setIsEditing(false);
    };

    return (
        <div className="identity-profile-container">
            <div className="identity-header">
                <h3>On-Chain Identity</h3>
                {syncing && <span className="sync-badge">Syncing to IPFS...</span>}
            </div>

            <div className="identity-card">
                <div className="identity-avatar">
                    {identity.profile.avatar ? (
                        <img src={identity.profile.avatar} alt="Avatar" />
                    ) : (
                        <div className="avatar-placeholder">{identity.profile.username[0]}</div>
                    )}
                </div>

                {isEditing ? (
                    <div className="identity-form">
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Username"
                        />
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Bio"
                        />
                        <div className="form-actions">
                            <button onClick={handleSave} disabled={syncing}>Save</button>
                            <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="identity-info">
                        <h4>{identity.profile.username}</h4>
                        <p>{identity.profile.bio}</p>
                        <button onClick={() => setIsEditing(true)} className="edit-btn">Edit Profile</button>
                    </div>
                )}
            </div>

            <div className="identity-stats">
                <div className="stat-item">
                    <label>Chats</label>
                    <span>{identity.chats.length}</span>
                </div>
                <div className="stat-item">
                    <label>Last Updated</label>
                    <span>{new Date(identity.lastUpdated).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};

export default IdentityProfile;
