-- 1. Users & Banking Coordinates
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    avatar_url TEXT,
    default_card_number VARCHAR(16),
    default_iban VARCHAR(26),
    default_bank_name VARCHAR(64),
    default_account_holder VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ROSCA Groups (Sandogh)
CREATE TABLE rosca_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(150) NOT NULL,
    calculation_mode VARCHAR(24) NOT NULL, -- 'TARGET_POT' | 'FIXED_CONTRIBUTION'
    base_amount BIGINT NOT NULL,           -- In Iranian Toman (IRT)
    currency VARCHAR(8) NOT NULL DEFAULT 'IRT',
    cycle_interval VARCHAR(20) NOT NULL,   -- 'WEEKLY' | 'MONTHLY'
    jalali_due_day INT NOT NULL,           -- 1 to 31
    grace_period_hours INT NOT NULL DEFAULT 48,
    status VARCHAR(24) NOT NULL DEFAULT 'RECRUITING', -- 'RECRUITING' | 'ACTIVE' | 'COMPLETED' | 'PAUSED'
    invite_code VARCHAR(16) UNIQUE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Group Memberships
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES rosca_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(16) NOT NULL DEFAULT 'MEMBER',   -- 'OWNER' | 'MEMBER'
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE', -- 'INVITED' | 'ACTIVE' | 'REMOVED'
    has_won_pot BOOLEAN NOT NULL DEFAULT FALSE,
    won_round_number INT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);

-- 4. Group Rounds / Cycles
CREATE TABLE rosca_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES rosca_groups(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    due_date DATE NOT NULL,
    jalali_due_date_label VARCHAR(16) NOT NULL,
    beneficiary_user_id UUID REFERENCES users(id),
    payout_card_snapshot VARCHAR(16),
    payout_iban_snapshot VARCHAR(26),
    payout_bank_snapshot VARCHAR(64),
    payout_holder_snapshot VARCHAR(120),
    total_pot_amount BIGINT NOT NULL,
    per_member_share BIGINT NOT NULL,
    draw_seed VARCHAR(128),
    draw_target_angle INT,
    draw_completed_at TIMESTAMPTZ,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING_DRAW', -- 'PENDING_DRAW' | 'COLLECTING' | 'SETTLED'
    UNIQUE (group_id, round_number)
);

-- 5. Bilateral Payment Obligations
CREATE TABLE payment_obligations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES rosca_rounds(id) ON DELETE CASCADE,
    payer_user_id UUID NOT NULL REFERENCES users(id),
    beneficiary_user_id UUID NOT NULL REFERENCES users(id),
    amount BIGINT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'RECEIPT_SUBMITTED' | 'CONFIRMED' | 'REJECTED'
    receipt_image_key TEXT,
    tracking_reference VARCHAR(64),
    rejection_reason TEXT,
    idempotency_key UUID UNIQUE,
    submitted_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE (round_id, payer_user_id)
);

-- 6. Group Chat & Activity Stream
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES rosca_groups(id) ON DELETE CASCADE,
    sender_user_id UUID REFERENCES users(id),     -- NULL for automated system events
    message_type VARCHAR(24) NOT NULL,            -- 'TEXT' | 'RECEIPT_CARD' | 'SYSTEM_EVENT'
    content TEXT,
    attachment_key TEXT,
    related_obligation_id UUID REFERENCES payment_obligations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-frequency queries
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_rounds_group ON rosca_rounds(group_id);
CREATE INDEX idx_obligations_round ON payment_obligations(round_id);
CREATE INDEX idx_obligations_payer ON payment_obligations(payer_user_id);
CREATE INDEX idx_obligations_beneficiary ON payment_obligations(beneficiary_user_id);
CREATE INDEX idx_chat_messages_group ON chat_messages(group_id, created_at DESC);
