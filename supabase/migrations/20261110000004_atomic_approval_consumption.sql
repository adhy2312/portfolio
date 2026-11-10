-- ════════════════════════════════════════════════════════════════════
-- MINI-ADHY DATABASE MIGRATION: 004_atomic_approval_consumption.sql
-- ════════════════════════════════════════════════════════════════════
-- Implements single-transaction atomic approval consumption with row locking,
-- token replay prevention, payload digest verification, and audit event insertion.

-- 1. Ensure unique constraint on approval_consumptions(token_hash)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_approval_consumptions_token_hash'
  ) THEN
    ALTER TABLE public.approval_consumptions
      ADD CONSTRAINT uq_approval_consumptions_token_hash UNIQUE (token_hash);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. PostgreSQL Function for Atomic Approval Consumption
CREATE OR REPLACE FUNCTION public.consume_approval_atomic(
  p_approval_id TEXT,
  p_token_hash TEXT,
  p_owner_id TEXT,
  p_action_type TEXT,
  p_target_service TEXT,
  p_payload_hash TEXT,
  p_consumer_identity TEXT,
  p_current_epoch_ms BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_approval public.approval_requests%ROWTYPE;
  v_now_timestamptz TIMESTAMPTZ := NOW();
  v_jwt_role TEXT;
  v_jwt_sub TEXT;
BEGIN
  -- 0. Untrusted Role Check: Block execution by anon or authenticated roles
  v_jwt_role := NULLIF(current_setting('request.jwt.claim.role', true), '');
  IF current_user IN ('anon', 'authenticated') OR v_jwt_role IN ('anon', 'authenticated') THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'UNAUTHORIZED_ROLE',
      'error', 'Permission denied: direct execution by untrusted database roles is prohibited.'
    );
  END IF;

  -- 0b. Caller Owner Check: If caller has a JWT sub claim, do not trust caller-supplied p_owner_id blindly
  v_jwt_sub := NULLIF(current_setting('request.jwt.claim.sub', true), '');
  IF v_jwt_sub IS NOT NULL AND v_jwt_sub <> p_owner_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'OWNER_MISMATCH',
      'error', 'Caller authenticated subject does not match requested owner identity.'
    );
  END IF;

  -- 1. Anti-Replay check: Fast fail if token was already consumed
  IF EXISTS (SELECT 1 FROM public.approval_consumptions WHERE token_hash = p_token_hash) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'TOKEN_ALREADY_USED',
      'error', 'Token replay detected: token has already been consumed.'
    );
  END IF;

  -- 2. Lock the target approval request row FOR UPDATE to prevent race conditions
  SELECT * INTO v_approval
  FROM public.approval_requests
  WHERE approval_id = p_approval_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'APPROVAL_NOT_FOUND',
      'error', 'Approval request not found.'
    );
  END IF;

  -- 3. Verify status eligibility
  IF v_approval.status = 'CONSUMED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'TOKEN_ALREADY_USED',
      'error', 'Approval has already been consumed.'
    );
  END IF;

  IF v_approval.status NOT IN ('PENDING_OWNER_APPROVAL', 'APPROVED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'INVALID_STATUS',
      'error', 'Approval is in invalid state: ' || v_approval.status
    );
  END IF;

  -- 4. Expiration check
  IF v_approval.expires_at <= v_now_timestamptz THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'TOKEN_EXPIRED',
      'error', 'Approval token has expired.'
    );
  END IF;

  -- 5. Owner identity verification (verifies against row owner_id)
  IF v_approval.owner_id <> p_owner_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'OWNER_MISMATCH',
      'error', 'Approval was not issued for this owner identity.'
    );
  END IF;

  -- 6. Verify token hash against the stored approval token
  IF v_approval.token IS NOT NULL THEN
    IF encode(sha256(convert_to(v_approval.token, 'UTF8')), 'hex') <> p_token_hash THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'INVALID_TOKEN_SIGNATURE',
        'error', 'Supplied token hash does not match stored approval token hash.'
      );
    END IF;
  END IF;

  -- 7. Action type verification
  IF p_action_type IS NOT NULL AND v_approval.action_type <> p_action_type THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'ACTION_MISMATCH',
      'error', 'Action mismatch: expected ' || v_approval.action_type || ', got ' || p_action_type
    );
  END IF;

  -- 8. Target service verification
  IF p_target_service IS NOT NULL AND v_approval.target_service <> p_target_service THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'SERVICE_MISMATCH',
      'error', 'Service mismatch: expected ' || v_approval.target_service || ', got ' || p_target_service
    );
  END IF;

  -- 9. Payload digest verification (Tamper detection)
  IF p_payload_hash IS NOT NULL AND v_approval.payload_hash <> p_payload_hash THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'PAYLOAD_HASH_MISMATCH_TAMPERED',
      'error', 'Payload tampering detected: digest does not match authorized approval.'
    );
  END IF;

  -- 10. Atomically update approval status to CONSUMED
  UPDATE public.approval_requests
  SET
    status = 'CONSUMED',
    consumed_at = v_now_timestamptz,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'consumedBy', p_consumer_identity,
      'consumedAt', v_now_timestamptz
    )
  WHERE approval_id = p_approval_id;

  -- 11. Record consumption in approval_consumptions table
  INSERT INTO public.approval_consumptions (
    approval_id,
    consumed_by,
    token_hash,
    consumed_at
  ) VALUES (
    p_approval_id,
    p_consumer_identity,
    p_token_hash,
    v_now_timestamptz
  );

  -- 12. Record immutable audit event
  INSERT INTO public.audit_events (
    event_type,
    actor_id,
    target_resource,
    payload_hash,
    risk_tier,
    status,
    details
  ) VALUES (
    'APPROVAL_TOKEN_CONSUMED',
    p_owner_id,
    'approval:' || p_approval_id,
    v_approval.payload_hash,
    'CONTROLLED',
    'SUCCESS',
    jsonb_build_object(
      'actionType', v_approval.action_type,
      'targetService', v_approval.target_service,
      'consumerIdentity', p_consumer_identity
    )
  );

  -- 13. Transaction commits atomically and returns success
  RETURN jsonb_build_object(
    'success', true,
    'approvalId', p_approval_id,
    'status', 'CONSUMED',
    'authorizedAt', v_now_timestamptz
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'TOKEN_ALREADY_USED',
      'error', 'Token already consumed (unique constraint violation).'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'TRANSACTION_ABORTED',
      'error', SQLERRM
    );
END;
$$;

-- 3. Explicitly revoke and grant execution privileges
REVOKE EXECUTE ON FUNCTION public.consume_approval_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_approval_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_approval_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT) TO service_role;
