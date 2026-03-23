-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ──────────────────────────────────────────────────────────
CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE subscription_plan AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING');
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- ─── Tenants ────────────────────────────────────────────────────────
CREATE TABLE tenants (
  id                VARCHAR(30)       PRIMARY KEY DEFAULT encode(gen_random_bytes(15), 'hex'),
  name              VARCHAR(255)      NOT NULL,
  slug              VARCHAR(100)      NOT NULL UNIQUE,
  domain            VARCHAR(255)      UNIQUE,
  logo_url          TEXT,
  status            tenant_status     NOT NULL DEFAULT 'ACTIVE',
  plan              subscription_plan NOT NULL DEFAULT 'FREE',
  keycloak_realm    VARCHAR(255),
  keycloak_client_id VARCHAR(255),
  max_users         INTEGER           NOT NULL DEFAULT 5,
  max_api_calls     INTEGER           NOT NULL DEFAULT 1000,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_status ON tenants(status);

-- ─── Users ──────────────────────────────────────────────────────────
CREATE TABLE users (
  id            VARCHAR(30)  PRIMARY KEY DEFAULT encode(gen_random_bytes(15), 'hex'),
  tenant_id     VARCHAR(30)  NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  keycloak_id   VARCHAR(255) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  avatar_url    TEXT,
  role          user_role    NOT NULL DEFAULT 'USER',
  status        user_status  NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX idx_users_email ON users(email);

-- ─── Subscriptions ──────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                   VARCHAR(30)         PRIMARY KEY DEFAULT encode(gen_random_bytes(15), 'hex'),
  tenant_id            VARCHAR(30)         NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan                 subscription_plan   NOT NULL DEFAULT 'FREE',
  status               subscription_status NOT NULL DEFAULT 'ACTIVE',
  stripe_customer_id   VARCHAR(255),
  stripe_sub_id        VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN             NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);

-- ─── Feature Flags ──────────────────────────────────────────────────
CREATE TABLE feature_flags (
  id          VARCHAR(30) PRIMARY KEY DEFAULT encode(gen_random_bytes(15), 'hex'),
  tenant_id   VARCHAR(30) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key         VARCHAR(100) NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  config      JSONB,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX idx_feature_flags_tenant_id ON feature_flags(tenant_id);

-- ─── Audit Logs ─────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          VARCHAR(30) PRIMARY KEY DEFAULT encode(gen_random_bytes(15), 'hex'),
  tenant_id   VARCHAR(30) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     VARCHAR(30) REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  resource    VARCHAR(100) NOT NULL,
  resource_id VARCHAR(30),
  metadata    JSONB,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ─── API Usage Logs ─────────────────────────────────────────────────
CREATE TABLE api_usage_logs (
  id              VARCHAR(30) PRIMARY KEY DEFAULT encode(gen_random_bytes(15), 'hex'),
  tenant_id       VARCHAR(30) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint        VARCHAR(500) NOT NULL,
  method          VARCHAR(10) NOT NULL,
  status_code     INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_usage_logs_tenant_id ON api_usage_logs(tenant_id);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);

-- ─── Invitations ────────────────────────────────────────────────────
CREATE TABLE invitations (
  id          VARCHAR(30) PRIMARY KEY DEFAULT encode(gen_random_bytes(15), 'hex'),
  tenant_id   VARCHAR(30) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       VARCHAR(255) NOT NULL,
  role        user_role NOT NULL DEFAULT 'USER',
  token       VARCHAR(100) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at  TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_tenant_id ON invitations(tenant_id);
CREATE INDEX idx_invitations_token ON invitations(token);

-- ─── Notifications ──────────────────────────────────────────────────
CREATE TABLE notifications (
  id         VARCHAR(30) PRIMARY KEY DEFAULT encode(gen_random_bytes(15), 'hex'),
  user_id    VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id  VARCHAR(30) NOT NULL,
  type       VARCHAR(100) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);

-- ─── Auto-update updated_at trigger ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
