-- Migration V3: Rename ROSCA groups to boxes, group members to box members, and rosca rounds to box cycles

-- 1. Rename rosca_groups table to boxes
ALTER TABLE rosca_groups RENAME TO boxes;
ALTER TABLE boxes RENAME CONSTRAINT rosca_groups_pkey TO boxes_pkey;
ALTER TABLE boxes RENAME CONSTRAINT rosca_groups_invite_code_key TO boxes_invite_code_key;
ALTER TABLE boxes RENAME CONSTRAINT rosca_groups_owner_id_fkey TO boxes_owner_id_fkey;

-- 2. Rename group_members table to box_members and update columns
ALTER TABLE group_members RENAME TO box_members;
ALTER TABLE box_members RENAME COLUMN group_id TO box_id;
ALTER TABLE box_members RENAME COLUMN won_round_number TO won_cycle_number;
ALTER TABLE box_members RENAME CONSTRAINT group_members_pkey TO box_members_pkey;
ALTER TABLE box_members RENAME CONSTRAINT group_members_group_id_fkey TO box_members_box_id_fkey;
ALTER TABLE box_members RENAME CONSTRAINT group_members_user_id_fkey TO box_members_user_id_fkey;
ALTER TABLE box_members RENAME CONSTRAINT group_members_group_id_user_id_key TO box_members_box_id_user_id_key;

-- 3. Rename rosca_rounds table to box_cycles and update columns
ALTER TABLE rosca_rounds RENAME TO box_cycles;
ALTER TABLE box_cycles RENAME COLUMN group_id TO box_id;
ALTER TABLE box_cycles RENAME COLUMN round_number TO cycle_number;
ALTER TABLE box_cycles RENAME CONSTRAINT rosca_rounds_pkey TO box_cycles_pkey;
ALTER TABLE box_cycles RENAME CONSTRAINT rosca_rounds_group_id_fkey TO box_cycles_box_id_fkey;
ALTER TABLE box_cycles RENAME CONSTRAINT rosca_rounds_beneficiary_user_id_fkey TO box_cycles_beneficiary_user_id_fkey;
ALTER TABLE box_cycles RENAME CONSTRAINT rosca_rounds_group_id_round_number_key TO box_cycles_box_id_cycle_number_key;

-- 4. Update payment_obligations column and constraints
ALTER TABLE payment_obligations RENAME COLUMN round_id TO cycle_id;
ALTER TABLE payment_obligations RENAME CONSTRAINT payment_obligations_round_id_fkey TO payment_obligations_cycle_id_fkey;
ALTER TABLE payment_obligations RENAME CONSTRAINT payment_obligations_round_id_payer_user_id_key TO payment_obligations_cycle_id_payer_user_id_key;

-- 5. Update chat_messages column and constraints
ALTER TABLE chat_messages RENAME COLUMN group_id TO box_id;
ALTER TABLE chat_messages RENAME CONSTRAINT chat_messages_group_id_fkey TO chat_messages_box_id_fkey;

-- 6. Rename indexes to match new table and column names
ALTER INDEX IF EXISTS idx_group_members_group RENAME TO idx_box_members_box;
ALTER INDEX IF EXISTS idx_group_members_user RENAME TO idx_box_members_user;
ALTER INDEX IF EXISTS idx_rounds_group RENAME TO idx_cycles_box;
ALTER INDEX IF EXISTS idx_obligations_round RENAME TO idx_obligations_cycle;
ALTER INDEX IF EXISTS idx_chat_messages_group RENAME TO idx_chat_messages_box;
