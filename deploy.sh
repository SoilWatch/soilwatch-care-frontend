#!/usr/bin/env bash
# Local manual deploy — staging
#
# Required env vars (set before running):
#   GCP_PROJECT_ID, GCP_REGION, AR_REPO
#   BACKEND_SERVICE_NAME, FRONTEND_SERVICE_NAME
#   NEXT_PUBLIC_MAPBOX_TOKEN
#
# Usage:
#   source .env.deploy && ./deploy.sh              # deploy both
#   source .env.deploy && ./deploy.sh --backend-only
#   source .env.deploy && ./deploy.sh --frontend-only
set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${GCP_REGION:?Set GCP_REGION}"
: "${AR_REPO:?Set AR_REPO}"
: "${BACKEND_SERVICE_NAME:?Set BACKEND_SERVICE_NAME}"
: "${FRONTEND_SERVICE_NAME:?Set FRONTEND_SERVICE_NAME}"
: "${NEXT_PUBLIC_MAPBOX_TOKEN:?Set NEXT_PUBLIC_MAPBOX_TOKEN}"
: "${NEXT_PUBLIC_API_BASE_URL_STAGING:?Set NEXT_PUBLIC_API_BASE_URL_STAGING}"

AR="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/soilwatch-care-api"

DEPLOY_BE=true
DEPLOY_FE=true
for arg in "$@"; do
  [[ $arg == --backend-only  ]] && DEPLOY_FE=false
  [[ $arg == --frontend-only ]] && DEPLOY_BE=false
done

gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

# ── Backend ──────────────────────────────────────────────────────────────────
if $DEPLOY_BE; then
  echo "→ Building backend..."
  docker build -f "${BACKEND_DIR}/Dockerfile.staging" \
    -t "${AR}/backend:staging" \
    "$BACKEND_DIR"
  docker push "${AR}/backend:staging"

  echo "→ Deploying backend..."
  gcloud run deploy "$BACKEND_SERVICE_NAME" \
    --image "${AR}/backend:staging" \
    --region "$GCP_REGION" \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 4 \
    --project "$GCP_PROJECT_ID" \
    --set-secrets "DATABASE_URL=staging-database-url:latest,SECRET_KEY=staging-secret-key:latest,ONA_API_TOKEN=staging-ona-api-token:latest,SMTP_PASSWORD=staging-smtp-password:latest" \
    --set-env-vars "APP_ENV=staging,DEBUG=false" \
    --set-env-vars "CLOUD_SQL_INSTANCE=${CLOUD_SQL_INSTANCE}" \
    --set-env-vars "ONA_FORM_ID=${ONA_FORM_ID}" \
    --set-env-vars "ONA_REGAIN_FORM_ID=${ONA_REGAIN_FORM_ID}" \
    --set-env-vars "ONA_CLEARANCE_FORM_ID=${ONA_CLEARANCE_FORM_ID}" \
    --set-env-vars "ONA_FIELD_TRIAL_FORM_ID=${ONA_FIELD_TRIAL_FORM_ID}" \
    --set-env-vars "GCS_BUCKET_EVIDENCE=${GCS_BUCKET_EVIDENCE}" \
    --set-env-vars "GCS_BUCKET_LAB_DOCS=${GCS_BUCKET_LAB_DOCS}" \
    --set-env-vars "GCS_BUCKET_RASTERS=${GCS_BUCKET_RASTERS}" \
    --set-env-vars "SMTP_HOST=${MAIL_SERVER}" \
    --set-env-vars "SMTP_PORT=${MAIL_PORT}" \
    --set-env-vars "SMTP_USER=${MAIL_USERNAME}" \
    --set-env-vars "SMTP_FROM=${MAIL_FROM}"
fi

BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE_NAME" \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --format "value(status.url)")
echo "Backend URL: $BACKEND_URL"

# ── Frontend ─────────────────────────────────────────────────────────────────
if $DEPLOY_FE; then
  echo "→ Building frontend..."
  docker build \
    --build-arg "NEXT_PUBLIC_MAPBOX_TOKEN=${NEXT_PUBLIC_MAPBOX_TOKEN}" \
    --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_BASE_URL_STAGING}" \
    -t "${AR}/frontend:staging" \
    "$SCRIPT_DIR"
  docker push "${AR}/frontend:staging"

  echo "→ Deploying frontend..."
  gcloud run deploy "$FRONTEND_SERVICE_NAME" \
    --image "${AR}/frontend:staging" \
    --region "$GCP_REGION" \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5 \
    --project "$GCP_PROJECT_ID" \
    --set-secrets "AUTH_SECRET=staging-auth-secret:latest" \
    --set-secrets "ONA_API_TOKEN=staging-ona-api-token:latest" \
    --set-secrets "GROQ_API_KEY=staging-groq-api-key:latest" \
    --set-env-vars "FASTAPI_URL=${NEXT_PUBLIC_API_BASE_URL_STAGING}" \
    --set-env-vars "NODE_ENV=production"
fi

FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE_NAME" \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --format "value(status.url)")

echo ""
echo "Done."
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo ""
echo "Post-deploy steps:"
echo "  1. Add BACKEND_URL=$BACKEND_URL to frontend GitHub secrets"
echo "  2. Add STAGING_FRONTEND_URL=$FRONTEND_URL to backend GitHub secrets"
echo "  3. Update backend ALLOWED_ORIGINS with $FRONTEND_URL"
